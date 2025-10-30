import logging
import uuid

from django.db import transaction
from django.db.models import Exists, OuterRef, Prefetch
from django.utils import timezone

from movies.models import Movie, MovieAvailability, UserMovie, UserPlatform  # type: ignore

logger = logging.getLogger(__name__)


def _get_user_platform_ids(user_id):
    return list(
        UserPlatform.objects.filter(user_id=user_id).values_list("platform_id", flat=True)
    )


def _resolve_user_uuid(user):
    """Resolve canonical UUID for the given user (Django `users_user`)."""
    if not hasattr(user, "id"):
        raise Exception("Unable to resolve user UUID: missing id on user")

    try:
        return str(uuid.UUID(str(user.id)))
    except Exception:
        raise Exception("User id is not a valid UUID")


def build_user_movies_queryset(
    *,
    user,
    status_param: str,
    ordering_param: str | None = None,
    is_available: bool | None = None,
):
    """Builds the queryset for listing user's movies with optional filters.

    Args:
        user: The authenticated user object; must expose an `id` UUID.
        status_param: 'watchlist' or 'watched'. Required.
        ordering_param: Optional ordering field ('-watchlisted_at' or '-tconst__avg_rating').
        is_available: Optional boolean to filter by availability across user's platforms.
    """

    # Resolve canonical user UUID (custom user model has UUID id)
    supabase_user_uuid = _resolve_user_uuid(user)
    platform_ids = _get_user_platform_ids(supabase_user_uuid)

    availability_prefetch = Prefetch(
        'tconst__availability_entries',
        queryset=MovieAvailability.objects.filter(platform_id__in=platform_ids).select_related('platform'),
        to_attr='availability_filtered'
    )

    queryset = (
        UserMovie.objects.filter(user_id=supabase_user_uuid, watchlist_deleted_at__isnull=True)
        .select_related('tconst')
        .prefetch_related(availability_prefetch)
    )

    if status_param == 'watchlist':
        queryset = queryset.filter(
            watchlisted_at__isnull=False,
        )
    elif status_param == 'watched':
        queryset = queryset.filter(watched_at__isnull=False)

    if is_available is True:
        # Use EXISTS subquery for better performance (no materialized list)
        available_subquery = MovieAvailability.objects.filter(
            tconst=OuterRef('tconst'),
            platform_id__in=platform_ids,
            is_available=True,
        )
        queryset = queryset.filter(Exists(available_subquery))
    elif is_available is False:
        # Movies with at least one FALSE and NO TRUE entries on user's platforms
        has_true = MovieAvailability.objects.filter(
            tconst=OuterRef('tconst'),
            platform_id__in=platform_ids,
            is_available=True,
        )
        has_false = MovieAvailability.objects.filter(
            tconst=OuterRef('tconst'),
            platform_id__in=platform_ids,
            is_available=False,
        )
        queryset = queryset.filter(Exists(has_false)).exclude(Exists(has_true))

    if ordering_param in ['-watchlisted_at', '-tconst__avg_rating']:
        queryset = queryset.order_by(ordering_param)

    return queryset


