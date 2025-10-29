import { http } from "@/lib/http";
import type { MovieSearchResultDto, UserMovieDto, AddUserMovieCommand } from "@/types/api.types";

/**
 * API client for movie-related endpoints.
 */

/**
 * Search for movies by query string.
 * Corresponds to GET /api/movies/?search=<query>
 * @param query - Search query (minimum 2 characters)
 * @returns Promise<MovieSearchResultDto[]>
 */
export async function searchMovies(query: string): Promise<MovieSearchResultDto[]> {
  if (query.length < 2) {
    return [];
  }

  const response = await http.get<MovieSearchResultDto[]>("/movies/", {
    params: { search: query },
  });

  return response.data;
}

/**
 * Add a movie to the user's watchlist.
 * Corresponds to POST /api/user-movies/
 * @param command - Add movie command with tconst
 * @returns Promise<UserMovieDto>
 */
export async function addUserMovie(command: AddUserMovieCommand): Promise<UserMovieDto> {
  const response = await http.post<UserMovieDto>("/user-movies/", command);
  return response.data;
}
