"""
Service layer for AI movie suggestions.

This module contains business logic for generating and retrieving
AI-powered movie suggestions based on user's watchlist and watched history.
"""

import logging
import json
import re
from datetime import datetime, time
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
from movies.models import (
    AiSuggestionBatch,
    UserMovie,
    MovieAvailability,
    UserPlatform,
    IntegrationErrorLog,
    Movie
)

try:
    import google.generativeai as genai  # type: ignore
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None  # type: ignore
    logger = logging.getLogger(__name__)
    logger.warning("google.generativeai not installed - AI suggestions will return empty results")

logger = logging.getLogger(__name__)


class InsufficientDataError(Exception):
    """Raised when user doesn't have enough data for AI suggestions."""
    pass


class RateLimitError(Exception):
    """Raised when user has already received suggestions today."""
    pass


def get_or_generate_suggestions(user):
    """
    Get cached AI suggestions or generate new ones if needed.

    This function implements business logic for GET /api/suggestions/

    Rate Limiting:
        - One suggestion batch per calendar day (based on server timezone)
        - Cached suggestions valid until end of day (23:59:59)
        - Next suggestions available at start of next day (00:00:00)

    Args:
        user: Authenticated Django User instance

    Returns:
        dict: AI suggestions data with structure:
            {
                'expires_at': datetime,
                'suggestions': [
                    {
                        'tconst': str,
                        'primary_title': str,
                        'start_year': int or None,
                        'justification': str,
                        'availability': [
                            {
                                'platform_id': int,
                                'platform_name': str,
                                'is_available': bool
                            },
                            ...
                        ]
                    },
                    ...
                ]
            }

    Raises:
        InsufficientDataError: If user has no watchlist/watched movies
        RateLimitError: If suggestions were already generated today
        DatabaseError: If database operation fails
    """
    try:
        # Get current date (server timezone)
        now = timezone.now()
        today_start = timezone.make_aware(
            datetime.combine(now.date(), time.min)
        )
        today_end = timezone.make_aware(
            datetime.combine(now.date(), time.max)
        )

        # Check for cached suggestions from today
        cached_batch = AiSuggestionBatch.objects.filter(
            user_id=user.id,
            generated_at__gte=today_start,
            generated_at__lte=today_end
        ).order_by('-generated_at').first()

        if cached_batch:
            logger.info(
                f"Returning cached suggestions for user {user.email} "
                f"generated at {cached_batch.generated_at}"
            )
            return _format_cached_suggestions(user, cached_batch)

        # No cached suggestions - need to generate new ones
        logger.info(
            f"No cached suggestions found for user {user.email}, "
            f"generating new suggestions"
        )

        # Validate user has watchlist/watched movies
        user_movies_count = UserMovie.objects.filter(
            user_id=user.id
        ).filter(
            Q(watchlisted_at__isnull=False, watchlist_deleted_at__isnull=True) |
            Q(watched_at__isnull=False)
        ).count()

        if user_movies_count == 0:
            logger.warning(
                f"User {user.email} has no movies in watchlist or watched history"
            )
            raise InsufficientDataError(
                "You need to add movies to your watchlist or mark movies as watched "
                "before we can generate personalized suggestions."
            )

        # Validate user has VOD platforms configured
        user_platforms_count = UserPlatform.objects.filter(user_id=user.id).count()
        if user_platforms_count == 0:
            logger.warning(
                f"User {user.email} has no VOD platforms configured"
            )
            raise InsufficientDataError(
                "You need to configure at least one VOD platform in your profile "
                "before we can generate suggestions based on available content."
            )

        # Generate new suggestions
        return _generate_new_suggestions(user, today_end)

    except (InsufficientDataError, RateLimitError):
        # Re-raise business logic errors
        raise

    except DatabaseError as e:
        logger.error(
            f"Database error while fetching suggestions for {user.email}: {str(e)}",
            exc_info=True
        )
        raise


