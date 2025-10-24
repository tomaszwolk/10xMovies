from unittest.mock import patch, MagicMock
from django.test import TestCase
from myVOD.services.watchmode_service import WatchmodeService
import requests


class WatchmodeServiceTests(TestCase):

    @patch('myVOD.services.watchmode_service.requests.get')
    def test_get_title_details_success(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": 12345, "title": "Test Movie"}
        mock_get.return_value = mock_response

        service = WatchmodeService()

        # Act
        result = service.get_title_details(title_id=12345)

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result["title"], "Test Movie")
        mock_get.assert_called_once()

    @patch('myVOD.services.watchmode_service.requests.get')
    def test_get_title_details_api_error(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError
        mock_get.return_value = mock_response

        service = WatchmodeService()

        # Act
        result = service.get_title_details(title_id=12345)

        # Assert
        self.assertIsNone(result)

    @patch('myVOD.services.watchmode_service.WatchmodeService.API_KEY', None)
    def test_get_title_details_no_api_key(self):
        # Arrange
        service = WatchmodeService()

        # Act
        result = service.get_title_details(title_id=12345)

        # Assert
        self.assertIsNone(result)

    @patch('myVOD.services.watchmode_service.requests.get')
    def test_search_by_imdb_id_success(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"search_results": [{"imdb_id": "tt12345"}]}
        mock_get.return_value = mock_response

        service = WatchmodeService()

        # Act
        result = service.search_by_imdb_id(imdb_id="tt12345")

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result["search_results"][0]["imdb_id"], "tt12345")

    @patch('myVOD.services.watchmode_service.requests.get')
    def test_search_by_imdb_id_api_error(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError
        mock_get.return_value = mock_response

        service = WatchmodeService()

        # Act
        result = service.search_by_imdb_id(imdb_id="tt12345")

        # Assert
        self.assertIsNone(result)

    @patch('myVOD.services.watchmode_service.WatchmodeService.API_KEY', None)
    def test_search_by_imdb_id_no_api_key(self):
        # Arrange
        service = WatchmodeService()

        # Act
        result = service.search_by_imdb_id(imdb_id="tt12345")

        # Assert
        self.assertIsNone(result)
