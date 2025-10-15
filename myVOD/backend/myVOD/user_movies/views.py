import logging
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import DatabaseError
from movies.models import UserMovie
from .serializers import UserMovieSerializer, UserMovieQueryParamsSerializer
from services.user_movies_service import build_user_movies_queryset

logger = logging.getLogger(__name__)

# Create your views here.


class UserMovieViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for retrieving user's movies (watchlist and watched history).

    Endpoints:
        GET /api/user-movies/?status=watchlist - retrieve user's watchlist
        GET /api/user-movies/?status=watched - retrieve watched history

    Query Parameters:
        - status (required): 'watchlist' or 'watched'
        - ordering (optional): '-watchlisted_at' or '-tconst__avg_rating'
        - is_available (optional): boolean to filter by availability
    """
    serializer_class = UserMovieSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination for this endpoint (MVP)

    def get_queryset(self):
        # Fallback queryset; real queryset is constructed in list() after validation
        return UserMovie.objects.none()

    def list(self, request, *args, **kwargs):
        """
        List user's movies with filtering and ordering.

        Implements business logic:
        - Row Level Security (filters by authenticated user)
        - Status filtering (watchlist vs watched)
        - Availability filtering (available/unavailable on user's platforms)
        - Ordering support

        Returns:
            200: List of UserMovieDto
            400: Invalid query parameters
            401: Not authenticated
            500: Internal server error
        """
        # Validate query parameters
        params = UserMovieQueryParamsSerializer(data=request.query_params)
        if not params.is_valid():
            logger.warning(
                f"Invalid query parameters for user {request.user.id}: {params.errors}"
            )
            return Response(params.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Use service layer for all queryset building
            queryset = build_user_movies_queryset(
                user=request.user,
                status_param=params.validated_data['status'],
                ordering_param=params.validated_data.get('ordering'),
                is_available=params.validated_data.get('is_available'),
            )

            # Handle pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            # Serialize and return response
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        except DatabaseError as e:
            logger.error(
                f"Database error while fetching user movies for user {request.user.id}: {str(e)}",
                exc_info=True
            )
            return Response(
                {"detail": "A database error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            logger.error(
                f"Unexpected error while fetching user movies for user {request.user.id}: {str(e)}",
                exc_info=True
            )
            return Response(
                {"detail": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