def _format_cached_suggestions(user, cached_batch):
    """
    Format cached suggestion batch into response structure.

    Args:
        user: Authenticated Django User instance
        cached_batch: AiSuggestionBatch instance

    Returns:
        dict: Formatted suggestions with availability data
    """
    # Parse suggestions from cached response
    # For MVP, we'll use a simple format
    # TODO: Implement actual AI integration and parsing
    suggestions = cached_batch.response or []

    # Get user's selected platforms
    user_platform_ids = list(
        UserPlatform.objects.filter(user_id=user.id)
        .values_list('platform_id', flat=True)
    )

    # Enrich suggestions with availability data
    enriched_suggestions = []
    for suggestion in suggestions:
        tconst = suggestion.get('tconst')
        if not tconst:
            continue

        # Get availability for user's platforms
        availability = _get_movie_availability(tconst, user_platform_ids)

        enriched_suggestions.append({
            'tconst': tconst,
            'primary_title': suggestion.get('primary_title'),
            'start_year': suggestion.get('start_year'),
            'justification': suggestion.get('justification', ''),
            'availability': availability
        })

    return {
        'expires_at': cached_batch.expires_at,
        'suggestions': enriched_suggestions
    }


def _generate_new_suggestions(user, expires_at):
    """
    Generate new AI suggestions and cache them.

    Args:
        user: Authenticated Django User instance
        expires_at: Expiration datetime (end of current day)

    Returns:
        dict: Generated suggestions with availability data

    Raises:
        DatabaseError: If database operation fails
    """
    try:
        with transaction.atomic():
            # Get user's watchlist and watched movies
            user_movies = UserMovie.objects.filter(
                user_id=user.id
            ).filter(
                Q(watchlisted_at__isnull=False, watchlist_deleted_at__isnull=True) |
                Q(watched_at__isnull=False)
            ).select_related('tconst').values(
                'tconst__tconst',
                'tconst__primary_title',
                'tconst__genres',
                'tconst__start_year',
                'watchlisted_at',
                'watched_at'
            )[:50]  # Limit for API call

            # Get user's platforms
            user_platform_ids = list(
                UserPlatform.objects.filter(user_id=user.id)
                .values_list('platform_id', flat=True)
            )

            # Generate AI suggestions with error handling
            try:
                # Call Gemini AI integration
                suggestions_data = _generate_mock_suggestions(
                    user,
                    user_movies,
                    user_platform_ids
                )

                logger.info(
                    f"Successfully generated AI suggestions for user {user.email}"
                )

            except Exception as ai_error:
                # Log integration error to database
                _log_integration_error(
                    api_type="gemini",
                    error_message=str(ai_error),
                    error_details={
                        "user_id": str(user.id),
                        "user_email": user.email,
                        "movie_count": len(user_movies),
                        "error_type": type(ai_error).__name__
                    },
                    user_id=user.id
                )

                logger.error(
                    f"AI generation error for user {user.email}: {str(ai_error)}",
                    exc_info=True
                )

                # For MVP, return empty suggestions on AI failure
                # This allows the endpoint to work even without AI integration
                suggestions_data = []

            # Cache the suggestions (even if empty)
            batch = AiSuggestionBatch.objects.create(
                user_id=user.id,
                expires_at=expires_at,
                prompt=f"Generate suggestions for user based on {len(user_movies)} movies",
                response=suggestions_data
            )

            logger.info(
                f"Cached suggestions for user {user.email} "
                f"(batch_id={batch.id}, count={len(suggestions_data)})"
            )

            # Format and return
            return _format_cached_suggestions(user, batch)

    except DatabaseError as e:
        logger.error(
            f"Database error while generating suggestions for {user.email}: {str(e)}",
            exc_info=True
        )
        raise


