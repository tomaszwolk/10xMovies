"""
Views for myVOD project root.
"""

import logging
from django.shortcuts import redirect
from django.db import DatabaseError
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from movies.models import Platform
from .serializers import EmailTokenObtainPairSerializer, PlatformSerializer

logger = logging.getLogger(__name__)


def root_redirect(request):
    """
    Redirect root URL to API documentation.

    Users visiting http://localhost:8000/ will be redirected to
    http://localhost:8000/api/docs/ (Swagger UI).
    """
    return redirect('swagger-ui')


class EmailTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view that uses email instead of username.

    This view uses EmailTokenObtainPairSerializer to accept 'email' field
    for authentication instead of the default 'username' field.
    """
    serializer_class = EmailTokenObtainPairSerializer


class PlatformListView(APIView):
    """
    API view for retrieving all available VOD platforms.

    GET /api/platforms/

    This is a public endpoint (no authentication required).
    Returns a complete list of all VOD platforms available in the system.

    Returns:
        200: List of PlatformDto
        500: Internal server error

    Business Logic:
        - Public endpoint (no authentication)
        - Returns all platforms from database
        - Read-only data, primarily for display to users
        - No query parameters or filtering
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Get all VOD platforms",
        description=(
            "Retrieves a list of all available VOD platforms. "
            "This is a public endpoint that does not require authentication. "
            "Returns platform information including id, slug, and display name."
        ),
        responses={
            200: PlatformSerializer(many=True),
            500: OpenApiTypes.OBJECT,
        },
        tags=['Platforms'],
    )
    def get(self, request):
        """
        Handle GET request for platforms list.

        Implements guard clauses for early error returns:
        1. Query database for all platforms
        2. Serialize and return results
        """
        try:
            # Query all platforms from database
            platforms = Platform.objects.all().order_by('id')

            # Serialize results
            serializer = PlatformSerializer(platforms, many=True)

            logger.info(
                f"Successfully returned {len(serializer.data)} platforms"
            )

            return Response(serializer.data, status=status.HTTP_200_OK)

        except DatabaseError as e:
            logger.error(
                f"Database error while fetching platforms: {str(e)}",
                exc_info=True
            )
            return Response(
                {"error": "An error occurred while retrieving platforms. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception as e:
            logger.error(
                f"Unexpected error while fetching platforms: {str(e)}",
                exc_info=True
            )
            return Response(
                {"error": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
