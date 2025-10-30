from unittest.mock import patch, MagicMock
from django.test import TestCase
from services.watchmode_service import WatchmodeService
import requests


class WatchmodeServiceTests(TestCase):

    @patch('services.watchmode_service.requests.get')
    def test_get_title_details_success(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": 12345, "title": "Test Movie"}
        mock_get.return_value = mock_response

        service = WatchmodeService()
        
        # Act
        result = service.get_title_details(title_id=12345, regions='PL')

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result["title"], "Test Movie")
        mock_get.assert_called_once()
        # Check that regions parameter was passed correctly
        self.assertEqual(mock_get.call_args.kwargs['params']['regions'], 'PL')

    @patch('services.watchmode_service.requests.get')
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

    @patch('services.watchmode_service.WatchmodeService.API_KEY', None)
    def test_get_title_details_no_api_key(self):
        # Arrange
        service = WatchmodeService()

        # Act
        result = service.get_title_details(title_id=12345)

        # Assert
        self.assertIsNone(result)

    @patch('services.watchmode_service.requests.get')
    def test_list_titles_success(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"titles": [{"id": 1}, {"id": 2}]}
        mock_get.return_value = mock_response

        service = WatchmodeService()

        # Act
        result = service.list_titles(source_ids=[203, 387], region='PL', types=['movie'])

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(len(result['titles']), 2)
        mock_get.assert_called_once()
        called_params = mock_get.call_args.kwargs['params']
        self.assertEqual(called_params['source_ids'], '203,387')
        self.assertEqual(called_params['region'], 'PL')
        self.assertEqual(called_params['types'], 'movie')

    @patch('services.watchmode_service.requests.get')
    def test_get_source_changes_success(self, mock_get):
        # Arrange
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"titles": [123, 456]}
        mock_get.return_value = mock_response

        service = WatchmodeService()

        # Act
        result = service.get_source_changes(start_date='2025-10-23', end_date='2025-10-24', regions='PL')

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(len(result['titles']), 2)
        mock_get.assert_called_once()
        called_params = mock_get.call_args.kwargs['params']
        self.assertEqual(called_params['start_date'], '2025-10-23')
        self.assertEqual(called_params['end_date'], '2025-10-24')
        self.assertEqual(called_params['regions'], 'PL')

    @patch('services.watchmode_service.requests.get')
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

    @patch('services.watchmode_service.requests.get')
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

    @patch('services.watchmode_service.WatchmodeService.API_KEY', None)
    def test_search_by_imdb_id_no_api_key(self):
        # Arrange
        service = WatchmodeService()

        # Act
        result = service.search_by_imdb_id(imdb_id="tt12345")

        # Assert
        self.assertIsNone(result)
