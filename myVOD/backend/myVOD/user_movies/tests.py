import uuid
from unittest.mock import Mock, patch
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from movies.models import Movie, Platform, UserMovie, MovieAvailability, UserPlatform  # type: ignore
from dotenv import load_dotenv
import os

load_dotenv()


class UserMovieAPITests(APITestCase):
    def setUp(self):
        # !!! IMPORTANT !!!
        # To make these tests pass, you MUST replace this placeholder UUID
        # with a REAL user UUID from your development database's 'auth.users' table.
        # You can get one by signing up a test user in your application.
        self.test_user_id = uuid.UUID(os.getenv("TEST_USER"))
        # Create mock user object
        self.user1 = Mock()
        self.user1.id = self.test_user_id
        self.user1.is_authenticated = True

        # This second user mock is for testing data isolation
        self.user2 = Mock()
        self.user2.id = uuid.uuid4()  # A random, non-existent user
        self.user2.is_authenticated = True
        self.user2.userplatform_set.values_list.return_value = []

        # Create Movies
        self.movie1, _ = Movie.objects.get_or_create(
            tconst="tt0000001", defaults={"primary_title": "Movie 1", "avg_rating": 8.5}
        )
        self.movie2, _ = Movie.objects.get_or_create(
            tconst="tt0000002", defaults={"primary_title": "Movie 2", "avg_rating": 9.0}
        )
        self.movie3, _ = Movie.objects.get_or_create(
            tconst="tt0000003", defaults={"primary_title": "Movie 3", "avg_rating": 7.0}
        )

        # Create Platforms
        self.platform1, _ = Platform.objects.get_or_create(
            id=1, defaults={"platform_slug": "netflix", "platform_name": "Netflix"}
        )
        self.platform2, _ = Platform.objects.get_or_create(
            id=2, defaults={"platform_slug": "hbo", "platform_name": "HBO"}
        )

        # Configure the mock to behave like a real user model regarding relations
        self.user1.userplatform_set.values_list.return_value = [self.platform1.id]

        # User 1 Platform
        UserPlatform.objects.get_or_create(
            user_id=self.user1.id, platform_id=self.platform1.id
        )

        # Movie Availability
        MovieAvailability.objects.get_or_create(
            tconst=self.movie1,
            platform=self.platform1,
            defaults={
                "is_available": True,
                "last_checked": "2023-10-01T10:00:00Z",
                "source": "test",
            },
        )
        MovieAvailability.objects.get_or_create(
            tconst=self.movie2,
            platform=self.platform1,
            defaults={
                "is_available": False,
                "last_checked": "2023-10-01T10:00:00Z",
                "source": "test",
            },
        )
        MovieAvailability.objects.get_or_create(
            tconst=self.movie3,
            platform=self.platform2,
            defaults={
                "is_available": True,
                "last_checked": "2023-10-01T10:00:00Z",
                "source": "test",
            },
        )

        # User 1 Movies (force deterministic state)
        UserMovie.objects.update_or_create(
            user_id=self.user1.id,
            tconst=self.movie1,
            defaults={
                "watchlisted_at": "2023-10-01T10:00:00Z",
                "watchlist_deleted_at": None,
                "watched_at": None,
            },
        )
        UserMovie.objects.update_or_create(
            user_id=self.user1.id,
            tconst=self.movie2,
            defaults={
                "watched_at": "2023-10-02T10:00:00Z",
                "watchlisted_at": None,
                "watchlist_deleted_at": None,
            },
        )
        UserMovie.objects.update_or_create(
            user_id=self.user1.id,
            tconst=self.movie3,
            defaults={
                "watchlisted_at": "2023-10-03T10:00:00Z",
                "watchlist_deleted_at": None,
                "watched_at": None,
            },
        )

        self.url = reverse("usermovie-list")

    def test_authentication_required(self):
        response = self.client.get(self.url)
        # 401 is correct for missing authentication (not 403)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_watchlist(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {"status": "watchlist"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["movie"]["tconst"], self.movie1.tconst)

    def test_get_watched_list(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {"status": "watched"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["movie"]["tconst"], self.movie2.tconst)

    def test_filter_by_is_available(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            self.url, {"status": "watchlist", "is_available": "true"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["movie"]["tconst"], self.movie1.tconst)

    def test_ordering_by_rating(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            self.url, {"status": "watchlist", "ordering": "-tconst__avg_rating"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["movie"]["avg_rating"], "8.5")
        self.assertEqual(response.data[1]["movie"]["avg_rating"], "7.0")

    def test_invalid_status_parameter(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {"status": "invalid_status"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_user_cannot_see_data(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.url, {"status": "watchlist"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_invalid_ordering_parameter_returns_400(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            self.url, {"status": "watchlist", "ordering": "primary_title"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_is_available_parameter_returns_400(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            self.url, {"status": "watchlist", "is_available": "foo"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_is_available_false_for_watched(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            self.url, {"status": "watched", "is_available": "false"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["movie"]["tconst"], self.movie2.tconst)

    def test_is_available_false_for_watchlist_returns_empty(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(
            self.url, {"status": "watchlist", "is_available": "false"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)


class UserMoviePostAPITests(APITestCase):
    """Tests for POST /api/user-movies/ endpoint (add to watchlist)"""

    def setUp(self):
        # Load test user from environment (real Django user)
        self.test_user_id = uuid.UUID(os.getenv("TEST_USER"))

        # Use real Django user instead of Mock
        # The test user should exist in both:
        # - Django's auth_user table
        # - Supabase's auth.users table
        from django.contrib.auth import get_user_model
        User = get_user_model()

        self.user1, _ = User.objects.get_or_create(
            id=46,  # Django user ID
            defaults={
                'email': 'test@example.com',
                'username': 'testuser',
                'is_active': True
            }
        )

        # Mock the Supabase user lookup to return our test_user_id
        self.patcher = patch('services.user_movies_service._get_supabase_user_uuid')
        self.mock_get_uuid = self.patcher.start()
        self.mock_get_uuid.return_value = str(self.test_user_id)

        # Create test movies
        self.movie1, _ = Movie.objects.get_or_create(
            tconst="tt0111161", defaults={"primary_title": "The Shawshank Redemption", "avg_rating": 9.3}
        )
        self.movie2, _ = Movie.objects.get_or_create(
            tconst="tt0068646", defaults={"primary_title": "The Godfather", "avg_rating": 9.2}
        )
        self.movie_for_restore, _ = Movie.objects.get_or_create(
            tconst="tt0071562", defaults={"primary_title": "The Godfather Part II", "avg_rating": 9.0}
        )

        # Create platforms
        self.platform1, _ = Platform.objects.get_or_create(
            id=1, defaults={"platform_slug": "netflix", "platform_name": "Netflix"}
        )
        self.platform2, _ = Platform.objects.get_or_create(
            id=2, defaults={"platform_slug": "hbo", "platform_name": "HBO Max"}
        )

        # User platforms
        UserPlatform.objects.get_or_create(
            user_id=self.test_user_id, platform_id=self.platform1.id
        )
        UserPlatform.objects.get_or_create(
            user_id=self.test_user_id, platform_id=self.platform2.id
        )

        # Movie availability
        MovieAvailability.objects.get_or_create(
            tconst=self.movie1,
            platform=self.platform1,
            defaults={
                "is_available": True,
                "last_checked": "2023-10-01T10:00:00Z",
                "source": "test",
            },
        )
        MovieAvailability.objects.get_or_create(
            tconst=self.movie1,
            platform=self.platform2,
            defaults={
                "is_available": False,
                "last_checked": "2023-10-01T10:00:00Z",
                "source": "test",
            },
        )

        # Create soft-deleted entry for restoration test
        UserMovie.objects.update_or_create(
            user_id=self.test_user_id,
            tconst=self.movie_for_restore,
            defaults={
                "watchlisted_at": "2023-10-01T10:00:00Z",
                "watchlist_deleted_at": "2023-10-05T10:00:00Z",  # Soft-deleted
                "watched_at": None,
            },
        )

        # Movie already on watchlist for duplicate test
        self.existing_movie, _ = Movie.objects.get_or_create(
            tconst="tt0468569", defaults={"primary_title": "The Dark Knight", "avg_rating": 9.0}
        )
        UserMovie.objects.update_or_create(
            user_id=self.test_user_id,
            tconst=self.existing_movie,
            defaults={
                "watchlisted_at": "2023-10-01T10:00:00Z",
                "watchlist_deleted_at": None,
                "watched_at": None,
            },
        )

        self.url = reverse("usermovie-list")

    def tearDown(self):
        """Stop the patcher after each test"""
        self.patcher.stop()

    def test_post_authentication_required(self):
        """Test that POST requires authentication"""
        response = self.client.post(self.url, {"tconst": "tt0111161"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_add_movie_successfully(self):
        """Test successfully adding a movie to watchlist"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.url, {"tconst": "tt0111161"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify response structure
        self.assertIn("id", response.data)
        self.assertIn("movie", response.data)
        self.assertIn("availability", response.data)
        self.assertIn("watchlisted_at", response.data)
        self.assertIn("watched_at", response.data)

        # Verify movie details
        self.assertEqual(response.data["movie"]["tconst"], "tt0111161")
        self.assertEqual(response.data["movie"]["primary_title"], "The Shawshank Redemption")
        self.assertEqual(response.data["movie"]["avg_rating"], "9.3")

        # Verify availability is present (as list, may be empty)
        self.assertIsInstance(response.data["availability"], list)

        # Verify timestamps
        self.assertIsNotNone(response.data["watchlisted_at"])
        self.assertIsNone(response.data["watched_at"])

        # Verify database state - use self.test_user_id (Supabase UUID)
        user_movie = UserMovie.objects.get(user_id=self.test_user_id, tconst="tt0111161")
        self.assertIsNotNone(user_movie.watchlisted_at)
        self.assertIsNone(user_movie.watchlist_deleted_at)
        self.assertIsNone(user_movie.watched_at)

    def test_post_missing_tconst(self):
        """Test POST with missing tconst field"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tconst", response.data)

    def test_post_invalid_tconst_format(self):
        """Test POST with invalid tconst format"""
        self.client.force_authenticate(user=self.user1)

        # Test various invalid formats
        invalid_tconsts = [
            "invalid",           # Not starting with 'tt'
            "tt123",             # Too few digits
            "tt123456789",       # Too many digits
            "123456789",         # Missing 'tt' prefix
            "tt12345a7",         # Contains letter in digits
        ]

        for invalid_tconst in invalid_tconsts:
            response = self.client.post(self.url, {"tconst": invalid_tconst}, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("tconst", response.data)

    def test_post_movie_not_found(self):
        """Test POST with non-existent movie"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.url, {"tconst": "tt9999999"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tconst", response.data)
        self.assertIn("does not exist", str(response.data["tconst"]))

    def test_post_duplicate_movie_conflict(self):
        """Test POST with movie already on watchlist returns 409 Conflict"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.url, {"tconst": "tt0468569"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("detail", response.data)
        self.assertIn("already on the watchlist", str(response.data["detail"]))

    def test_post_restore_soft_deleted_movie(self):
        """Test POST restores soft-deleted movie entry"""
        self.client.force_authenticate(user=self.user1)

        # Verify movie is soft-deleted before POST - use self.test_user_id
        user_movie_before = UserMovie.objects.get(
            user_id=self.test_user_id, tconst="tt0071562"
        )
        self.assertIsNotNone(user_movie_before.watchlist_deleted_at)

        # POST to restore
        response = self.client.post(self.url, {"tconst": "tt0071562"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify response
        self.assertEqual(response.data["movie"]["tconst"], "tt0071562")
        self.assertIsNotNone(response.data["watchlisted_at"])
        self.assertIsNone(response.data["watched_at"])

        # Verify database state - movie is restored - use self.test_user_id
        user_movie_after = UserMovie.objects.get(
            user_id=self.test_user_id, tconst="tt0071562"
        )
        self.assertIsNotNone(user_movie_after.watchlisted_at)
        self.assertIsNone(user_movie_after.watchlist_deleted_at)  # Restored!

    def test_post_user_isolation(self):
        """Test that users can add the same movie independently"""
        # User 1 adds a movie
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.url, {"tconst": "tt0068646"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify movie was added for user 1 - use self.test_user_id
        user1_movie = UserMovie.objects.filter(user_id=self.test_user_id, tconst="tt0068646").first()
        self.assertIsNotNone(user1_movie)

        # Note: Testing isolation between different real users would require
        # multiple test user accounts in the database

    def test_post_with_no_availability_data(self):
        """Test POST when movie has no availability data"""
        # Create a movie with no availability entries
        movie_no_avail, _ = Movie.objects.get_or_create(
            tconst="tt9999998",
            defaults={"primary_title": "Test Movie No Availability", "avg_rating": 8.0}
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.url, {"tconst": "tt9999998"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["movie"]["tconst"], "tt9999998")
        # Availability should be an empty list
        self.assertIn("availability", response.data)
        self.assertEqual(response.data["availability"], [])