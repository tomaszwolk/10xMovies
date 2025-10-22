"""
Integration tests for movies API endpoints.

Tests the full request-response cycle for movie-related endpoints.
"""
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from movies.models import Movie  # type: ignore


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
        # Create test movies with various attributes
        cls.movie1 = Movie.objects.create(
            tconst="tt0816692",
            primary_title="Interstellar",
            start_year=2014,
            avg_rating=8.6,
            poster_path="https://image.tmdb.org/t/p/w500/test1.jpg"
        )
        cls.movie2 = Movie.objects.create(
            tconst="tt1375666",
            primary_title="Inception",
            start_year=2010,
            avg_rating=8.8,
            poster_path="https://image.tmdb.org/t/p/w500/test2.jpg"
        )
        cls.movie3 = Movie.objects.create(
            tconst="tt0468569",
            primary_title="The Dark Knight",
            start_year=2008,
            avg_rating=9.0,
            poster_path="https://image.tmdb.org/t/p/w500/test3.jpg"
        )
        cls.movie4 = Movie.objects.create(
            tconst="tt0137523",
            primary_title="Fight Club",
            start_year=1999,
            avg_rating=8.8,
            poster_path=None  # Test null poster_path
        )
        cls.movie5 = Movie.objects.create(
            tconst="tt0111161",
            primary_title="The Shawshank Redemption",
            start_year=1994,
            avg_rating=9.3,
            poster_path="https://image.tmdb.org/t/p/w500/test5.jpg"
        )

    def test_search_success_with_results(self):
        """Test successful search that returns results."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'Interstellar'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)

        # Verify the movie was found
        movie_titles = [movie['primary_title'] for movie in response.data]
        self.assertIn('Interstellar', movie_titles)

    def test_search_response_structure(self):
        """Test that response has correct structure matching MovieSearchResultDto."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'Inception'})

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
        response = self.client.get(url, {'search': 'Interstellar'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Find Interstellar in results
        interstellar = next(
            (m for m in response.data if m['tconst'] == 'tt0816692'),
            None
        )
        self.assertIsNotNone(interstellar)

        # avg_rating should be string "8.6", not decimal 8.6
        self.assertEqual(interstellar['avg_rating'], "8.6")
        self.assertIsInstance(interstellar['avg_rating'], str)

    def test_search_with_no_results(self):
        """Test search with query that returns no results."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'NonexistentMovie12345XYZ'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 0)

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

        response_lower = self.client.get(url, {'search': 'inception'})
        response_upper = self.client.get(url, {'search': 'INCEPTION'})
        response_mixed = self.client.get(url, {'search': 'InCePtIoN'})

        self.assertEqual(response_lower.status_code, status.HTTP_200_OK)
        self.assertEqual(response_upper.status_code, status.HTTP_200_OK)
        self.assertEqual(response_mixed.status_code, status.HTTP_200_OK)

        # All should find Inception
        self.assertGreater(len(response_lower.data), 0)
        self.assertGreater(len(response_upper.data), 0)
        self.assertGreater(len(response_mixed.data), 0)

    def test_search_partial_match(self):
        """Test that partial matches work (fuzzy search)."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'Dark'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should find "The Dark Knight"
        movie_titles = [movie['primary_title'] for movie in response.data]
        self.assertTrue(
            any('Dark' in title for title in movie_titles)
        )

    def test_search_with_whitespace(self):
        """Test that search handles leading/trailing whitespace."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': '  Inception  '})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        movie_titles = [movie['primary_title'] for movie in response.data]
        self.assertIn('Inception', movie_titles)

    def test_search_public_endpoint_no_auth(self):
        """Test that endpoint is public (no authentication required)."""
        url = reverse('movie-search')

        # Make request without authentication
        response = self.client.get(url, {'search': 'Interstellar'})

        # Should succeed (not 401 Unauthorized)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_with_null_poster_path(self):
        """Test that movies with null poster_path are handled correctly."""
        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'Fight Club'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Find Fight Club in results
        fight_club = next(
            (m for m in response.data if m['tconst'] == 'tt0137523'),
            None
        )
        self.assertIsNotNone(fight_club)

        # poster_path should be None (null)
        self.assertIsNone(fight_club['poster_path'])

    def test_search_with_null_avg_rating(self):
        """Test that movies with null avg_rating are handled correctly."""
        # Create movie without rating
        Movie.objects.create(
            tconst="tt9999999",
            primary_title="Unrated Movie Test",
            start_year=2020,
            avg_rating=None
        )

        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'Unrated Movie Test'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

        # Find the unrated movie
        unrated = next(
            (m for m in response.data if m['tconst'] == 'tt9999999'),
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
                tconst=f"tt888{i:04d}",
                primary_title=f"LimitTest Movie {i}",
                start_year=2000,
                avg_rating=7.0
            )

        url = reverse('movie-search')
        response = self.client.get(url, {'search': 'LimitTest Movie'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should be limited (default 20 in service)
        self.assertLessEqual(len(response.data), 20)
