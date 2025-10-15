import uuid
from unittest.mock import Mock
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from movies.models import Movie, Platform, UserMovie, MovieAvailability, UserPlatform
from dotenv import load_dotenv
import os

load_dotenv()


class UserMovieAPITests(APITestCase):

    def setUp(self):
        # !!! IMPORTANT !!!
        # To make these tests pass, you MUST replace this placeholder UUID
        # with a REAL user UUID from your development database's 'auth.users' table.
        # You can get one by signing up a test user in your application.
        self.test_user_id = uuid.UUID(os.getenv('TEST_USER'))
        # Create mock user object
        self.user1 = Mock()
        self.user1.id = self.test_user_id
        self.user1.is_authenticated = True

        # This second user mock is for testing data isolation
        self.user2 = Mock()
        self.user2.id = uuid.uuid4() # A random, non-existent user
        self.user2.is_authenticated = True
        self.user2.userplatform_set.values_list.return_value = []

        # Create Movies
        self.movie1, _ = Movie.objects.get_or_create(tconst='tt0000001', defaults={'primary_title': 'Movie 1', 'avg_rating': 8.5})
        self.movie2, _ = Movie.objects.get_or_create(tconst='tt0000002', defaults={'primary_title': 'Movie 2', 'avg_rating': 9.0})
        self.movie3, _ = Movie.objects.get_or_create(tconst='tt0000003', defaults={'primary_title': 'Movie 3', 'avg_rating': 7.0})

        # Create Platforms
        self.platform1, _ = Platform.objects.get_or_create(id=1, defaults={'platform_slug': 'netflix', 'platform_name': 'Netflix'})
        self.platform2, _ = Platform.objects.get_or_create(id=2, defaults={'platform_slug': 'hbo', 'platform_name': 'HBO'})

        # Configure the mock to behave like a real user model regarding relations
        self.user1.userplatform_set.values_list.return_value = [self.platform1.id]

        # User 1 Platform
        UserPlatform.objects.get_or_create(user_id=self.user1.id, platform_id=self.platform1.id)

        # Movie Availability
        MovieAvailability.objects.get_or_create(tconst=self.movie1, platform=self.platform1, defaults={'is_available': True, 'last_checked': '2023-10-01T10:00:00Z', 'source': 'test'})
        MovieAvailability.objects.get_or_create(tconst=self.movie2, platform=self.platform1, defaults={'is_available': False, 'last_checked': '2023-10-01T10:00:00Z', 'source': 'test'})
        MovieAvailability.objects.get_or_create(tconst=self.movie3, platform=self.platform2, defaults={'is_available': True, 'last_checked': '2023-10-01T10:00:00Z', 'source': 'test'})

        # User 1 Movies (force deterministic state)
        UserMovie.objects.update_or_create(
            user_id=self.user1.id,
            tconst=self.movie1,
            defaults={
                'watchlisted_at': '2023-10-01T10:00:00Z',
                'watchlist_deleted_at': None,
                'watched_at': None,
            },
        )
        UserMovie.objects.update_or_create(
            user_id=self.user1.id,
            tconst=self.movie2,
            defaults={
                'watched_at': '2023-10-02T10:00:00Z',
                'watchlisted_at': None,
                'watchlist_deleted_at': None,
            },
        )
        UserMovie.objects.update_or_create(
            user_id=self.user1.id,
            tconst=self.movie3,
            defaults={
                'watchlisted_at': '2023-10-03T10:00:00Z',
                'watchlist_deleted_at': None,
                'watched_at': None,
            },
        )

        self.url = reverse('usermovie-list')

    def test_authentication_required(self):
        response = self.client.get(self.url)
        # 401 is correct for missing authentication (not 403)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_watchlist(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'watchlist'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['movie']['tconst'], self.movie1.tconst)

    def test_get_watched_list(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'watched'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['movie']['tconst'], self.movie2.tconst)

    def test_filter_by_is_available(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'watchlist', 'is_available': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['movie']['tconst'], self.movie1.tconst)

    def test_ordering_by_rating(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'watchlist', 'ordering': '-tconst__avg_rating'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['movie']['avg_rating'], '8.5')
        self.assertEqual(response.data[1]['movie']['avg_rating'], '7.0')

    def test_invalid_status_parameter(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'invalid_status'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_user_cannot_see_data(self):
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.url, {'status': 'watchlist'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_invalid_ordering_parameter_returns_400(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'watchlist', 'ordering': 'primary_title'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_is_available_parameter_returns_400(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'watchlist', 'is_available': 'foo'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_is_available_false_for_watched(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'watched', 'is_available': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['movie']['tconst'], self.movie2.tconst)

    def test_is_available_false_for_watchlist_returns_empty(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.url, {'status': 'watchlist', 'is_available': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)