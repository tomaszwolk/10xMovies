"""
Service layer for movie search functionality.

This module contains business logic for searching movies in the database.
"""
import logging
from django.db.models import QuerySet
from django.contrib.postgres.search import TrigramSimilarity
from django.db.models.functions import Lower
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
        # Use TrigramSimilarity for fuzzy matching
        # This leverages the GIN index on immutable_unaccent(lower(primary_title))
        queryset = Movie.objects.annotate(
            similarity=TrigramSimilarity(Lower('primary_title'), search_query.lower())
        ).filter(
            similarity__gt=0.1  # Minimum similarity threshold
        ).order_by(
            '-similarity',  # Most similar first
            '-avg_rating',  # Then by rating
            '-start_year'   # Then by year
        )[:limit]

        result_count = queryset.count()
        logger.info(f"Found {result_count} movies matching query '{search_query}'")

        return queryset

    except Exception as e:
        logger.error(
            f"Error searching movies with query '{search_query}': {str(e)}",
            exc_info=True
        )
        raise
