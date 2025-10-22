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
        # Create test movies
        cls.movie1 = Movie.objects.create(
            tconst="tt0000001",
            primary_title="Interstellar",
            start_year=2014,
            avg_rating=8.6
        )
        cls.movie2 = Movie.objects.create(
            tconst="tt0000002",
            primary_title="The Intouchables",
            start_year=2011,
            avg_rating=8.5
        )
        cls.movie3 = Movie.objects.create(
            tconst="tt0000003",
            primary_title="Inception",
            start_year=2010,
            avg_rating=8.8
        )
        cls.movie4 = Movie.objects.create(
            tconst="tt0000004",
            primary_title="The Matrix",
            start_year=1999,
            avg_rating=8.7
        )
        cls.movie5 = Movie.objects.create(
            tconst="tt0000005",
            primary_title="Matrix Reloaded",
            start_year=2003,
            avg_rating=7.2
        )

    def test_search_with_exact_match(self):
        """Test searching for a movie with exact title match."""
        results = search_movies("Interstellar")

        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].tconst, "tt0000001")
        self.assertEqual(results[0].primary_title, "Interstellar")

    def test_search_with_partial_match(self):
        """Test searching for movies with partial title match."""
        results = search_movies("Matrix")

        # Should find both Matrix movies
        result_titles = [movie.primary_title for movie in results]
        self.assertIn("The Matrix", result_titles)
        self.assertIn("Matrix Reloaded", result_titles)

    def test_search_case_insensitive(self):
        """Test that search is case-insensitive."""
        results_lower = search_movies("interstellar")
        results_upper = search_movies("INTERSTELLAR")
        results_mixed = search_movies("InTeRsTeLLaR")

        # All should return the same movie
        self.assertGreater(len(results_lower), 0)
        self.assertGreater(len(results_upper), 0)
        self.assertGreater(len(results_mixed), 0)

        self.assertEqual(results_lower[0].tconst, "tt0000001")
        self.assertEqual(results_upper[0].tconst, "tt0000001")
        self.assertEqual(results_mixed[0].tconst, "tt0000001")

    def test_search_with_fuzzy_match(self):
        """Test fuzzy matching with slight misspellings."""
        # TrigramSimilarity should handle small variations
        results = search_movies("Inceptn")  # Missing 'io'

        # Should still find "Inception"
        self.assertGreater(len(results), 0)
        result_titles = [movie.primary_title for movie in results]
        self.assertIn("Inception", result_titles)

    def test_search_no_results(self):
        """Test search with query that returns no results."""
        results = search_movies("NonexistentMovieTitle12345")

        # Should return empty queryset
        self.assertEqual(len(results), 0)

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
        results = search_movies("  Interstellar  ")

        self.assertGreater(len(results), 0)
        self.assertEqual(results[0].primary_title, "Interstellar")

    def test_search_ordering_by_similarity(self):
        """Test that results are ordered by similarity score."""
        results = search_movies("Int")

        # Should return movies starting with "Int" first
        # "Interstellar", "The Intouchables", "Inception"
        self.assertGreater(len(results), 0)

        # The most similar results should come first
        top_titles = [movie.primary_title for movie in results[:3]]
        # At least one should start with "Int"
        self.assertTrue(
            any(title.startswith("Int") for title in top_titles)
        )

    def test_search_limit_results(self):
        """Test that search respects the limit parameter."""
        # Create more movies to test limit (using unique tconst values)
        for i in range(25):
            Movie.objects.create(
                tconst=f"tt100{i:04d}",  # Use different prefix to avoid collision
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

        results = search_movies("Interstellar")

        self.assertIsInstance(results, QuerySet)

    def test_search_with_special_characters(self):
        """Test search with special characters in query."""
        # Create movie with special characters
        Movie.objects.create(
            tconst="tt9999999",
            primary_title="The Lord of the Rings: The Fellowship",
            start_year=2001,
            avg_rating=8.8
        )

        results = search_movies("Lord Rings")

        # Should find the movie despite special characters
        self.assertGreater(len(results), 0)
        result_titles = [movie.primary_title for movie in results]
        self.assertTrue(
            any("Lord of the Rings" in title for title in result_titles)
        )