@transaction.atomic
def add_movie_to_watchlist(*, user, tconst: str):
    """Adds a movie to user's watchlist or restores a soft-deleted entry.

    Business Logic:
    - Validates that the movie exists in the database
    - Checks for duplicate active watchlist entries (raises ValueError if found)
    - Restores soft-deleted entries if they exist
    - Creates new entries with watchlisted_at set to current timestamp
    - Returns the created/restored UserMovie instance with prefetched data

    Args:
        user: The authenticated user object with `email` attribute
        tconst: The IMDb movie identifier (e.g., 'tt0816692')

    Returns:
        UserMovie: The created or restored user_movie instance with:
            - tconst (Movie) prefetched via select_related
            - availability_filtered prefetched for user's platforms

    Raises:
        Movie.DoesNotExist: If the movie with given tconst doesn't exist
        ValueError: If the movie is already on user's active watchlist
        Exception: If Supabase user not found
    """
    # Resolve canonical user UUID for the user
    supabase_user_uuid = _resolve_user_uuid(user)

    logger.info(f"Adding movie to watchlist: user_id={supabase_user_uuid}, tconst={tconst}")

    # Guard clause: Validate movie exists
    if not Movie.objects.filter(tconst=tconst).exists():
        raise Movie.DoesNotExist(f"Movie with tconst '{tconst}' does not exist in database")

    # Guard clause: Check for ANY existing entry (active OR soft-deleted)
    # This prevents IntegrityError on unique constraint (user_id, tconst)
    existing_entry = UserMovie.objects.filter(
        user_id=supabase_user_uuid,
        tconst=tconst
    ).first()

    if existing_entry:
        # Check if it's an active watchlist entry
        is_active = (
            existing_entry.watchlisted_at is not None and
            existing_entry.watchlist_deleted_at is None
        )

        logger.info(f"Found existing user_movie id={existing_entry.id}, is_active={is_active}")

        if is_active:
            raise ValueError("Movie is already on the watchlist")

        # Entry exists but is soft-deleted or incomplete - restore it
        if existing_entry.watchlist_deleted_at is not None:
            logger.info(f"Restoring soft-deleted user_movie id={existing_entry.id}")
            existing_entry.watchlisted_at = timezone.now()
            existing_entry.watchlist_deleted_at = None
            existing_entry.save(update_fields=['watchlisted_at', 'watchlist_deleted_at'])
            user_movie = existing_entry
        else:
            # Entry exists but watchlisted_at is NULL - set it now
            logger.info(f"Updating incomplete user_movie id={existing_entry.id}")
            existing_entry.watchlisted_at = timezone.now()
            existing_entry.save(update_fields=['watchlisted_at'])
            user_movie = existing_entry
    else:
        # No existing entry - create new one
        logger.info(f"Creating new user_movie for user_id={supabase_user_uuid}, tconst={tconst}")
        user_movie = UserMovie.objects.create(
            user_id=supabase_user_uuid,
            tconst_id=tconst,
            watchlisted_at=timezone.now(),
            watchlist_deleted_at=None,
            watched_at=None,
            added_from_ai_suggestion=False
        )
        logger.info(f"Created new user_movie with id={user_movie.id}")

    # Fetch with related data for response
    platform_ids = _get_user_platform_ids(supabase_user_uuid)

    availability_prefetch = Prefetch(
        'tconst__availability_entries',
        queryset=MovieAvailability.objects.filter(
            platform_id__in=platform_ids
        ).select_related('platform'),
        to_attr='availability_filtered'
    )

    # Re-fetch the instance with all required prefetch/select_related
    user_movie = (
        UserMovie.objects
        .filter(id=user_movie.id)
        .select_related('tconst')
        .prefetch_related(availability_prefetch)
        .first()
    )

    return user_movie


@transaction.atomic
def add_movie_as_watched(*, user, tconst: str):
    """Add or update a movie as watched without affecting watchlisted_at when not needed."""

    supabase_user_uuid = _resolve_user_uuid(user)

    logger.info(f"Marking movie as watched: user_id={supabase_user_uuid}, tconst={tconst}")

    if not Movie.objects.filter(tconst=tconst).exists():
        raise Movie.DoesNotExist(f"Movie with tconst '{tconst}' does not exist in database")

    existing_entry = UserMovie.objects.filter(
        user_id=supabase_user_uuid,
        tconst=tconst
    ).first()

    created = False

    if existing_entry:
        if existing_entry.watched_at is not None:
            raise ValueError("Movie is already marked as watched")

        update_fields = ['watched_at']
        existing_entry.watched_at = timezone.now()

        if existing_entry.watchlist_deleted_at is not None:
            existing_entry.watchlist_deleted_at = None
            update_fields.append('watchlist_deleted_at')

        existing_entry.save(update_fields=update_fields)
        user_movie = existing_entry
    else:
        user_movie = UserMovie.objects.create(
            user_id=supabase_user_uuid,
            tconst_id=tconst,
            watchlisted_at=None,
            watchlist_deleted_at=None,
            watched_at=timezone.now(),
            added_from_ai_suggestion=False
        )
        created = True

    platform_ids = _get_user_platform_ids(supabase_user_uuid)

    availability_prefetch = Prefetch(
        'tconst__availability_entries',
        queryset=MovieAvailability.objects.filter(
            platform_id__in=platform_ids
        ).select_related('platform'),
        to_attr='availability_filtered'
    )

    user_movie = (
        UserMovie.objects
        .filter(id=user_movie.id)
        .select_related('tconst')
        .prefetch_related(availability_prefetch)
        .first()
    )

    return user_movie, created


