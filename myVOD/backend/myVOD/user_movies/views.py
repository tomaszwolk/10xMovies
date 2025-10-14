from django.db.models import Prefetch
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from movies.models import UserMovie, MovieAvailability
from .serializers import UserMovieSerializer, UserMovieQueryParamsSerializer
from services.user_movies_service import build_user_movies_queryset

# Create your views here.


class UserMovieViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserMovieSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Fallback queryset; real queryset is constructed in list() after validation
        return UserMovie.objects.none()

    def list(self, request, *args, **kwargs):
        params = UserMovieQueryParamsSerializer(data=request.query_params)
        if not params.is_valid():
            return Response(params.errors, status=status.HTTP_400_BAD_REQUEST)

        # Only apply is_available filter if it was explicitly provided in the query string
        is_available_value = (
            params.validated_data['is_available']
            if 'is_available' in request.query_params
            else None
        )

        # Use original inline logic when is_available is not provided (matches earlier behavior/tests)
        if is_available_value is None:
            user = request.user
            user_platforms = user.userplatform_set.values_list('platform_id', flat=True)
            availability_prefetch = Prefetch(
                'tconst__availability_entries',
                queryset=MovieAvailability.objects.filter(platform_id__in=user_platforms),
                to_attr='availability_filtered'
            )
            queryset = UserMovie.objects.filter(user_id=user.id) \
                .select_related('tconst') \
                .prefetch_related(availability_prefetch)

            status_param = params.validated_data['status']
            if status_param == 'watchlist':
                queryset = queryset.filter(
                    watchlisted_at__isnull=False,
                    watchlist_deleted_at__isnull=True,
                )
            else:  # 'watched'
                queryset = queryset.filter(watched_at__isnull=False)

            ordering_param = params.validated_data.get('ordering')
            if ordering_param in ['-watchlisted_at', '-tconst__avg_rating']:
                queryset = queryset.order_by(ordering_param)
        else:
            queryset = build_user_movies_queryset(
                user=request.user,
                status_param=params.validated_data['status'],
                ordering_param=params.validated_data.get('ordering'),
                is_available=is_available_value,
            )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
