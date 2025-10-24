import time
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
import logging

from movies.models import Movie, MovieAvailability, Platform
from services.watchmode_service import WatchmodeService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Populates the database with movie availability from Watchmode API for specified platforms.'

    def add_arguments(self, parser):
        parser.add_argument(
            'platform_slugs',
            nargs='+',
            type=str,
            help=f'A list of platform slugs to process. Available slugs: {", ".join(settings.VOD_PLATFORMS.values())}',
        )

    def handle(self, *args, **options):
        self.stdout.write("Starting to populate movie availability...")
        service = WatchmodeService()

        # This is a placeholder for getting source IDs. A real implementation
        # might cache this or store it in the database.
        # For now, we assume platform names match Watchmode names.
        platform_name_map = {v: k for k, v in settings.VOD_PLATFORMS.items()}
        source_ids_map = {
            'netflix': 203,
            'hbomax': 387,
            'disneyplus': 372,
            'primevideo': 26,
            'appletvplus': 371,
        }  # Simplified for MVP, ideally fetched from /sources API

        platform_slugs = options['platform_slugs']

        for slug in platform_slugs:
            if slug not in platform_name_map:
                self.stderr.write(self.style.ERROR(f"Platform slug '{slug}' is not configured in settings."))
                continue

            platform_name = platform_name_map[slug]
            source_id = source_ids_map.get(slug)
            if not source_id:
                self.stderr.write(self.style.ERROR(f"Watchmode source ID for '{slug}' is not defined."))
                continue

            self.stdout.write(f"Processing platform: {platform_name} (Source ID: {source_id})")

            try:
                platform_obj = Platform.objects.get(platform_slug=slug)
            except Platform.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"Platform '{slug}' not found in the database."))
                continue

            page = 1
            while True:
                self.stdout.write(f"Fetching page {page} for {platform_name}...")
                response = service.list_titles(source_ids=[source_id], types=['movie'], page=page)

                if not response or 'titles' not in response:
                    self.stderr.write(self.style.ERROR(f"Failed to fetch titles for {platform_name} on page {page}."))
                    break

                titles = response['titles']
                if not titles:
                    self.stdout.write(f"No more titles found for {platform_name}. Moving to next platform.")
                    break

                for title in titles:
                    self.process_title(title, platform_obj, service)

                if page >= response.get('total_pages', 1):
                    break

                page += 1
                time.sleep(1)  # Respectful delay between pages

        self.stdout.write(self.style.SUCCESS("Finished populating movie availability."))

    def process_title(self, title_data, platform_obj, service):
        watchmode_id = title_data.get('id')
        imdb_id = title_data.get('imdb_id')

        if not watchmode_id or not imdb_id:
            return

        # Get or create the movie
        movie, created = Movie.objects.get_or_create(
            tconst=imdb_id,
            defaults={
                'primary_title': title_data.get('title', 'N/A'),
                'start_year': title_data.get('year'),
                'watchmode_id': watchmode_id,
            }
        )

        if created:
            self.stdout.write(f"Created new movie: {movie.primary_title} ({movie.tconst})")

        # Update or create availability
        MovieAvailability.objects.update_or_create(
            tconst=movie,
            platform=platform_obj,
            defaults={
                'is_available': True,
                'last_checked': timezone.now(),
                'source': 'watchmode',
            }
        )
