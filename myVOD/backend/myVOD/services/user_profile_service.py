"""
Service layer for user profile operations.

This module contains business logic for retrieving and updating user profiles,
including platform selections.
"""

import logging
from django.db import transaction, DatabaseError
from django.contrib.auth import get_user_model
from movies.models import Platform, UserPlatform

logger = logging.getLogger(__name__)

User = get_user_model()


def get_user_profile(user):
    """
    Retrieve user profile with selected platforms.

    This function implements business logic for GET /api/me/

    Args:
        user: Authenticated Django User instance

    Returns:
        dict: User profile data with structure:
            {
                'email': str,
                'platforms': [PlatformDto, ...]
            }

    Raises:
        DatabaseError: If database query fails
    """
    try:
        # Get user's platform IDs
        user_platform_ids = UserPlatform.objects.filter(
            user_id=user.id
        ).values_list('platform_id', flat=True)

        # Fetch platform details
        platforms = Platform.objects.filter(
            id__in=user_platform_ids
        ).order_by('id')

        logger.info(
            f"Successfully retrieved profile for user {user.email} "
            f"with {len(platforms)} platforms"
        )

        return {
            'email': user.email,
            'platforms': list(platforms)
        }

    except DatabaseError as e:
        logger.error(
            f"Database error while fetching user profile for {user.email}: {str(e)}",
            exc_info=True
        )
        raise


def update_user_platforms(user, platform_ids: list[int]):
    """
    Update user's platform selections.

    This function implements business logic for PATCH /api/me/
    Performs idempotent sync: deletes platforms not in the list,
    inserts missing platforms, keeps existing unchanged.

    All operations are wrapped in a single transaction to ensure
    atomicity and consistency.

    Args:
        user: Authenticated Django User instance
        platform_ids: List of platform IDs to associate with user

    Returns:
        dict: Updated user profile data with structure:
            {
                'email': str,
                'platforms': [PlatformDto, ...]
            }

    Raises:
        DatabaseError: If database operation fails
        ValueError: If platform_ids validation fails (should be caught by serializer)
    """
    try:
        with transaction.atomic():
            # Get current user platforms
            current_platform_ids = set(
                UserPlatform.objects.filter(
                    user_id=user.id
                ).values_list('platform_id', flat=True)
            )

            new_platform_ids = set(platform_ids)

            # Determine what to delete and what to add
            to_delete = current_platform_ids - new_platform_ids
            to_add = new_platform_ids - current_platform_ids

            # Delete platforms not in the new list
            if to_delete:
                deleted_count = UserPlatform.objects.filter(
                    user_id=user.id,
                    platform_id__in=to_delete
                ).delete()[0]

                logger.info(
                    f"Deleted {deleted_count} platform associations for user {user.email}"
                )

            # Insert new platforms
            if to_add:
                new_records = [
                    UserPlatform(user_id=user.id, platform_id=platform_id)
                    for platform_id in to_add
                ]
                UserPlatform.objects.bulk_create(
                    new_records,
                    ignore_conflicts=True  # Handle race conditions
                )

                logger.info(
                    f"Added {len(to_add)} platform associations for user {user.email}"
                )

            # Fetch updated platform details
            platforms = Platform.objects.filter(
                id__in=platform_ids
            ).order_by('id')

            logger.info(
                f"Successfully updated platforms for user {user.email} "
                f"to {len(platforms)} platforms"
            )

            return {
                'email': user.email,
                'platforms': list(platforms)
            }

    except DatabaseError as e:
        logger.error(
            f"Database error while updating platforms for {user.email}: {str(e)}",
            exc_info=True
        )
        raise
