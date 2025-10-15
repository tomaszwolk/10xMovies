from pathlib import Path
import pandas as pd

# From title.ratings.tsv get: averageRating, numVotes based on tconst

title = "title.ratings.tsv"
data_set_path = Path(__file__).parent.parent / "IMDB_data_set"
file_path = Path(data_set_path / title / title)

save_path = Path(__file__).parent.parent / "IMDB_data_set_lite"
file_save_path = Path(save_path / title)

movie_path = Path(__file__).parent.parent / "IMDB_data_set_lite" / "title.basics.tsv"
movie_df = pd.read_csv(movie_path, sep="\t")
ratings_df = pd.read_csv(file_path, sep="\t")

# Get unique tconst values from title.basics.tsv
tconst_in_basics = set(movie_df['tconst'].unique())

# Filter ratings_df to only include rows where tconst is in title.basics.tsv
filtered_ratings_df = ratings_df[ratings_df['tconst'].isin(tconst_in_basics)]

# Save the filtered data to CSV
filtered_ratings_df.to_csv(file_save_path, sep='\t', index=False)
print(f"Filtered ratings saved to {file_save_path}")
print(f"Total ratings in original file: {len(ratings_df)}")
print(f"Filtered ratings saved: {len(filtered_ratings_df)}")
