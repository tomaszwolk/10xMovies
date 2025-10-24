import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class WatchmodeService:
    BASE_URL = "https://api.watchmode.com/v1/"
    API_KEY = settings.WATCHMODE_API_KEY

    def get_title_details(self, title_id: int, region: str = 'PL'):
        """
        Fetches title details from the Watchmode API for a specific region.
        'title_id' is the Watchmode ID, not IMDb ID.
        """
        if not self.API_KEY:
            logger.error("WATCHMODE_API_KEY not configured.")
            return None

        url = f"{self.BASE_URL}title/{title_id}/details/"
        params = {
            "apiKey": self.API_KEY,
            "append_to_response": "sources",
            "region": region
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data from Watchmode API for title {title_id}: {e}")
            return None

    def list_titles(self, source_ids: list[int], region: str = 'PL', types: list[str] = None, page: int = 1):
        """
        Lists titles available on specific sources for a given region.
        """
        if not self.API_KEY:
            logger.error("WATCHMODE_API_KEY not configured.")
            return None

        url = f"{self.BASE_URL}list-titles/"
        params = {
            "apiKey": self.API_KEY,
            "source_ids": ",".join(map(str, source_ids)),
            "region": region,
            "page": page
        }
        if types:
            params["types"] = ",".join(types)

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error listing titles from Watchmode API: {e}")
            return None

    def get_source_changes(self, start_date: str, end_date: str, region: str = 'PL', page: int = 1):
        """
        Gets titles that have had their streaming sources changed within a date range.
        """
        if not self.API_KEY:
            logger.error("WATCHMODE_API_KEY not configured.")
            return None

        url = f"{self.BASE_URL}changes/titles_sources_changed/"
        params = {
            "apiKey": self.API_KEY,
            "start_date": start_date,
            "end_date": end_date,
            "region": region,
            "page": page
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting source changes from Watchmode API: {e}")
            return None

    def search_by_imdb_id(self, imdb_id: str):
        """
        Searches for a title by its IMDb ID to get the Watchmode ID.
        """
        if not self.API_KEY:
            logger.error("WATCHMODE_API_KEY not configured.")
            return None

        url = f"{self.BASE_URL}search/"
        params = {
            "apiKey": self.API_KEY,
            "search_field": "imdb_id",
            "search_value": imdb_id
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error searching by IMDb ID {imdb_id} on Watchmode API: {e}")
            return None
