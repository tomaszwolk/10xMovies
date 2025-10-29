import { http } from "@/lib/http";
import type { MovieSearchResultDto, UserMovieDto, AddUserMovieCommand, UpdateUserMovieCommand } from "@/types/api.types";

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

/**
 * Update a user movie (mark as watched or restore to watchlist).
 * Corresponds to PATCH /api/user-movies/:id
 * @param id - User movie ID
 * @param command - Update command with action
 * @returns Promise<UserMovieDto>
 */
export async function patchUserMovie(id: number, command: UpdateUserMovieCommand): Promise<UserMovieDto> {
  const response = await http.patch<UserMovieDto>(`/user-movies/${id}/`, command);
  return response.data;
}

/**
 * Delete a user movie (soft delete).
 * Corresponds to DELETE /api/user-movies/:id
 * @param id - User movie ID
 * @returns Promise<void>
 */
export async function deleteUserMovie(id: number): Promise<void> {
  await http.delete(`/user-movies/${id}/`);
}

/**
 * List user movies filtered by status.
 * Corresponds to GET /api/user-movies/?status=<status>
 * @param status - Filter by status ('watchlist' or 'watched')
 * @returns Promise<UserMovieDto[]>
 */
export async function listUserMovies(status?: 'watchlist' | 'watched'): Promise<UserMovieDto[]> {
  const response = await http.get<UserMovieDto[]>("/user-movies/", {
    params: status ? { status } : undefined,
  });
  return response.data;
}
