import { useListUserMovies } from "@/hooks/useListUserMovies";

/**
 * Custom hook for fetching user's watchlist movies.
 * Uses TanStack Query for caching and state management.
 *
 * @param enabled - Whether the query should run (default: true)
 * @returns Query object with data, isLoading, error, etc.
 */
export function useWatchlistQuery(enabled: boolean = true) {
  return useListUserMovies('watchlist', enabled);
}
