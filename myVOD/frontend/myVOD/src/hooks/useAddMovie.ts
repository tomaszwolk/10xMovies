import { useAddUserMovie } from "@/hooks/useAddUserMovie";

/**
 * Custom hook for adding movies to user's watchlist.
 * Wrapper around useAddUserMovie with toast notifications.
 *
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useAddMovie() {
  return useAddUserMovie();
}
