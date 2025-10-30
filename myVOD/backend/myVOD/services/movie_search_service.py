"""Service layer for movie search functionality."""

import logging
import time
import unicodedata
from dataclasses import dataclass, field
from typing import Dict, List, Tuple

from django.conf import settings
from django.contrib.postgres.search import TrigramSimilarity
from django.core.cache import cache
from django.db import connection, models
from django.db.models import F
from django.db.models.functions import Lower

from movies.models import Movie  # type: ignore
from movies.serializers import MovieSearchResultSerializer

logger = logging.getLogger(__name__)


@dataclass
class SearchTelemetry:
    """Telemetry payload describing a single movie search execution."""

    query: str
    normalized_query: str
    limit: int
    similarity_threshold: float
    query_length: int
    cache_key: str
    cache_status: str = "miss"
    strategy: str = "accent_insensitive"
    result_count: int = 0
    duration_ms: float = 0.0
    db_duration_ms: float = 0.0
    serialization_duration_ms: float = 0.0
    cache_duration_ms: float = 0.0
    db_queries_count: int | None = None
    extra: Dict[str, object] = field(default_factory=dict)

    def asdict(self) -> Dict[str, object]:
        payload: Dict[str, object] = {
            "query": self.query,
            "normalized_query": self.normalized_query,
            "limit": self.limit,
            "similarity_threshold": round(self.similarity_threshold, 2),
            "query_length": self.query_length,
            "cache_key": self.cache_key,
            "cache_status": self.cache_status,
            "strategy": self.strategy,
            "result_count": self.result_count,
            "duration_ms": round(self.duration_ms, 2),
            "db_duration_ms": round(self.db_duration_ms, 2),
            "serialization_duration_ms": round(self.serialization_duration_ms, 2),
            "cache_duration_ms": round(self.cache_duration_ms, 2),
        }
        if self.db_queries_count is not None:
            payload["db_queries_count"] = self.db_queries_count
        if self.extra:
            payload["extra"] = self.extra
        return payload


def _build_cache_key(normalized_query: str, limit: int) -> str:
    """Build cache key for movie search results."""

    return f"movie_search:{normalized_query}:{limit}"


def _get_cached_results(cache_key: str) -> List[dict] | None:
    """Safely retrieve cached search results."""

    try:
        return cache.get(cache_key)
    except Exception:  # pragma: no cover - defensive: cache backend failure shouldn't break search
        logger.warning(
            "Failed to read movie search cache for key '%s'", cache_key, exc_info=True
        )
        return None


def _store_results_in_cache(cache_key: str, payload: List[dict]) -> None:
    """Store search results in cache with configured TTL."""

    timeout = getattr(settings, "MOVIE_SEARCH_CACHE_TIMEOUT", 60)
    try:
        cache.set(cache_key, payload, timeout)
    except Exception:  # pragma: no cover - defensive
        logger.warning(
            "Failed to store movie search cache for key '%s'", cache_key, exc_info=True
        )


def _normalize_search_query(raw_query: str) -> str:
    """Return a lowercase, accent-free version of the search query."""

    normalized = unicodedata.normalize("NFKD", raw_query.lower())
    return "".join(character for character in normalized if not unicodedata.combining(character))


def _calculate_similarity_threshold(normalized_query: str) -> Tuple[float, int]:
    """Pick a trigram similarity threshold using the normalized query length.

    The threshold increases with longer inputs so that PostgreSQL can leverage
    the trigram GIN index instead of scanning the whole table.
    """

    condensed_query = "".join(character for character in normalized_query if not character.isspace())
    query_length = len(condensed_query)

    if query_length <= 2:
        return 0.1, query_length
    if query_length <= 4:
        return 0.2, query_length
    return 0.4, query_length