def _generate_mock_suggestions(user, user_movies, user_platform_ids):
    """
    Generate AI-powered movie suggestions using Google Gemini.

    This function calls the Gemini API to get personalized movie recommendations
    based on the user's watchlist, watched history, and movies available on their
    subscribed VOD platforms.

    Args:
        user: Authenticated Django User instance
        user_movies: QuerySet of user's movies with related Movie data
        user_platform_ids: List of platform IDs user subscribes to

    Returns:
        list: List of suggestions in format:
            [
                {
                    "tconst": str,  # IMDb ID (e.g., "tt0468569")
                    "justification": str  # Recommendation reason (max 200 chars)
                },
                ...
            ]
            Returns empty list if Gemini is unavailable or on error.

    Note:
        - Recommends ONLY movies available on user's subscribed platforms
        - Can recommend movies from watchlist (helps users see what's available NOW)
        - Does NOT recommend already watched movies
        - All errors are caught and logged to IntegrationErrorLog
        - Returns empty list on failure (does not raise exceptions)
        - Validates all tconst IDs against Movie database
        - Maximum 5 suggestions returned
    """
    # Check if Gemini is available
    if not GEMINI_AVAILABLE:
        logger.warning(
            f"Gemini AI not available for user {user.email} - "
            f"google.generativeai not installed"
        )
        return []

    # Check if API key is configured
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not configured in settings")
        _log_integration_error(
            api_type="gemini",
            error_message="GEMINI_API_KEY not configured",
            error_details={"user_email": user.email},
            user_id=user.id
        )
        return []

    logger.info(
        f"Generating AI suggestions for user {user.email} "
        f"based on {len(user_movies)} movies and {len(user_platform_ids)} platforms"
    )

    try:
        # Configure Gemini API
        genai.configure(api_key=settings.GEMINI_API_KEY)  # type: ignore
        model = genai.GenerativeModel('gemini-1.5-flash')  # type: ignore

        # Prepare user context
        watchlist = [
            m for m in user_movies
            if m.get('watchlisted_at') and not m.get('watched_at')
        ]
        watched = [
            m for m in user_movies
            if m.get('watched_at')
        ]

        # Get available movies on user's platforms
        available_movies = _get_available_movies_for_platforms(
            user_platform_ids,
            user_movies
        )

        if not available_movies:
            logger.warning(
                f"No movies available on user {user.email}'s platforms - "
                f"cannot generate suggestions"
            )
            return []

        # Build prompt with user data and available movies
        prompt = _build_gemini_prompt(watchlist, watched, available_movies, user_platform_ids)

        logger.debug(f"Calling Gemini API with prompt length: {len(prompt)} chars")

        # Call Gemini API with timeout
        response = model.generate_content(
            prompt,
            generation_config={  # type: ignore
                'temperature': 0.7,
                'max_output_tokens': 2000,
                'top_p': 0.9,
            },
            request_options={'timeout': 30}  # type: ignore
        )

        # Parse and validate response
        suggestions = _parse_gemini_response(response.text)

        if not suggestions:
            logger.warning(
                f"Gemini returned no valid suggestions for user {user.email}"
            )
            return []

        # Validate tconst IDs against database
        valid_suggestions = _validate_suggestions(suggestions, user_movies)

        logger.info(
            f"Successfully generated {len(valid_suggestions)} AI suggestions "
            f"for user {user.email}"
        )

        return valid_suggestions[:5]  # Return max 5 suggestions

    except Exception as e:
        logger.error(
            f"Gemini API error for user {user.email}: {str(e)}",
            exc_info=True
        )
        _log_integration_error(
            api_type="gemini",
            error_message=str(e),
            error_details={
                "user_email": user.email,
                "user_movies_count": len(user_movies),
                "error_type": type(e).__name__,
                "watchlist_count": len([m for m in user_movies if m.get('watchlisted_at')]),
                "watched_count": len([m for m in user_movies if m.get('watched_at')])
            },
            user_id=user.id
        )
        return []  # Return empty list on error


