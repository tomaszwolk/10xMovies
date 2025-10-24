import os
import csv
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone
from supabase import create_client, Client


# --- CONFIGURATION ---
# ID of the user in the Django `auth_user` table to whom the watchlist will be assigned.
DJANGO_AUTH_USER_ID = 46

# Filename of the IMDb watchlist CSV export.
# This file should be placed in the IMDB_DATA_SET_LITE_DIR directory.
WATCHLIST_FILENAME = 'watchlist_tw.csv'

# Directory containing the IMDb dataset.
IMDB_DATA_SET_LITE_DIR = Path(__file__).parent.parent / "IMDB_data_set_lite"
# --- END CONFIGURATION ---


def get_supabase_client() -> Client:
    """Initializes and returns the Supabase client."""
    env_path = Path(__file__).parent.parent / "myVOD" / "backend" / ".env"

    if not os.path.exists(env_path):
        print(f"Warning: .env file not found at {env_path}")
        load_dotenv()
    else:
        load_dotenv(dotenv_path=env_path)

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.")

    return create_client(supabase_url, supabase_key)


def get_supabase_uuid(supabase: Client, django_user_id: int) -> str | None:
    """
    Retrieves the Supabase user UUID based on the Django auth_user.id.
    It does this by looking up the user's email in auth_user and then
    finding the corresponding user in Supabase's auth.users table.
    """
    try:
        # 1. Get email from Django's auth_user table (in public schema)
        user_response = supabase.table('auth_user').select('email').eq('id', django_user_id).execute()
        if not user_response.data:
            print(f"No user found in auth_user with ID {django_user_id}")
            return None
        email = user_response.data[0]['email']

        # 2. Get UUID from Supabase's auth.users table using the admin API
        response = supabase.auth.admin.list_users()

        # The response from list_users() can be an object with a 'users' attribute (v2+)
        # or a list directly (older versions). This handles both cases.
        users_list = response.users if hasattr(response, 'users') else response

        for user in users_list:
            if user.email == email:
                return user.id

        print(f"No user found in Supabase auth with email {email}")
        return None

    except Exception as e:
        print(f"An error occurred while fetching user UUID: {e}")
        return None


def get_movies_from_watchlist(watchlist_path: Path) -> list[str]:
    """Reads the IMDb watchlist CSV and returns a list of tconsts."""
    tconsts = []
    try:
        with open(watchlist_path, mode='r', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            for row in reader:
                if 'Const' in row:
                    tconsts.append(row['Const'])
    except FileNotFoundError:
        print(f"Watchlist file not found at: {watchlist_path}")
    return tconsts


def filter_existing_movies(supabase: Client, tconsts: list[str]) -> list[str]:
    """
    Filters a list of tconsts, returning only those that exist in the 'movie' table.
    """
    if not tconsts:
        return []

    try:
        response = supabase.table('movie').select('tconst').in_('tconst', tconsts).execute()
        if response.data:
            return [row['tconst'] for row in response.data]
        return []
    except Exception as e:
        print(f"An error occurred while filtering movies: {e}")
        return []


def main():
    """
    Main function to import IMDb watchlist into the user_movie table.
    """
    print("Starting IMDb watchlist import process...")

    try:
        supabase = get_supabase_client()
        print("Supabase client initialized.")
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
        return

    # Get Supabase UUID for the configured Django user ID
    user_uuid = get_supabase_uuid(supabase, DJANGO_AUTH_USER_ID)
    if not user_uuid:
        print(f"Could not resolve Supabase UUID for Django user ID {DJANGO_AUTH_USER_ID}. Aborting.")
        return

    print(f"Successfully resolved Django user ID {DJANGO_AUTH_USER_ID} to Supabase UUID: {user_uuid}")

    # Read movie tconsts from the watchlist CSV
    watchlist_path = IMDB_DATA_SET_LITE_DIR / WATCHLIST_FILENAME
    watchlist_tconsts = get_movies_from_watchlist(watchlist_path)
    if not watchlist_tconsts:
        print("No movies found in the watchlist file. Aborting.")
        return

    print(f"Found {len(watchlist_tconsts)} movies in '{WATCHLIST_FILENAME}'.")

    # Check which of these movies already exist in our 'movie' table
    existing_tconsts = filter_existing_movies(supabase, watchlist_tconsts)
    
    not_found_tconsts = set(watchlist_tconsts) - set(existing_tconsts)
    if not_found_tconsts:
        print(f"Warning: {len(not_found_tconsts)} movies from the watchlist were not found in the 'movie' table and will be skipped.")

    if not existing_tconsts:
        print("None of the movies from the watchlist exist in the database. Nothing to import.")
        return

    # Prepare data for insertion
    now = datetime.now(timezone.utc).isoformat()
    movies_to_insert = [
        {
            "user_id": user_uuid,
            "tconst": tconst,
            "watchlisted_at": now,
            "added_from_ai_suggestion": False,
        }
        for tconst in existing_tconsts
    ]

    # Insert data into user_movie in batches
    batch_size = 500
    total_upserted = 0
    for i in range(0, len(movies_to_insert), batch_size):
        batch = movies_to_insert[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1} with {len(batch)} movies...")
        try:
            response = (
                supabase.table("user_movie")
                .upsert(
                    batch,
                    on_conflict="user_id,tconst",
                    ignore_duplicates=True
                )
                .execute()
            )
            # API response for upsert doesn't reliably tell us how many were inserted vs ignored.
            # We just confirm the call was successful.
            if response.data:
                 total_upserted += len(response.data)

        except Exception as e:
            print(f"An error occurred during batch upsert: {e}")

    print(f"Successfully processed {len(existing_tconsts)} movies for the user's watchlist.")
    print("Note: Movies already on the user's watchlist were ignored.")
    print("Import process finished.")


if __name__ == "__main__":
    main()
