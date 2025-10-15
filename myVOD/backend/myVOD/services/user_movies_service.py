from django.db.models import Prefetch, Exists, OuterRef
from movies.models import UserMovie, MovieAvailability, UserPlatform


def _get_user_platform_ids(user_id):
    return list(
        UserPlatform.objects.filter(user_id=user_id).values_list("platform_id", flat=True)
    )


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

    platform_ids = _get_user_platform_ids(user.id)

    availability_prefetch = Prefetch(
        'tconst__availability_entries',
        queryset=MovieAvailability.objects.filter(platform_id__in=platform_ids).select_related('platform'),
        to_attr='availability_filtered'
    )

    queryset = (
        UserMovie.objects.filter(user_id=user.id)
        .select_related('tconst')
        .prefetch_related(availability_prefetch)
    )

    if status_param == 'watchlist':
        queryset = queryset.filter(
            watchlisted_at__isnull=False,
            watchlist_deleted_at__isnull=True,
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
