import os
import csv
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client


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


def get_ratings(ratings_file_path: Path) -> dict:
    """Reads title.ratings.tsv and returns a dictionary mapping tconst to its rating info."""
    print("Reading ratings into memory...")
    ratings = {}
    with open(ratings_file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            ratings[row['tconst']] = {
                'avg_rating': float(row.get('averageRating')) if row.get('averageRating') else None,  # type: ignore
                'num_votes': int(row.get('numVotes')) if row.get('numVotes') else None,  # type: ignore
            }
    print(f"Found {len(ratings)} ratings.")
    return ratings


def load_merged_data(supabase: Client, basics_file_path: Path, ratings: dict):
    """
    Processes title.basics.tsv, merges with ratings, and upserts to Supabase.
    """
    print("Processing and uploading merged movie data...")

    batch_size = 1000
    batch = []
    total_inserted = 0
    batch_num = 0

    with open(basics_file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            if row.get('titleType') != 'movie':
                continue

            tconst = row.get('tconst')
            rating_info = ratings.get(tconst, {}) # Get rating or empty dict if not found

            start_year = row.get('startYear')

            record = {
                'tconst': tconst,
                'primary_title': row.get('primaryTitle'),
                'start_year': int(start_year) if start_year and start_year != '\\N' else None,
                'genres': row.get('genres').split(',') if row.get('genres') and row.get('genres') != '\\N' else None,
                'avg_rating': rating_info.get('avg_rating'),
                'num_votes': rating_info.get('num_votes'),
            }
            batch.append(record)

            if len(batch) >= batch_size:
                batch_num += 1
                print(f"Upserting batch {batch_num} with {len(batch)} records.")
                try:
                    response = supabase.table('movie').upsert(batch).execute()
                    if response.data:
                        count = len(response.data)
                        total_inserted += count
                        print(f"Successfully upserted {count} movie records. Total: {total_inserted}")
                    if hasattr(response, 'error') and response.error:
                        print(f"Error upserting batch: {response.error}")
                except Exception as e:
                    print(f"An exception occurred during batch upsert: {e}")
                batch = []

    # Upsert any remaining records in the last batch
    if batch:
        batch_num += 1
        print(f"Upserting final batch {batch_num} with {len(batch)} records.")
        try:
            response = supabase.table('movie').upsert(batch).execute()
            if response.data:
                count = len(response.data)
                total_inserted += count
                print(f"Successfully upserted {count} movie records. Total: {total_inserted}")
            if hasattr(response, 'error') and response.error:
                print(f"Error upserting batch: {response.error}")
        except Exception as e:
            print(f"An exception occurred during final batch upsert: {e}")

    print("Finished loading merged movie data.")


def main():
    """Main function to load all IMDb data."""
    try:
        supabase = get_supabase_client()
        print("Supabase client initialized.")

        data_dir = Path(__file__).parent.parent / 'IMDB_data_set_lite'
        basics_file = data_dir / 'title.basics.tsv'
        ratings_file = data_dir / 'title.ratings.tsv'

        if not basics_file.exists():
            print(f"Error: {basics_file} not found.")
            return
        if not ratings_file.exists():
            print(f"Error: {ratings_file} not found.")
            return

        ratings_data = get_ratings(ratings_file)
        load_merged_data(supabase, basics_file, ratings_data)

        print("Data loading process completed.")

    except Exception as e:
        print(f"An error occurred in the main process: {e}")


if __name__ == "__main__":
    main()
