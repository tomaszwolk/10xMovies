from pathlib import Path
import pandas as pd

# From title.basics.tsv get: tconst, primaryTitile, startYear, genres

title = "title.basics.tsv"
data_set_path = Path(__file__).parent.parent / "IMDB_data_set"
file_path = Path(data_set_path / title / title)

save_path = Path(__file__).parent.parent / "IMDB_data_set_lite"
file_save_path = Path(save_path / title)

# Read only necessary columns
cols_to_use = ['tconst', 'titleType', 'primaryTitle', 'startYear', 'genres', 'isAdult']
try:
    df = pd.read_csv(file_path, sep="\t", usecols=cols_to_use, low_memory=False, dtype=str)
except Exception as e:
    print(f"Error reading file {file_path}: {e}")
    raise

# Quickly filter for movies and valid years; avoid chained assignment for performance & future-proofing.
# mask_movies = (df['titleType'] == 'movie') & (df['startYear'] != '\\N')
mask_movies = (df['titleType'] == 'movie')
movies_df = df.loc[mask_movies].copy()

# Useful if you want to get movies from some year
# # Convert startYear to numeric, handling any remaining non-numeric values
# movies_df['startYear'] = pd.to_numeric(movies_df['startYear'], errors='coerce')
# # Drop rows where startYear is NaN after conversion
# # movies_df = movies_df.dropna(subset=['startYear'])
# # Convert to int32
# movies_df = movies_df.astype({'startYear': 'int32', 'isAdult': 'int32'})
# movies_df = movies_df[movies_df.startYear >= 1932]

# Save
movies_df.to_csv(file_save_path, sep='\t', index=False)
print(f"Filtered movies saved to {file_save_path}")
print(f"Total rows in original file: {len(df)}")
print(f"Filtered movies saved: {len(movies_df)}")