def _get_available_movies_for_platforms(user_platform_ids, user_movies):
    """
    Get movies available on user's subscribed VOD platforms.

    Queries MovieAvailability to find movies that are available (is_available=True)
    on the user's platforms, excluding only movies already watched.

    Movies on watchlist are INCLUDED - this helps users discover which movies
    from their wishlist are currently available to watch.

    Args:
        user_platform_ids: List of platform IDs user subscribes to
        user_movies: QuerySet of user's current movies

    Returns:
        list: Available movies with details, limited to 100 most popular
    """
    if not user_platform_ids:
        return []

    # Get set of watched movie tconst IDs to exclude
    # NOTE: We intentionally DON'T exclude watchlisted movies - AI should be able
    # to recommend movies from watchlist that are available on user's platforms
    watched_tconsts = set()
    for movie in user_movies:
        if movie.get('watched_at'):  # Only exclude actually watched movies
            tconst = movie.get('tconst__tconst')
            if tconst:
                watched_tconsts.add(tconst)

    # Query movies available on user's platforms
    # Exclude only watched movies (watchlisted movies are OK to recommend)
    available_movies = MovieAvailability.objects.filter(
        platform_id__in=user_platform_ids,
        is_available=True
    ).exclude(
        tconst__in=watched_tconsts
    ).select_related(
        'tconst', 'platform'
    ).values(
        'tconst__tconst',
        'tconst__primary_title',
        'tconst__start_year',
        'tconst__genres',
        'tconst__avg_rating',
        'tconst__num_votes',
        'platform__platform_name'
    ).order_by(
        '-tconst__num_votes',  # Prioritize popular movies
        '-tconst__avg_rating'
    )[:100]  # Limit to top 100 to keep prompt size reasonable

    # Group by tconst and aggregate platform names
    movies_dict = {}
    for item in available_movies:
        tconst = item['tconst__tconst']
        if tconst not in movies_dict:
            movies_dict[tconst] = {
                'tconst': tconst,
                'title': item['tconst__primary_title'],
                'year': item['tconst__start_year'],
                'genres': item['tconst__genres'] or [],
                'rating': item['tconst__avg_rating'],
                'platforms': []
            }
        movies_dict[tconst]['platforms'].append(item['platform__platform_name'])

    result = list(movies_dict.values())
    logger.info(f"Found {len(result)} available movies across {len(user_platform_ids)} platforms")
    return result


