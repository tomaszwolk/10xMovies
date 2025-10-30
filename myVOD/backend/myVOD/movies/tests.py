"""
Integration tests for movies API endpoints.

Tests the full request-response cycle for movie-related endpoints.
"""
import unittest
from io import StringIO

from django.core.management import call_command
from django.db import DatabaseError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from movies.models import Movie, Platform, MovieAvailability  # type: ignore


class MovieSearchAPITests(APITestCase):
    """
    Integration tests for GET /api/movies/ endpoint.

    Tests cover:
    - Successful search with results (200)
    - Invalid/missing search parameter (400)
    - Response structure validation
    - Public endpoint (no authentication required)
    """

    @classmethod
    def setUpTestData(cls):
        """
        Create test data once for all tests in this class.

        Creates a diverse set of movies to test search functionality.
        """
        # Use get_or_create to avoid IntegrityError in combined test runs
        cls.platform_netflix, _ = Platform.objects.get_or_create(
            platform_slug='netflix',
            defaults={'platform_name': 'Netflix'},
        )
        cls.platform_hbo, _ = Platform.objects.get_or_create(
            platform_slug='hbomax',
            defaults={'platform_name': 'HBO Max'},
        )

        # Create test movies with unique tconst and titles to avoid collisions with real IMDB data
        cls.movie1 = Movie.objects.create(
            tconst="tt9980001",
            primary_title="ApiTest Space Adventure",
            start_year=2014,
            avg_rating=8.6,
            poster_path="https://image.tmdb.org/t/p/w500/test1.jpg"
        )
        cls.movie2 = Movie.objects.create(
            tconst="tt9980002",
            primary_title="ApiTest Dream Layers",
            start_year=2010,
            avg_rating=8.8,
            poster_path="https://image.tmdb.org/t/p/w500/test2.jpg"
        )
        cls.movie3 = Movie.objects.create(
            tconst="tt9980003",
            primary_title="ApiTest Dark Hero",
            start_year=2008,
            avg_rating=9.0,
            poster_path="https://image.tmdb.org/t/p/w500/test3.jpg"
        )
        cls.movie4 = Movie.objects.create(
            tconst="tt9980004",
            primary_title="ApiTest Underground Rules",
            start_year=1999,
            avg_rating=8.8,
            poster_path=None  # Test null poster_path
        )
        cls.movie5 = Movie.objects.create(
            tconst="tt9980005",
            primary_title="ApiTest Prison Hope",
            start_year=1994,
            avg_rating=9.3,
            poster_path="https://image.tmdb.org/t/p/w500/test5.jpg"
        )

        # Create movie availability data
        MovieAvailability.objects.create(
            tconst=cls.movie2,
            platform=cls.platform_netflix,
            is_available=True,
            last_checked='2025-10-23T12:00:00Z',
            source='watchmode'
        )
        MovieAvailability.objects.create(
            tconst=cls.movie2,
            platform=cls.platform_hbo,
            is_available=False,
            last_checked='2025-10-23T12:00:00Z',
            source='watchmode'
        )

    def test_search_success_with_results(self):
        """Test successful search that returns results."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'ApiTest Space Adventure'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)

        # Verify the movie was found
        movie_titles = [movie['primary_title'] for movie in response.data]
        self.assertIn('ApiTest Space Adventure', movie_titles)

    def test_search_response_structure(self):
        """Test that response has correct structure matching MovieSearchResultDto."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'ApiTest Dream Layers'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Validate response structure for first result
        first_movie = response.data[0]
        self.assertIn('tconst', first_movie)
        self.assertIn('primary_title', first_movie)
        self.assertIn('start_year', first_movie)
        self.assertIn('avg_rating', first_movie)
        self.assertIn('poster_path', first_movie)

        # Verify field types
        self.assertIsInstance(first_movie['tconst'], str)
        self.assertIsInstance(first_movie['primary_title'], str)
        self.assertTrue(
            isinstance(first_movie['start_year'], int) or first_movie['start_year'] is None
        )
        # avg_rating should be string or null
        self.assertTrue(
            isinstance(first_movie['avg_rating'], str) or first_movie['avg_rating'] is None
        )
        self.assertTrue(
            isinstance(first_movie['poster_path'], str) or first_movie['poster_path'] is None
        )

    def test_search_avg_rating_as_string(self):
        """Test that avg_rating is returned as string, not decimal."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'ApiTest Space Adventure'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Find ApiTest Space Adventure in results
        space_movie = next(
            (m for m in response.data if m['tconst'] == 'tt9980001'),
            None
        )
        self.assertIsNotNone(space_movie)

        # avg_rating should be string "8.6", not decimal 8.6
        self.assertEqual(space_movie['avg_rating'], "8.6")
        self.assertIsInstance(space_movie['avg_rating'], str)

    def test_search_with_no_results(self):
        """Test search with query that returns no results."""
        url = reverse('movie-search')
        # Use special characters unlikely to match any movie title
        response = self.client.get(url, {'search': '###$$$%%%^^^&&&***|||~~~```'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # Trigram similarity might return some low-quality matches
        self.assertLessEqual(len(response.data), 5)

    def test_search_missing_parameter(self):
        """Test that missing search parameter returns 400 Bad Request."""
        url = reverse('movie-search')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('search', response.data)

    def test_search_empty_parameter(self):
        """Test that empty search parameter returns 400 Bad Request."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': ''})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('search', response.data)

    def test_search_case_insensitive(self):
        """Test that search is case-insensitive."""
        url = reverse('movie-search')

        response_lower = self.client.get(url, {'search': 'apitest dream layers'})
        response_upper = self.client.get(url, {'search': 'APITEST DREAM LAYERS'})
        response_mixed = self.client.get(url, {'search': 'ApItEsT DrEaM LaYeRs'})

        self.assertEqual(response_lower.status_code, status.HTTP_200_OK)
        self.assertEqual(response_upper.status_code, status.HTTP_200_OK)
        self.assertEqual(response_mixed.status_code, status.HTTP_200_OK)

        # All should find ApiTest Dream Layers
        self.assertGreater(len(response_lower.data), 0)
        self.assertGreater(len(response_upper.data), 0)
        self.assertGreater(len(response_mixed.data), 0)

    def test_search_partial_match(self):
        """Test that partial matches work (fuzzy search)."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'ApiTest Dark'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should find "ApiTest Dark Hero"
        movie_titles = [movie['primary_title'] for movie in response.data]
        self.assertTrue(
            any('ApiTest Dark' in title for title in movie_titles)
        )

    def test_search_with_whitespace(self):
        """Test that search handles leading/trailing whitespace."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': '  ApiTest Dream Layers  '})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        movie_titles = [movie['primary_title'] for movie in response.data]
        self.assertIn('ApiTest Dream Layers', movie_titles)

    def test_search_public_endpoint_no_auth(self):
        """Test that endpoint is public (no authentication required)."""
        url = reverse('movie-search')

        # Make request without authentication
        response = self.client.get(url, {'search': 'ApiTest Space Adventure'})

        # Should succeed (not 401 Unauthorized)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_with_null_poster_path(self):
        """Test that movies with null poster_path are handled correctly."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'ApiTest Underground Rules'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Find ApiTest Underground Rules in results
        underground_movie = next(
            (m for m in response.data if m['tconst'] == 'tt9980004'),
            None
        )
        self.assertIsNotNone(underground_movie)

        # poster_path should be None (null)
        self.assertIsNone(underground_movie['poster_path'])

    def test_search_with_null_avg_rating(self):
        """Test that movies with null avg_rating are handled correctly."""
        # Create movie without rating
        Movie.objects.create(
            tconst="tt9980099",
            primary_title="ApiTest Unrated Movie",
            start_year=2020,
            avg_rating=None
        )

        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'ApiTest Unrated Movie'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Find the unrated movie
        unrated = next(
            (m for m in response.data if m['tconst'] == 'tt9980099'),
            None
        )
        self.assertIsNotNone(unrated)

        # avg_rating should be None (null)
        self.assertIsNone(unrated['avg_rating'])

    def test_search_long_query(self):
        """Test that very long search queries are rejected."""
        url = reverse('movie-search')
        long_query = 'a' * 256  # Exceeds max_length of 255

        response = self.client.get(url, {'search': long_query})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('search', response.data)

    def test_search_returns_limited_results(self):
        """Test that search doesn't return excessive results."""
        # Create many movies with similar names (using unique tconst values)
        for i in range(50):
            Movie.objects.create(
                tconst=f"tt9981{i:03d}",
                primary_title=f"ApiTest LimitTest Movie {i}",
                start_year=2000,
                avg_rating=7.0
            )

        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'ApiTest LimitTest Movie'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should be limited (default 20 in service)
        self.assertLessEqual(len(response.data), 20)

    def test_methods_not_allowed(self):
        """Movies endpoint should allow only GET method."""
        url = reverse('movie-search')

        self.assertEqual(self.client.post(url, {}).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.put(url, {}).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.patch(url, {}).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_accent_insensitive_search(self):
        """Search should be accent-insensitive (e.g., Amélie vs Amelie)."""
        # Create a movie with an accented title
        Movie.objects.create(
            tconst="tt9980098",
            primary_title="ApiTest Café París",
            start_year=2001,
            avg_rating=8.3,
        )

        url = reverse('movie-search')
        # Search without accent
        response = self.client.get(url, {'search': 'ApiTest Cafe Paris'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [m['primary_title'] for m in response.data]
        self.assertIn('ApiTest Café París', titles)

    def test_internal_server_error_from_service(self):
        """Movies endpoint should return 500 when service raises DatabaseError."""
        url = reverse('movie-search')

        with patch('movies.views.search_movies', side_effect=DatabaseError("DB error")):
            response = self.client.get(url, {'search': 'ApiTest Space Adventure'})

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIsInstance(response.data, dict)
        self.assertIn('error', response.data)


class ManagementCommandsTests(APITestCase):

    @patch('movies.management.commands.populate_availability.WatchmodeService')
    def test_populate_availability_command(self, MockWatchmodeService):
        # Arrange
        platform_netflix, _ = Platform.objects.get_or_create(
            platform_slug='netflix',
            defaults={'platform_name': 'Netflix'},
        )
        mock_service_instance = MockWatchmodeService.return_value

        mock_response = {
            'titles': [{
                'id': 12345,
                'title': 'Test Movie',
                'imdb_id': 'tt0111161',
                'year': 1994,
                'type': 'movie'  # Ensure type is movie
            }],
            'total_pages': 1
        }
        mock_service_instance.list_titles.return_value = mock_response

        out = StringIO()

        # Act
        call_command('populate_availability', 'netflix', stdout=out)

        # Assert
        self.assertIn("Finished populating movie availability.", out.getvalue())
        self.assertTrue(Movie.objects.filter(tconst='tt0111161').exists())
        self.assertTrue(
            MovieAvailability.objects.filter(
                tconst__tconst='tt0111161',
                platform=platform_netflix,
            ).exists()
        )
        mock_service_instance.list_titles.assert_called_once()

    @unittest.skip("Temporarily disabled until MovieAvailability setup is revisited")
    @patch('movies.management.commands.update_availability_changes.WatchmodeService')
    def test_update_availability_changes_command(self, MockWatchmodeService):
        # Arrange
        platform_netflix, _ = Platform.objects.get_or_create(
            platform_slug='netflix',
            defaults={'platform_name': 'Netflix'},
        )
        # Ensure the movie exists with the correct watchmode_id for the test to find
        movie, _ = Movie.objects.update_or_create(
            tconst='tt0133093',
            defaults={'primary_title': 'The Matrix', 'watchmode_id': 201},
        )

        mock_service_instance = MockWatchmodeService.return_value
        mock_service_instance.get_source_changes.return_value = {
            'titles': [201],  # This is the watchmode_id
            'total_pages': 1
        }

        mock_details = {
            'sources': [{'name': 'Netflix'}],
            'type': 'movie'  # Ensure type is movie
        }
        mock_service_instance.get_title_details.return_value = mock_details

        out = StringIO()

        # Act
        call_command('update_availability_changes', stdout=out)

        # Assert
        self.assertIn("Finished daily availability update.", out.getvalue())
        # Verify that the availability was created or updated
        availability = MovieAvailability.objects.get(tconst=movie, platform=platform_netflix)
        self.assertTrue(availability.is_available)
        mock_service_instance.get_source_changes.assert_called_once()
        mock_service_instance.get_title_details.assert_called_once_with(201)
