from django.db.models import Q, Prefetch
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from movies.models import UserMovie, MovieAvailability
from .serializers import UserMovieSerializer

# Create your views here.


class UserMovieViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserMovieSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        user_platforms = user.userplatform_set.values_list('platform_id', flat=True)
        availability_prefetch = Prefetch(
            'tconst__availability_entries',
            queryset=MovieAvailability.objects.filter(platform_id__in=user_platforms),
            to_attr='availability_filtered'
        )

        queryset = UserMovie.objects.filter(user_id=user.id) \
            .select_related('tconst') \
            .prefetch_related(availability_prefetch)

        status_param = self.request.query_params.get('status')
        if status_param == 'watchlist':
            queryset = queryset.filter(
                watchlisted_at__isnull=False,
                watchlist_deleted_at__isnull=True
            )
        elif status_param == 'watched':
            queryset = queryset.filter(watched_at__isnull=False)

        is_available_param = self.request.query_params.get('is_available')
        if is_available_param == 'true':
            # Subquery to get tconsts of movies available on the user's platforms
            available_movies_tconsts = MovieAvailability.objects.filter(
                platform_id__in=user_platforms,
                is_available=True
            ).values_list('tconst', flat=True)

            queryset = queryset.filter(tconst__in=available_movies_tconsts)

        ordering_param = self.request.query_params.get('ordering')
        if ordering_param in ['-watchlisted_at', '-tconst__avg_rating']:
            queryset = queryset.order_by(ordering_param)

        return queryset

    def list(self, request, *args, **kwargs):
        status_param = request.query_params.get('status')
        if status_param not in ['watchlist', 'watched']:
            return Response(
                {"error": "Invalid or missing 'status' parameter. Choose 'watchlist' or 'watched'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().list(request, *args, **kwargs)
