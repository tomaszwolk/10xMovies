"""
Views for myVOD project root.
"""

import logging
from django.shortcuts import redirect
from django.db import DatabaseError, IntegrityError
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from movies.models import Platform
from .serializers import (
    EmailTokenObtainPairSerializer,
    PlatformSerializer,
    UserProfileSerializer,
    UpdateUserProfileSerializer,
    RegisterUserSerializer,
    RegisteredUserSerializer
)
from services.user_profile_service import (
    get_user_profile,
    update_user_platforms
)
from services.user_registration_service import register_user

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


class UserProfileView(APIView):
    """
    API view for retrieving and updating user profile.

    GET /api/me/ - Retrieve current user's profile with selected platforms
    PATCH /api/me/ - Update current user's platform selections

    Authentication required for all operations.

    Returns:
        GET 200: UserProfileDto with email and platforms
        GET 401: Missing or invalid authentication
        GET 500: Internal server error

        PATCH 200: Updated UserProfileDto
        PATCH 400: Invalid platform IDs or malformed request
        PATCH 401: Missing or invalid authentication
        PATCH 500: Internal server error

    Business Logic:
        GET:
        - Returns authenticated user's email and selected platforms
        - Platforms fetched via user_platform join table

        PATCH:
        - Replaces user's current platform selections
        - Validates all platform IDs exist
        - Performs idempotent sync in a transaction
        - Deletes platforms not in request
        - Inserts missing platforms
        - Keeps existing unchanged
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get current user profile",
        description=(
            "Retrieves the profile of the currently authenticated user, "
            "including their email and selected VOD platforms. "
            "Requires JWT authentication."
        ),
        responses={
            200: UserProfileSerializer,
            401: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT,
        },
        tags=['User Profile'],
    )
    def get(self, request):
        """
        Handle GET request for user profile.

        Implements guard clauses for early error returns:
        1. User is already authenticated (permission class)
        2. Fetch user profile from service layer
        3. Serialize and return results
        """
        try:
            # Get user profile with platforms from service layer
            profile_data = get_user_profile(request.user)

            # Serialize response
            serializer = UserProfileSerializer(profile_data)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except DatabaseError as e:
            logger.error(
                f"Database error while fetching user profile: {str(e)}",
                exc_info=True
            )
            return Response(
                {"error": "An error occurred while retrieving your profile. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception as e:
            logger.error(
                f"Unexpected error while fetching user profile: {str(e)}",
                exc_info=True
            )
            return Response(
                {"error": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Update current user profile",
        description=(
            "Updates the profile of the currently authenticated user. "
            "Primarily used for managing VOD platform selections. "
            "Replaces current platform selections with the provided list. "
            "All changes are wrapped in a transaction for atomicity. "
            "Requires JWT authentication."
        ),
        request=UpdateUserProfileSerializer,
        responses={
            200: UserProfileSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT,
        },
        tags=['User Profile'],
    )
    def patch(self, request):
        """
        Handle PATCH request for updating user profile.

        Implements guard clauses for early error returns:
        1. User is already authenticated (permission class)
        2. Validate request data
        3. Update platforms via service layer
        4. Serialize and return updated profile
        """
        # Validate request data
        serializer = UpdateUserProfileSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(
                f"Invalid PATCH request for user {request.user.email}: "
                f"{serializer.errors}"
            )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Update user platforms via service layer
            platform_ids = serializer.validated_data['platforms']
            profile_data = update_user_platforms(request.user, platform_ids)

            # Serialize response
            response_serializer = UserProfileSerializer(profile_data)

            return Response(response_serializer.data, status=status.HTTP_200_OK)

        except DatabaseError as e:
            logger.error(
                f"Database error while updating user profile: {str(e)}",
                exc_info=True
            )
            return Response(
                {"error": "An error occurred while updating your profile. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception as e:
            logger.error(
                f"Unexpected error while updating user profile: {str(e)}",
                exc_info=True
            )
            return Response(
                {"error": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RegisterView(APIView):
    """
    API view for user registration.

    POST /api/register/

    This is a public endpoint (no authentication required).
    Creates a new user account with the provided email and password.

    Returns:
        201: RegisteredUserDto with email
        400: Invalid email format, weak password, or user already exists
        500: Internal server error

    Business Logic:
        - Validates email format
        - Enforces password policy: minimum 8 characters, must contain letters and numbers
        - Uses Django password validators
        - Hashes password using Django's authentication system
        - Creates user record with auto-generated UUID
        - User email must be unique
        - Returns only email in response (no sensitive data)
        - Does NOT automatically log in the user (user must call /api/token/)
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Register a new user",
        description=(
            "Creates a new user account with the provided email and password. "
            "This is a public endpoint that does not require authentication. "
            "Password must be at least 8 characters and contain both letters and numbers. "
            "Email must be unique. "
            "After successful registration, user must call /api/token/ to obtain JWT tokens."
        ),
        request=RegisterUserSerializer,
        responses={
            201: RegisteredUserSerializer,
            400: OpenApiTypes.OBJECT,
            500: OpenApiTypes.OBJECT,
        },
        tags=['Authentication'],
    )
    def post(self, request):
        """
        Handle POST request for user registration.

        Implements guard clauses for early error returns:
        1. Validate request data (email format, password strength, email uniqueness)
        2. Register user via service layer
        3. Serialize and return response
        """
        # Validate request data
        serializer = RegisterUserSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(
                f"Invalid registration request: {serializer.errors}"
            )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Register user via service layer
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            user_data = register_user(email, password)

            # Serialize response
            response_serializer = RegisteredUserSerializer(user_data)

            logger.info(f"Successfully registered user: {email}")

            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )

        except IntegrityError as e:
            # Handle race condition where user was created between validation and insertion
            logger.warning(
                f"Integrity error during registration: {str(e)}"
            )
            return Response(
                {"email": ["A user with this email already exists"]},
                status=status.HTTP_400_BAD_REQUEST
            )

        except DatabaseError as e:
            logger.error(
                f"Database error during user registration: {str(e)}",
                exc_info=True
            )
            return Response(
                {"error": "An error occurred while creating your account. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception as e:
            logger.error(
                f"Unexpected error during user registration: {str(e)}",
                exc_info=True
            )
            return Response(
                {"error": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
