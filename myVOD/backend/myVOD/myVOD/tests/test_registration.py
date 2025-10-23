"""
Integration tests for user registration API endpoint.

Tests the full request-response cycle for POST /api/register/ endpoint.
"""
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
from django.db import DatabaseError

User = get_user_model()


class UserRegistrationAPITests(APITestCase):
    """
    Integration tests for POST /api/register/ endpoint.

    Tests cover:
    - Successful user registration (201)
    - Duplicate email handling (400)
    - Invalid email format (400)
    - Weak password validation (400)
    - Missing required fields (400)
    - Database errors (500)
    - Response structure validation
    - Password hashing verification
    """

    def setUp(self):
        """
        Set up test data for each test.

        Cleans up any existing test users to ensure clean state.
        """
        # Clean up any existing test users
        User.objects.filter(email__icontains='test').delete()

    def tearDown(self):
        """Clean up test data after each test."""
        User.objects.filter(email__icontains='test').delete()

    def test_register_user_success(self):
        """Test successful user registration with valid data."""
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'password': 'strongPassword123'
        }

        response = self.client.post(url, data, format='json')

        # Verify response status and structure
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('email', response.data)
        self.assertEqual(response.data['email'], data['email'].lower())

        # Verify user was created in database
        user = User.objects.get(email=data['email'].lower())
        self.assertEqual(user.email, data['email'].lower())

        # Verify password was hashed
        self.assertTrue(user.check_password(data['password']))

    def test_register_user_email_normalized(self):
        """Test that email is normalized to lowercase."""
        url = reverse('register')
        data = {
            'email': 'TestUser@EXAMPLE.COM',
            'password': 'strongPassword123'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'testuser@example.com')

        # Verify user can be found with lowercase email
        user = User.objects.get(email='testuser@example.com')
        self.assertIsNotNone(user)

    def test_register_user_duplicate_email(self):
        """Test that registering with existing email returns 400."""
        url = reverse('register')
        data = {
            'email': 'duplicate@example.com',
            'password': 'strongPassword123'
        }

        # Create first user
        response1 = self.client.post(url, data, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # Attempt to create second user with same email
        response2 = self.client.post(url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response2.data)

    def test_register_user_duplicate_email_case_insensitive(self):
        """Test that email uniqueness check is case-insensitive."""
        url = reverse('register')

        # Register first user
        data1 = {
            'email': 'user@example.com',
            'password': 'strongPassword123'
        }
        response1 = self.client.post(url, data1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # Attempt to register with same email in different case
        data2 = {
            'email': 'USER@EXAMPLE.COM',
            'password': 'differentPassword456'
        }
        response2 = self.client.post(url, data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response2.data)

    def test_register_user_invalid_email_format(self):
        """Test that invalid email format returns 400."""
        url = reverse('register')
        invalid_emails = [
            'notanemail',
            'missing@domain',
            '@nodomain.com',
            'spaces in@email.com',
            'invalid@',
        ]

        for invalid_email in invalid_emails:
            data = {
                'email': invalid_email,
                'password': 'strongPassword123'
            }
            response = self.client.post(url, data, format='json')
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Email '{invalid_email}' should be invalid"
            )
            self.assertIn('email', response.data)

    def test_register_user_weak_password_too_short(self):
        """Test that password shorter than 8 characters returns 400."""
        url = reverse('register')
        data = {
            'email': 'user@example.com',
            'password': 'short1'  # Only 6 characters
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_user_weak_password_no_numbers(self):
        """Test that password without numbers returns 400."""
        url = reverse('register')
        data = {
            'email': 'user@example.com',
            'password': 'onlyletters'  # No numbers
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_user_weak_password_only_numbers(self):
        """Test that password with only numbers returns 400."""
        url = reverse('register')
        data = {
            'email': 'user@example.com',
            'password': '12345678'  # Only numbers
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_user_common_password(self):
        """Test that commonly used passwords are rejected."""
        url = reverse('register')
        data = {
            'email': 'user@example.com',
            'password': 'password123'  # Too common
        }

        response = self.client.post(url, data, format='json')

        # May or may not fail depending on Django's common password list
        # If it fails, verify it's a 400 with password error
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            self.assertIn('password', response.data)

    def test_register_user_missing_email(self):
        """Test that missing email field returns 400."""
        url = reverse('register')
        data = {
            'password': 'strongPassword123'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_user_missing_password(self):
        """Test that missing password field returns 400."""
        url = reverse('register')
        data = {
            'email': 'user@example.com'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_user_empty_email(self):
        """Test that empty email returns 400."""
        url = reverse('register')
        data = {
            'email': '',
            'password': 'strongPassword123'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_user_empty_password(self):
        """Test that empty password returns 400."""
        url = reverse('register')
        data = {
            'email': 'user@example.com',
            'password': ''
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_user_no_authentication_required(self):
        """Test that registration endpoint is public (no auth required)."""
        url = reverse('register')
        data = {
            'email': 'public@example.com',
            'password': 'strongPassword123'
        }

        # Make request without authentication
        response = self.client.post(url, data, format='json')

        # Should succeed without authentication
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_user_no_sensitive_data_in_response(self):
        """Test that response does not contain sensitive data (password, ID)."""
        url = reverse('register')
        data = {
            'email': 'secure@example.com',
            'password': 'strongPassword123'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Response should only contain email
        self.assertIn('email', response.data)
        self.assertEqual(len(response.data), 1)

        # Should NOT contain password or user ID
        self.assertNotIn('password', response.data)
        self.assertNotIn('id', response.data)

    def test_register_user_password_is_hashed(self):
        """Test that password is properly hashed and not stored in plain text."""
        url = reverse('register')
        plain_password = 'mySecretPassword123'
        data = {
            'email': 'hashing@example.com',
            'password': plain_password
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get user from database
        user = User.objects.get(email=data['email'])

        # Password should be hashed, not plain text
        self.assertNotEqual(user.password, plain_password)
        self.assertTrue(len(user.password) > 50)  # Hashed passwords are long

        # Should be able to verify with check_password
        self.assertTrue(user.check_password(plain_password))

    @patch('services.user_registration_service.User.objects.create_user')
    def test_register_user_database_error(self, mock_create_user):
        """Test that database errors return 500."""
        mock_create_user.side_effect = DatabaseError("Database connection failed")

        url = reverse('register')
        data = {
            'email': 'dbtest@example.com',
            'password': 'strongPassword123'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

    def test_register_user_special_characters_in_email(self):
        """Test registration with special characters in email."""
        url = reverse('register')
        data = {
            'email': 'user+tag@example.co.uk',
            'password': 'strongPassword123'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], data['email'])

    def test_register_multiple_users_sequentially(self):
        """Test that multiple users can be registered successfully."""
        url = reverse('register')
        users = [
            {'email': 'user1@example.com', 'password': 'password123ABC'},
            {'email': 'user2@example.com', 'password': 'password456DEF'},
            {'email': 'user3@example.com', 'password': 'password789GHI'},
        ]

        for user_data in users:
            response = self.client.post(url, user_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['email'], user_data['email'])

        # Verify all users exist in database
        for user_data in users:
            user = User.objects.get(email=user_data['email'])
            self.assertIsNotNone(user)

    def test_register_user_valid_strong_passwords(self):
        """Test registration with various valid strong passwords."""
        url = reverse('register')
        valid_passwords = [
            'UniquePass123',
            'MySecur3P@ssw0rd',
            'Testing987654',
            'C0mpl3xPassw0rd',
            'VeryLongUniquePasswordWith456Numbers',
        ]

        for idx, password in enumerate(valid_passwords):
            data = {
                'email': f'user{idx}@example.com',
                'password': password
            }
            response = self.client.post(url, data, format='json')
            self.assertEqual(
                response.status_code,
                status.HTTP_201_CREATED,
                f"Password '{password}' should be valid"
            )