def search_movies(search_query: str, limit: int = 20) -> List[dict]:
    """
    Search for movies using case-insensitive and accent-insensitive matching.

    This function leverages the GIN index on
    `public.immutable_unaccent(lower(primary_title))` for efficient searching.

    Implementation uses Django's TrigramSimilarity for fuzzy matching, which works
    with the pg_trgm extension and the GIN index on the database.

    Args:
        search_query: The search string to match against movie titles
        limit: Maximum number of results to return (default: 20)

    Returns:
        list[dict]: Serialized movie results ordered by similarity, rating, year.

    Raises:
        DatabaseError: If there's an issue querying the database

    Business Logic:
        - Uses PostgreSQL trigram similarity for fuzzy matching
        - Case-insensitive and accent-insensitive search
        - Returns movies ordered by similarity score (descending)
        - Limits results to prevent large response sizes
        - Caches serialized payloads for repeated queries
    """
    if not search_query or not search_query.strip():
        logger.warning("Empty search query provided to search_movies")
        return []

    search_query = search_query.strip()
    normalized_query = _normalize_search_query(search_query)
    similarity_threshold, normalized_length = _calculate_similarity_threshold(normalized_query)
    cache_key = _build_cache_key(normalized_query, limit)

    telemetry = SearchTelemetry(
        query=search_query,
        normalized_query=normalized_query,
        limit=limit,
        similarity_threshold=similarity_threshold,
        query_length=normalized_length,
        cache_key=cache_key,
    )

    cache_start = time.perf_counter()
    cached_payload = _get_cached_results(cache_key)
    telemetry.cache_duration_ms = (time.perf_counter() - cache_start) * 1000
    if cached_payload is not None:
        telemetry.cache_status = "hit"
        telemetry.result_count = len(cached_payload)
        telemetry.duration_ms = telemetry.cache_duration_ms
        logger.info(
            "Movie search served from cache",
            extra={"movie_search": telemetry.asdict()},
        )
        return cached_payload

    telemetry.cache_status = "miss"

    try:
        query_start = time.perf_counter()
        if settings.DEBUG:
            initial_query_count = len(getattr(connection, "queries", []))
        else:
            initial_query_count = None

        try:
            connection.ensure_connection()
        except Exception:
            pass

        title_expr = Lower(
            models.Func(
                F("primary_title"),
                function="immutable_unaccent",
                output_field=models.TextField(),
            )
        )
        query_str = normalized_query

        db_start = time.perf_counter()
        queryset = Movie.objects.annotate(
            similarity=TrigramSimilarity(title_expr, query_str)
        ).filter(
            similarity__gt=similarity_threshold
        ).order_by(
            "-similarity",
            F("num_votes").desc(nulls_last=True),
            "-avg_rating",
            "-start_year",
        ).only(
            "tconst",
            "primary_title",
            "start_year",
            "avg_rating",
            "poster_path",
            "num_votes",
        )[:limit]
        telemetry.db_duration_ms = (time.perf_counter() - db_start) * 1000

        serialization_start = time.perf_counter()
        serialized_results = list(
            MovieSearchResultSerializer(queryset, many=True).data
        )
        payload: List[dict] = [dict(item) for item in serialized_results]
        telemetry.serialization_duration_ms = (
            time.perf_counter() - serialization_start
        ) * 1000
        telemetry.result_count = len(payload)

        cache_store_start = time.perf_counter()
        _store_results_in_cache(cache_key, payload)
        telemetry.cache_duration_ms += (time.perf_counter() - cache_store_start) * 1000

        telemetry.duration_ms = (time.perf_counter() - query_start) * 1000

        if initial_query_count is not None:
            telemetry.db_queries_count = len(getattr(connection, "queries", [])) - initial_query_count

        logger.info(
            "Movie search executed",
            extra={"movie_search": telemetry.asdict()},
        )
        return payload

    except Exception:
        telemetry.strategy = "fallback"
        telemetry.extra["fallback_reason"] = "immutable_unaccent_failure"
        logger.warning(
            "immutable_unaccent unavailable; falling back to case-insensitive search without accent removal",
            exc_info=True,
        )

        fallback_start = time.perf_counter()
        if settings.DEBUG:
            initial_query_count = len(getattr(connection, "queries", []))
        else:
            initial_query_count = None

        title_expr = Lower(F("primary_title"))
        query_str = search_query.lower()

        db_start = time.perf_counter()
        queryset = Movie.objects.annotate(
            similarity=TrigramSimilarity(title_expr, query_str)
        ).filter(
            similarity__gt=similarity_threshold
        ).order_by(
            "-similarity",
            F("num_votes").desc(nulls_last=True),
            "-avg_rating",
            "-start_year",
        ).only(
            "tconst",
            "primary_title",
            "start_year",
            "avg_rating",
            "poster_path",
            "num_votes",
        )[:limit]
        telemetry.db_duration_ms = (time.perf_counter() - db_start) * 1000

        serialization_start = time.perf_counter()
        serialized_results = list(
            MovieSearchResultSerializer(queryset, many=True).data
        )
        payload = [dict(item) for item in serialized_results]
        telemetry.serialization_duration_ms = (
            time.perf_counter() - serialization_start
        ) * 1000
        telemetry.result_count = len(payload)

        cache_store_start = time.perf_counter()
        _store_results_in_cache(cache_key, payload)
        telemetry.cache_duration_ms += (time.perf_counter() - cache_store_start) * 1000

        telemetry.duration_ms = (time.perf_counter() - fallback_start) * 1000

        if initial_query_count is not None:
            telemetry.db_queries_count = len(getattr(connection, "queries", [])) - initial_query_count

        logger.info(
            "Movie search executed (fallback)",
            extra={"movie_search": telemetry.asdict()},
        )
        return payload
