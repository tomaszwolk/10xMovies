#!/usr/bin/env python
"""
Script to check movie availability data in the database.

Usage:
    python check_movie_availability.py

Edit the TCONST variable below to check availability for a specific movie.
"""

import os
import sys
import django

# === CONFIGURATION ===
# Change this to the tconst you want to check
TCONST_TO_CHECK = "tt12263384"  # Example: The Shawshank Redemption

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myVOD.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'myVOD', 'backend', 'myVOD'))
django.setup()

from movies.models import MovieAvailability, Movie


def check_movie_availability(tconst):
    """
    Check if a movie exists and has availability data.

    Args:
        tconst: IMDb movie identifier (e.g., 'tt0111161')
    """
    print(f"=== CHECKING AVAILABILITY FOR MOVIE: {tconst} ===\n")

    # 1. Check if movie exists in movie table
    try:
        movie = Movie.objects.get(tconst=tconst)
        print(f"✅ Movie found: {movie.primary_title} ({movie.start_year})")
    except Movie.DoesNotExist:
        print(f"❌ Movie NOT found in database: {tconst}")
        return

    # 2. Check availability data
    availability_records = MovieAvailability.objects.filter(tconst=tconst).select_related('platform')

    print(f"\n📊 Availability records found: {availability_records.count()}")

    if availability_records.exists():
        print("\n🎬 Available on platforms:")
        for record in availability_records:
            status = "✅ Available" if record.is_available else "❌ Not available"
            if record.is_available is None:
                status = "❓ Unknown"
            print(f"  • Platform {record.platform_id} ({record.platform.platform_name}): {status}")
    else:
        print("❌ No availability records found for this movie")

    # 3. Summary
    available_count = availability_records.filter(is_available=True).count()
    print(f"\n📈 Summary:")
    print(f"  • Total availability records: {availability_records.count()}")
    print(f"  • Available on platforms: {available_count}")
    print(f"  • Not available on platforms: {availability_records.filter(is_available=False).count()}")
    print(f"  • Unknown status: {availability_records.filter(is_available__isnull=True).count()}")


def main():
    if not TCONST_TO_CHECK:
        print("❌ Please set TCONST_TO_CHECK variable at the top of the script")
        return

    check_movie_availability(TCONST_TO_CHECK)

    # Bonus: Show total stats
    print(f"\n=== DATABASE STATS ===")
    total_movies = Movie.objects.count()
    total_availability = MovieAvailability.objects.count()
    available_movies = MovieAvailability.objects.filter(is_available=True).values('tconst').distinct().count()

    print(f"Total movies in database: {total_movies}")
    print(f"Total availability records: {total_availability}")
    print(f"Movies with availability data: {available_movies}")


if __name__ == "__main__":
    main()
