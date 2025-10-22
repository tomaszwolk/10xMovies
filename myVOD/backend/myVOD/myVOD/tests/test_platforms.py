"""
Integration tests for platforms API endpoint.

Tests the full request-response cycle for the platforms endpoint.
"""
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from movies.models import Platform
from django.db import DatabaseError
from unittest.mock import patch


class PlatformListAPITests(APITestCase):
    """
    Integration tests for GET /api/platforms/ endpoint.

    Tests cover:
    - Successful retrieval of platforms (200)
    - Empty database scenario
    - Response structure validation
    - Public endpoint (no authentication required)
    - Ordering consistency
    """

    @classmethod
    def setUpTestData(cls):
        """
        Create test data once for all tests in this class.

        Creates a diverse set of platforms to test the endpoint.
        Uses get_or_create to avoid conflicts with existing data.
        """
        # Create test platforms (using get_or_create to avoid duplicates)
        cls.platform1, _ = Platform.objects.get_or_create(
            platform_slug="test-netflix",
            defaults={'platform_name': "Test Netflix"}
        )
        cls.platform2, _ = Platform.objects.get_or_create(
            platform_slug="test-hbo-max",
            defaults={'platform_name': "Test HBO Max"}
        )
        cls.platform3, _ = Platform.objects.get_or_create(
            platform_slug="test-disney-plus",
            defaults={'platform_name': "Test Disney+"}
        )
        cls.platform4, _ = Platform.objects.get_or_create(
            platform_slug="test-amazon-prime",
            defaults={'platform_name': "Test Amazon Prime Video"}
        )

    def test_get_platforms_success(self):
        """Test successful retrieval of all platforms."""
        url = reverse('platforms')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # At least our 4 test platforms should be present
        self.assertGreaterEqual(len(response.data), 4)

    def test_get_platforms_response_structure(self):
        """Test that response has correct structure matching PlatformDto."""
        url = reverse('platforms')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Validate response structure for first platform
        first_platform = response.data[0]
        self.assertIn('id', first_platform)
        self.assertIn('platform_slug', first_platform)
        self.assertIn('platform_name', first_platform)

        # Verify field types
        self.assertIsInstance(first_platform['id'], int)
        self.assertIsInstance(first_platform['platform_slug'], str)
        self.assertIsInstance(first_platform['platform_name'], str)

        # Verify only expected fields are returned (no extra fields)
        expected_fields = {'id', 'platform_slug', 'platform_name'}
        actual_fields = set(first_platform.keys())
        self.assertEqual(expected_fields, actual_fields)

    def test_get_platforms_content(self):
        """Test that response contains expected platform data."""
        url = reverse('platforms')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify our test platforms are in response
        platform_slugs = [p['platform_slug'] for p in response.data]
        self.assertIn('test-netflix', platform_slugs)
        self.assertIn('test-hbo-max', platform_slugs)
        self.assertIn('test-disney-plus', platform_slugs)
        self.assertIn('test-amazon-prime', platform_slugs)

        # Verify platform names match
        platform_names = [p['platform_name'] for p in response.data]
        self.assertIn('Test Netflix', platform_names)
        self.assertIn('Test HBO Max', platform_names)
        self.assertIn('Test Disney+', platform_names)
        self.assertIn('Test Amazon Prime Video', platform_names)

    def test_get_platforms_ordering(self):
        """Test that platforms are ordered by id."""
        url = reverse('platforms')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 1)

        # Verify ordering by id (ascending)
        ids = [p['id'] for p in response.data]
        self.assertEqual(ids, sorted(ids))

    def test_get_platforms_no_authentication_required(self):
        """Test that endpoint is public and doesn't require authentication."""
        url = reverse('platforms')

        # Make request without authentication
        self.client.credentials()  # Clear any credentials
        response = self.client.get(url)

        # Should succeed without authentication
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_platforms_multiple_requests(self):
        """Test that multiple requests return consistent results."""
        url = reverse('platforms')

        # Make multiple requests
        response1 = self.client.get(url)
        response2 = self.client.get(url)

        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        # Results should be identical
        self.assertEqual(response1.data, response2.data)

    def test_get_platforms_accepts_only_get_method(self):
        """Test that endpoint only accepts GET requests."""
        url = reverse('platforms')

        # POST should not be allowed
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # PUT should not be allowed
        response = self.client.put(url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # DELETE should not be allowed
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # PATCH should not be allowed
        response = self.client.patch(url, {})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_internal_server_error(self):
        """Endpoint should return 500 when DB raises a DatabaseError."""
        url = reverse('platforms')
        with patch('myVOD.views.Platform.objects.all', side_effect=DatabaseError("DB error")):
            response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class PlatformListEmptyDatabaseTests(APITestCase):
    """
    Tests for GET /api/platforms/ when database is empty.

    These tests verify graceful handling of empty database.
    Note: Since Platform model has managed=False, we can't easily
    create a clean test database. This test is kept for documentation
    but expects existing data.
    """

    def test_get_platforms_with_existing_data(self):
        """
        Test behavior with existing platforms in database.

        Since Platform table is not managed by Django (managed=False),
        we test that the endpoint returns existing data successfully.
        """
        url = reverse('platforms')
        response = self.client.get(url)

        # Should return 200 with list (empty or with data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # Response structure is valid regardless of count
        if len(response.data) > 0:
            first_platform = response.data[0]
            self.assertIn('id', first_platform)
            self.assertIn('platform_slug', first_platform)
            self.assertIn('platform_name', first_platform)