def _build_gemini_prompt(watchlist, watched, available_movies, user_platform_ids):
    """
    Build a detailed prompt for Gemini AI with user's movie context and available movies.

    Args:
        watchlist: List of movie dicts from user's watchlist (not yet watched)
        watched: List of movie dicts user has already watched
        available_movies: List of movies available on user's VOD platforms
        user_platform_ids: List of platform IDs (currently unused but kept for future)

    Returns:
        str: Formatted prompt for Gemini API
    """
    prompt_parts = [
        "You are an expert movie recommendation system. Your task is to suggest movies "
        "that are CURRENTLY AVAILABLE on the user's VOD streaming platforms.",
        "",
        "## User's Subscribed VOD Platforms:",
        f"User has access to {len(user_platform_ids)} streaming platform(s).",
        "",
        "## User's Current Watchlist (movies they plan to watch):"
    ]

    if watchlist:
        for movie in watchlist[:10]:  # Limit to 10 for prompt size
            title = movie.get('tconst__primary_title', 'Unknown')
            year = movie.get('tconst__start_year', 'N/A')
            genres = movie.get('tconst__genres', [])
            genres_str = ', '.join(genres) if genres else 'N/A'
            prompt_parts.append(f"- {title} ({year}) - Genres: {genres_str}")
    else:
        prompt_parts.append("(No movies in watchlist)")

    prompt_parts.extend([
        "",
        "## Movies User Has Watched:"
    ])

    if watched:
        for movie in watched[:15]:  # Limit to 15 for prompt size
            title = movie.get('tconst__primary_title', 'Unknown')
            year = movie.get('tconst__start_year', 'N/A')
            genres = movie.get('tconst__genres', [])
            rating = movie.get('tconst__avg_rating', 'N/A')
            genres_str = ', '.join(genres) if genres else 'N/A'
            prompt_parts.append(
                f"- {title} ({year}) - Genres: {genres_str} - Rating: {rating}/10"
            )
    else:
        prompt_parts.append("(No watched movies)")

    prompt_parts.extend([
        "",
        "## Available Movies on User's Platforms:",
        f"Here are {len(available_movies)} movies currently available on the user's streaming platforms.",
        "You MUST choose suggestions ONLY from this list:",
        ""
    ])

    # Add sample of available movies (limit to keep prompt reasonable)
    for movie in available_movies[:50]:  # Show first 50 as examples
        title = movie.get('title', 'Unknown')
        year = movie.get('year', 'N/A')
        tconst = movie.get('tconst', '')
        genres = movie.get('genres', [])
        rating = movie.get('rating', 'N/A')
        platforms = ', '.join(movie.get('platforms', []))
        genres_str = ', '.join(genres) if genres else 'N/A'

        prompt_parts.append(
            f"- [{tconst}] {title} ({year}) - Genres: {genres_str} - "
            f"Rating: {rating}/10 - Platforms: {platforms}"
        )

    if len(available_movies) > 50:
        prompt_parts.append(f"... and {len(available_movies) - 50} more movies available")

    prompt_parts.extend([
        "",
        "## Your Task:",
        "Based on the user's taste and viewing history, suggest 5 movies they would likely enjoy.",
        "",
        "## CRITICAL REQUIREMENTS:",
        "1. Choose ONLY from the 'Available Movies' list above",
        "2. Match user's genre preferences from their watchlist and watched movies",
        "3. You CAN suggest movies that are on their watchlist - this helps them discover what they can watch NOW",
        "4. Do NOT suggest movies they've already watched",
        "5. Prioritize well-rated movies (higher ratings)",
        "6. Offer variety while staying within their preferences",
        "7. Use the exact tconst ID from the available movies list",
        "8. PRIORITIZE movies from their watchlist if available - they already want to see them!",
        "9. At least two suggestions must be outside of their watchlist",
        "",
        "## Response Format:",
        "Return ONLY a valid JSON array (no markdown, no code blocks, no explanatory text) "
        "with this exact structure:",
        '[',
        '  {',
        '    "tconst": "tt0468569",',
        '    "justification": "Brief reason why this movie fits their taste (max 200 characters)"',
        '  }',
        ']',
        "",
        "## Important Rules:",
        "- tconst MUST be from the available movies list above",
        "- justification MUST be under 200 characters",
        "- Return exactly 5 suggestions (or fewer if not enough matches)",
        "- Return ONLY the JSON array, nothing else",
        "",
        "Generate the suggestions now:"
    ])

    return "\n".join(prompt_parts)


def _parse_gemini_response(response_text):
    """
    Parse JSON response from Gemini API.

    Handles various response formats:
    - Pure JSON array
    - JSON wrapped in markdown code blocks
    - Text with embedded JSON

    Args:
        response_text: Raw text response from Gemini

    Returns:
        list: Parsed suggestions as list of dicts, or empty list on error
    """
    if not response_text:
        logger.warning("Empty response from Gemini")
        return []

    try:
        # Try direct JSON parse first
        suggestions = json.loads(response_text)
        if isinstance(suggestions, list):
            return suggestions

    except json.JSONDecodeError:
        # Try extracting JSON from markdown code blocks
        json_pattern = r'```(?:json)?\s*(\[.*?\])\s*```'
        matches = re.findall(json_pattern, response_text, re.DOTALL)

        if matches:
            try:
                suggestions = json.loads(matches[0])
                if isinstance(suggestions, list):
                    return suggestions
            except json.JSONDecodeError:
                pass

        # Try finding JSON array in text
        array_pattern = r'\[\s*\{.*?\}\s*\]'
        matches = re.findall(array_pattern, response_text, re.DOTALL)

        if matches:
            for match in matches:
                try:
                    suggestions = json.loads(match)
                    if isinstance(suggestions, list):
                        return suggestions
                except json.JSONDecodeError:
                    continue

    logger.error(f"Failed to parse Gemini response as JSON: {response_text[:200]}...")
    return []