@transaction.atomic
def update_user_movie(*, user, user_movie_id: int, action: str):
    """Updates a user-movie entry to mark as watched or restore to watchlist.

    Business Logic:
    - Authorization: Ensures the user_movie belongs to the authenticated user
    - mark_as_watched: Sets watched_at to current timestamp
      - Precondition: Movie must be on watchlist and NOT already watched
      - Preserves watchlisted_at (does not change original watchlist date)
    - restore_to_watchlist: Clears watched_at (sets to NULL)
      - Precondition: Movie must be marked as watched
    - Returns the updated UserMovie with full data (movie, availability)

    Args:
        user: The authenticated user object with `email` attribute
        user_movie_id: The ID of the user_movie entry to update
        action: 'mark_as_watched' or 'restore_to_watchlist'

    Returns:
        UserMovie: The updated user_movie instance with:
            - tconst (Movie) prefetched via select_related
            - availability_filtered prefetched for user's platforms

    Raises:
        UserMovie.DoesNotExist: If user_movie not found or doesn't belong to user
        ValueError: If business logic preconditions are violated
        Exception: If Supabase user not found
    """
    # Resolve canonical user UUID for the user
    supabase_user_uuid = _resolve_user_uuid(user)

    # Guard clause: Fetch the user_movie and ensure it belongs to authenticated user
    try:
        user_movie = UserMovie.objects.get(id=user_movie_id, user_id=supabase_user_uuid)
    except UserMovie.DoesNotExist:
        raise UserMovie.DoesNotExist(
            f"UserMovie with id {user_movie_id} not found or does not belong to user"
        )

    # Note: We don't check soft-deleted status here because business logic
    # for each action should determine the appropriate error message
    # (e.g., "must be on watchlist" for mark_as_watched)

    # Handle mark_as_watched action
    if action == 'mark_as_watched':
        # Precondition: Movie must be on watchlist (not soft-deleted) and NOT watched
        if user_movie.watchlisted_at is None or user_movie.watchlist_deleted_at is not None:
            raise ValueError("Movie must be on watchlist to mark as watched")
        if user_movie.watched_at is not None:
            raise ValueError("Movie is already marked as watched")

        # Update watched_at to current timestamp
        user_movie.watched_at = timezone.now()
        user_movie.save(update_fields=['watched_at'])

    # Handle restore_to_watchlist action
    elif action == 'restore_to_watchlist':
        # Precondition: Movie must be marked as watched
        if user_movie.watched_at is None:
            raise ValueError("Movie is not marked as watched, cannot restore to watchlist")

        # Clear watched_at (set to NULL)
        user_movie.watched_at = None
        user_movie.save(update_fields=['watched_at'])

    # Fetch with related data for response
    platform_ids = _get_user_platform_ids(supabase_user_uuid)

    availability_prefetch = Prefetch(
        'tconst__availability_entries',
        queryset=MovieAvailability.objects.filter(
            platform_id__in=platform_ids
        ).select_related('platform'),
        to_attr='availability_filtered'
    )

    # Re-fetch the instance with all required prefetch/select_related
    user_movie = (
        UserMovie.objects
        .filter(id=user_movie.id)
        .select_related('tconst')
        .prefetch_related(availability_prefetch)
        .first()
    )

    return user_movie


@transaction.atomic
def delete_user_movie_soft(*, user, user_movie_id: int):
    """Soft-deletes a user-movie entry.

    Business Logic:
    - Authorization: Ensures the user_movie belongs to the authenticated user
    - Sets watchlist_deleted_at to current timestamp
    - Returns the updated UserMovie with full data (movie, availability)

    Args:
        user: The authenticated user object with `email` attribute
        user_movie_id: The ID of the user_movie entry to delete

    Returns:
        UserMovie: The updated user_movie instance with:
            - tconst (Movie) prefetched via select_related
            - availability_filtered prefetched for user's platforms

    Raises:
        UserMovie.DoesNotExist: If user_movie not found or doesn't belong to user
        Exception: If Supabase user not found
    """
    # Resolve canonical user UUID for the user
    supabase_user_uuid = _resolve_user_uuid(user)

    # Guard clause: Fetch the user_movie and ensure it belongs to authenticated user
    try:
        user_movie = UserMovie.objects.get(id=user_movie_id, user_id=supabase_user_uuid)
    except UserMovie.DoesNotExist:
        raise UserMovie.DoesNotExist(
            f"UserMovie with id {user_movie_id} not found or does not belong to user"
        )

    # Guard clause: Check if already soft-deleted
    if user_movie.watchlist_deleted_at is not None:
        raise UserMovie.DoesNotExist(
            f"UserMovie with id {user_movie_id} not found or does not belong to user"
        )

    # Soft-delete the user_movie
    user_movie.watchlist_deleted_at = timezone.now()
    user_movie.save(update_fields=['watchlist_deleted_at'])

    # No response body needed for DELETE 204 in view → avoid extra re-fetch
    return user_movie
