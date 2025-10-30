"""
Service layer for movie search functionality.

This module contains business logic for searching movies in the database.
"""
import logging
import unicodedata
from time import perf_counter
from django.db import connection
from django.db.models import QuerySet, F
from django.contrib.postgres.search import TrigramSimilarity
from django.db.models.functions import Lower
from django.db import models
from movies.models import Movie  # type: ignore

logger = logging.getLogger(__name__)


def search_movies(search_query: str, limit: int = 20) -> QuerySet[Movie]:
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
        QuerySet[Movie]: Ordered queryset of movies matching the search query,
                        ordered by similarity (most similar first)

    Raises:
        DatabaseError: If there's an issue querying the database

    Business Logic:
        - Uses PostgreSQL trigram similarity for fuzzy matching
        - Case-insensitive and accent-insensitive search
        - Returns movies ordered by similarity score (descending)
        - Limits results to prevent large response sizes
    """
    if not search_query or not search_query.strip():
        logger.warning("Empty search query provided to search_movies")
        return Movie.objects.none()

    search_query = search_query.strip()

    logger.info(f"Searching for movies with query: '{search_query}'")

    try:
        query_start = perf_counter()
        # Ensure the database connection is open and usable
        try:
            connection.ensure_connection()
        except Exception:
            # If ensure_connection fails, let the outer try/except handle fallback
            pass

        # Try accent-insensitive search using immutable_unaccent on the column
        # and Python-side accent removal for the query string to match behavior.
        title_expr = Lower(
            models.Func(
                F('primary_title'),
                function='immutable_unaccent',
                output_field=models.TextField(),
            )
        )
        # Remove accents from the query string so it compares fairly to unaccented title_expr
        query_str = unicodedata.normalize('NFKD', search_query.lower())
        query_str = ''.join(ch for ch in query_str if not unicodedata.combining(ch))

        queryset = Movie.objects.annotate(
            similarity=TrigramSimilarity(title_expr, query_str)
        ).filter(
            similarity__gt=0.1
        ).order_by(
            '-similarity',
            '-avg_rating',
            '-start_year'
        )[:limit]

        results = list(queryset)
        duration_ms = (perf_counter() - query_start) * 1000

        logger.info(
            "Searching movies matching query '%s' (accent-insensitive) – %d results in %.1f ms",
            search_query,
            len(results),
            duration_ms,
        )
        return queryset

    except Exception:
        # Fallback: if immutable_unaccent is unavailable (e.g., in non-PostgreSQL test DB),
        # perform case-insensitive fuzzy search without accent removal.
        logger.warning(
            "immutable_unaccent unavailable; falling back to case-insensitive search without accent removal",
            exc_info=True,
        )
        fallback_start = perf_counter()
        title_expr = Lower(F('primary_title'))
        query_str = search_query.lower()

        queryset = Movie.objects.annotate(
            similarity=TrigramSimilarity(title_expr, query_str)
        ).filter(
            similarity__gt=0.1
        ).order_by(
            '-similarity',
            '-avg_rating',
            '-start_year'
        )[:limit]

        results = list(queryset)
        duration_ms = (perf_counter() - fallback_start) * 1000

        logger.info(
            "Searching movies matching query '%s' (fallback) – %d results in %.1f ms",
            search_query,
            len(results),
            duration_ms,
        )
        return queryset
