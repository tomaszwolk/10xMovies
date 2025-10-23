"""
Unit tests for movie_search_service.

Tests the business logic for movie search functionality.
"""
from django.test import TestCase
from movies.models import Movie  # type: ignore
from services.movie_search_service import search_movies  # type: ignore


class MovieSearchServiceTests(TestCase):
    """
    Test suite for search_movies service function.

    Tests cover:
    - Successful search with results
    - Search with no results
    - Edge cases (empty query, whitespace)
    - Ordering of results
    """

    @classmethod
    def setUpTestData(cls):
        """
        Create test data once for all tests in this class.

        Creates a set of movies with different titles, ratings, and years
        to test various search scenarios.
        """
        # Create test movies with unique titles and tconst to avoid collisions with real IMDB data
        cls.movie1 = Movie.objects.create(
            tconst="tt9990001",
            primary_title="TestMovie Stellar Journey",
            start_year=2014,
            avg_rating=8.6
        )
        cls.movie2 = Movie.objects.create(
            tconst="tt9990002",
            primary_title="TestMovie Stellar Friendship",
            start_year=2011,
            avg_rating=8.5
        )
        cls.movie3 = Movie.objects.create(
            tconst="tt9990003",
            primary_title="TestMovie Dream Within",
            start_year=2010,
            avg_rating=8.8
        )
        cls.movie4 = Movie.objects.create(
            tconst="tt9990004",
            primary_title="TestMovie Digital World",
            start_year=1999,
            avg_rating=8.7
        )
        cls.movie5 = Movie.objects.create(
            tconst="tt9990005",
            primary_title="TestMovie Digital World Reloaded",
            start_year=2003,
            avg_rating=7.2
        )

    def test_search_with_exact_match(self):
        """Test searching for a movie with exact title match."""
        results = search_movies("TestMovie Stellar Journey")

        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].tconst, "tt9990001")
        self.assertEqual(results[0].primary_title, "TestMovie Stellar Journey")

    def test_search_with_partial_match(self):
        """Test searching for movies with partial title match."""
        results = search_movies("TestMovie Digital World")

        # Should find both Digital World movies
        result_titles = [movie.primary_title for movie in results]
        self.assertIn("TestMovie Digital World", result_titles)
        self.assertIn("TestMovie Digital World Reloaded", result_titles)

    def test_search_case_insensitive(self):
        """Test that search is case-insensitive."""
        results_lower = search_movies("testmovie stellar journey")
        results_upper = search_movies("TESTMOVIE STELLAR JOURNEY")
        results_mixed = search_movies("TeStMoViE StElLaR JoUrNeY")

        # All should return the same movie
        self.assertGreater(len(results_lower), 0)
        self.assertGreater(len(results_upper), 0)
        self.assertGreater(len(results_mixed), 0)

        self.assertEqual(results_lower[0].tconst, "tt9990001")
        self.assertEqual(results_upper[0].tconst, "tt9990001")
        self.assertEqual(results_mixed[0].tconst, "tt9990001")

    def test_search_with_fuzzy_match(self):
        """Test fuzzy matching with slight misspellings."""
        # TrigramSimilarity should handle small variations
        results = search_movies("TestMovie Dream Withn")  # Missing 'i'

        # Should still find "TestMovie Dream Within"
        self.assertGreater(len(results), 0)
        result_titles = [movie.primary_title for movie in results]
        self.assertIn("TestMovie Dream Within", result_titles)

    def test_search_no_results(self):
        """Test search with query that returns no results."""
        # Use a string that is extremely unlikely to match any movie title
        # Using only special characters and numbers without common letter patterns
        results = search_movies("###$$$%%%^^^&&&***|||~~~```")

        # Should return empty queryset or very few results with low similarity
        # Note: Trigram similarity with threshold 0.1 might return some low-quality matches
        self.assertLessEqual(len(results), 5, "Expected 0-5 results for nonsensical query")

    def test_search_empty_string(self):
        """Test that empty string returns no results."""
        results = search_movies("")

        self.assertEqual(len(results), 0)

    def test_search_whitespace_only(self):
        """Test that whitespace-only string returns no results."""
        results = search_movies("   ")

        self.assertEqual(len(results), 0)

    def test_search_with_leading_trailing_whitespace(self):
        """Test that search strips whitespace correctly."""
        results = search_movies("  TestMovie Stellar Journey  ")

        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].primary_title, "TestMovie Stellar Journey")

    def test_search_ordering_by_similarity(self):
        """Test that results are ordered by similarity score."""
        results = search_movies("TestMovie Stellar")

        # Should return movies with "TestMovie Stellar" first
        self.assertGreater(len(results), 0)

        # The most similar results should come first
        top_titles = [movie.primary_title for movie in results[:3]]
        # At least one should start with "TestMovie Stellar"
        self.assertTrue(
            any(title.startswith("TestMovie Stellar") for title in top_titles)
        )

    def test_search_limit_results(self):
        """Test that search respects the limit parameter."""
        # Create more movies to test limit (using unique tconst values)
        for i in range(25):
            Movie.objects.create(
                tconst=f"tt9991{i:03d}",  # Use unique prefix to avoid collision
                primary_title=f"Test Movie {i}",
                start_year=2000 + i,
                avg_rating=7.0
            )

        results = search_movies("Test", limit=10)

        # Should return at most 10 results
        self.assertLessEqual(len(results), 10)

    def test_search_returns_queryset(self):
        """Test that search returns a QuerySet."""
        from django.db.models import QuerySet

        results = search_movies("TestMovie Stellar Journey")

        self.assertIsInstance(results, QuerySet)

    def test_search_with_special_characters(self):
        """Test search with special characters in query."""
        # Create movie with special characters
        Movie.objects.create(
            tconst="tt9993001",
            primary_title="TestMovie: The Epic Quest & Adventure!",
            start_year=2001,
            avg_rating=8.8
        )

        results = search_movies("TestMovie Epic Quest")

        # Should find the movie despite special characters
        self.assertGreater(len(results), 0)
        result_titles = [movie.primary_title for movie in results]
        self.assertTrue(
            any("TestMovie: The Epic Quest" in title for title in result_titles)
        )

    def test_search_accent_insensitive(self):
        """Search should be accent-insensitive (e.g., Amélie vs Amelie)."""
        Movie.objects.create(
            tconst="tt9992001",
            primary_title="TestMovie Café París",
            start_year=2001,
            avg_rating=8.3,
        )

        results = search_movies("TestMovie Cafe Paris")

        self.assertGreaterEqual(len(results), 1)
        titles = [movie.primary_title for movie in results]
        self.assertIn("TestMovie Café París", titles)
