"""
Integration tests for password change API endpoint.

Tests the full request-response cycle for POST /api/me/change-password/ endpoint.
"""
import os
import uuid
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from dotenv import load_dotenv

load_dotenv()

User = get_user_model()


class ChangePasswordAPITests(APITestCase):
    """
    Integration tests for POST /api/me/change-password/ endpoint.

    Tests cover:
    - Successful password change with correct current password (200)
    - Invalid current password (400)
    - New password doesn't meet requirements (400)
    - New password same as current password (400)
    - Missing required fields (400)
    - Authentication required (401)
    - Password hashing verification
    - New password verification after change
    - Database errors (500)
    - Response structure validation
    """

    def setUp(self):
        """
        Set up test data for each test.

        Creates test user with known password.
        """
        self.test_user_id = uuid.UUID(os.getenv("TEST_USER", str(uuid.uuid4())))

        # Get or create test user
        self.user, _ = User.objects.get_or_create(
            id=self.test_user_id,
            defaults={
                "username": f"password_test_{self.test_user_id.hex[:8]}",
                "email": "passwordtest@example.com",
            }
        )
        # Set initial password
        self.initial_password = "InitialPassword123"
        self.user.set_password(self.initial_password)
        self.user.save()
        self.user.refresh_from_db()

        self.client = APIClient()

    def tearDown(self):
        """Clean up test data."""
        # Reset password to initial for cleanup
        if self.user:
            self.user.set_password(self.initial_password)
            self.user.save()

    def test_change_password_success(self):
        """Test successful password change with correct current password."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        new_password = "NewSecurePassword456"
        data = {
            'current_password': self.initial_password,
            'new_password': new_password
        }

        response = self.client.post(url, data, format='json')

        # Verify response status and structure
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'Password changed successfully')

        # Verify password was changed in database
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))
        self.assertFalse(self.user.check_password(self.initial_password))

    def test_change_password_invalid_current_password(self):
        """Test password change with incorrect current password returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': 'WrongPassword123',
            'new_password': 'NewSecurePassword456'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', response.data)

        # Verify password was NOT changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.initial_password))
        self.assertFalse(self.user.check_password('NewSecurePassword456'))

    def test_change_password_same_as_current(self):
        """Test that new password same as current password returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': self.initial_password,
            'new_password': self.initial_password  # Same as current
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

        # Verify password was NOT changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.initial_password))

    def test_change_password_too_short(self):
        """Test that new password shorter than 8 characters returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': self.initial_password,
            'new_password': 'Short1'  # Only 6 characters
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

        # Verify password was NOT changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.initial_password))

    def test_change_password_no_numbers(self):
        """Test that new password without numbers returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': self.initial_password,
            'new_password': 'OnlyLetters'  # No numbers
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

    def test_change_password_only_numbers(self):
        """Test that new password with only numbers returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': self.initial_password,
            'new_password': '12345678'  # Only numbers
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

    def test_change_password_missing_current_password(self):
        """Test that missing current_password field returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'new_password': 'NewSecurePassword456'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', response.data)

    def test_change_password_missing_new_password(self):
        """Test that missing new_password field returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': self.initial_password
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

    def test_change_password_empty_current_password(self):
        """Test that empty current_password returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': '',
            'new_password': 'NewSecurePassword456'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', response.data)

    def test_change_password_empty_new_password(self):
        """Test that empty new_password returns 400."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': self.initial_password,
            'new_password': ''
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)

    def test_change_password_requires_authentication(self):
        """Test that endpoint requires authentication."""
        url = reverse('change-password')

        # Make request without authentication
        self.client.force_authenticate(user=None)
        data = {
            'current_password': self.initial_password,
            'new_password': 'NewSecurePassword456'
        }

        response = self.client.post(url, data, format='json')

        # Should return 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_hashes_new_password(self):
        """Test that new password is properly hashed."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        new_password = "NewHashedPassword789"
        data = {
            'current_password': self.initial_password,
            'new_password': new_password
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Get user from database
        self.user.refresh_from_db()

        # Password should be hashed, not plain text
        self.assertNotEqual(self.user.password, new_password)
        self.assertTrue(len(self.user.password) > 50)  # Hashed passwords are long

        # Should be able to verify with check_password
        self.assertTrue(self.user.check_password(new_password))
        self.assertFalse(self.user.check_password(self.initial_password))

    def test_change_password_verification_after_change(self):
        """Test that new password works for authentication after change."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        new_password = "VerifiedPassword123"
        data = {
            'current_password': self.initial_password,
            'new_password': new_password
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user can authenticate with new password
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))

        # Verify old password no longer works
        self.assertFalse(self.user.check_password(self.initial_password))

    def test_change_password_response_structure(self):
        """Test that response has correct structure."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': self.initial_password,
            'new_password': 'NewSecurePassword456'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Response should only contain message
        self.assertIn('message', response.data)
        self.assertEqual(len(response.data), 1)

        # Should NOT contain password or sensitive data
        self.assertNotIn('password', response.data)
        self.assertNotIn('current_password', response.data)
        self.assertNotIn('new_password', response.data)

    def test_change_password_valid_strong_passwords(self):
        """Test password change with various valid strong passwords."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        valid_passwords = [
            'UniquePass123',
            'MySecur3P@ssw0rd',
            'Testing987654',
            'C0mpl3xPassw0rd',
            'VeryLongUniquePasswordWith456Numbers',
        ]

        current_password = self.initial_password
        for password in valid_passwords:
            data = {
                'current_password': current_password,
                'new_password': password
            }

            response = self.client.post(url, data, format='json')
            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
                f"Password '{password}' should be valid"
            )

            # Verify password was changed
            self.user.refresh_from_db()
            self.assertTrue(self.user.check_password(password))

            # Update current password for next iteration
            current_password = password

        # Reset to initial password for cleanup
        self.user.set_password(self.initial_password)
        self.user.save()

    @patch('services.user_profile_service.User.save')
    def test_change_password_database_error(self, mock_save):
        """Test handling of database errors during password change."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        mock_save.side_effect = DatabaseError("Database connection lost")

        data = {
            'current_password': self.initial_password,
            'new_password': 'NewSecurePassword456'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

        # Verify password was NOT changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.initial_password))

    def test_change_password_multiple_changes(self):
        """Test that password can be changed multiple times."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        passwords = [
            "FirstChange123",
            "SecondChange456",
            "ThirdChange789",
        ]

        current_password = self.initial_password
        for new_password in passwords:
            data = {
                'current_password': current_password,
                'new_password': new_password
            }

            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            # Verify password was changed
            self.user.refresh_from_db()
            self.assertTrue(self.user.check_password(new_password))
            self.assertFalse(self.user.check_password(current_password))

            # Update current password for next iteration
            current_password = new_password

        # Reset to initial password for cleanup
        self.user.set_password(self.initial_password)
        self.user.save()

    def test_change_password_only_accepts_post(self):
        """Test that endpoint only accepts POST method."""
        url = reverse('change-password')
        self.client.force_authenticate(user=self.user)

        data = {
            'current_password': self.initial_password,
            'new_password': 'NewSecurePassword456'
        }

        # GET should not be allowed
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # PUT should not be allowed
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # PATCH should not be allowed
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # DELETE should not be allowed
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