def _validate_suggestions(suggestions, user_movies):
    """
    Validate suggestions from Gemini against database and user's movies.

    Checks:
    - tconst format is valid (ttXXXXXXX)
    - tconst exists in Movie database
    - Movie is not already watched (watchlisted movies are OK)
    - Justification exists and is under 200 characters

    Args:
        suggestions: List of suggestion dicts from Gemini
        user_movies: QuerySet of user's current movies

    Returns:
        list: Validated and enriched suggestions
    """
    if not suggestions or not isinstance(suggestions, list):
        return []

    # Get set of watched movie tconst IDs to avoid suggesting them
    # NOTE: Watchlisted movies are intentionally NOT excluded
    watched_tconsts = set()
    for movie in user_movies:
        if movie.get('watched_at'):  # Only exclude watched movies
            tconst = movie.get('tconst__tconst')
            if tconst:
                watched_tconsts.add(tconst)

    validated = []
    tconst_pattern = re.compile(r'^tt\d{7,}$')

    for suggestion in suggestions:
        if not isinstance(suggestion, dict):
            continue

        tconst = suggestion.get('tconst', '').strip()
        justification = suggestion.get('justification', '').strip()

        # Validate tconst format
        if not tconst or not tconst_pattern.match(tconst):
            logger.debug(f"Invalid tconst format: {tconst}")
            continue

        # Check if already watched (skip if already watched)
        if tconst in watched_tconsts:
            logger.debug(f"Skipping {tconst} - already watched by user")
            continue

        # Validate justification
        if not justification:
            justification = "Recommended based on your preferences"
        elif len(justification) > 200:
            justification = justification[:197] + "..."

        # Check if movie exists in database
        try:
            movie = Movie.objects.filter(tconst=tconst).values(
                'tconst',
                'primary_title',
                'start_year'
            ).first()

            if not movie:
                logger.debug(f"Movie {tconst} not found in database")
                continue

            # Add enriched data
            validated.append({
                'tconst': tconst,
                'primary_title': movie['primary_title'],
                'start_year': movie['start_year'],
                'justification': justification
            })

        except Exception as e:
            logger.warning(f"Error validating movie {tconst}: {str(e)}")
            continue

    logger.info(f"Validated {len(validated)} out of {len(suggestions)} suggestions")
    return validated


def _get_movie_availability(tconst, platform_ids):
    """
    Get movie availability on specified platforms.

    Args:
        tconst: Movie IMDb identifier
        platform_ids: List of platform IDs to check

    Returns:
        list: Availability information for each platform:
            [
                {
                    'platform_id': int,
                    'platform_name': str,
                    'is_available': bool
                },
                ...
            ]
    """
    if not platform_ids:
        return []

    # Query availability where is_available = True
    availability_data = MovieAvailability.objects.filter(
        tconst=tconst,
        platform_id__in=platform_ids,
        is_available=True
    ).select_related('platform').values(
        'platform_id',
        'platform__platform_name',
        'is_available'
    )

    return [
        {
            'platform_id': item['platform_id'],
            'platform_name': item['platform__platform_name'],
            'is_available': item['is_available']
        }
        for item in availability_data
    ]


def _log_integration_error(api_type, error_message, error_details=None, user_id=None):
    """
    Log integration error to database.

    Args:
        api_type: Type of API that failed (e.g., "gemini", "tmdb", "watchmode")
        error_message: Error message from the API
        error_details: Optional dict with additional error context
        user_id: Optional user ID associated with the error

    Returns:
        IntegrationErrorLog: Created error log entry
    """
    try:
        error_log = IntegrationErrorLog.objects.create(
            api_type=api_type,
            error_message=error_message,
            error_details=error_details or {},
            user_id=user_id,
            occurred_at=timezone.now()
        )

        logger.warning(
            f"Logged integration error: {api_type} - {error_message} "
            f"(log_id={error_log.id})"
        )

        return error_log

    except Exception as e:
        # Don't let logging errors break the main flow
        logger.error(
            f"Failed to log integration error: {str(e)}",
            exc_info=True
        )
