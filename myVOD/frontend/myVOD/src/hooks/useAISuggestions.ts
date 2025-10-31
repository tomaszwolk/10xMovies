import { useQuery } from "@tanstack/react-query";
import { getAISuggestions } from "@/lib/api/movies";
import type { AISuggestionsDto } from "@/types/api.types";

/**
 * Custom hook for fetching AI-powered movie suggestions.
 * Uses TanStack Query for caching and state management.
 *
 * @param enabled - Whether the query should run (default: true)
 * @returns Query object with data, isLoading, error, etc.
 */
export function useAISuggestions(enabled: boolean = true) {
  return useQuery<AISuggestionsDto, Error>({
    queryKey: ["ai-suggestions"],
    queryFn: () => getAISuggestions(),
    enabled,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (no suggestions available) or 429 (rate limited)
      if (error?.response?.status === 404 || error?.response?.status === 429) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
}
