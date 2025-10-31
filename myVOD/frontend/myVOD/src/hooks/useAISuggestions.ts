import { useQuery } from "@tanstack/react-query";
import { getAISuggestions } from "@/lib/api/movies";
import type { AISuggestionsDto } from "@/types/api.types";

/**
 * Custom hook for fetching AI-powered movie suggestions.
 * Uses TanStack Query for caching and state management.
 *
 * @param options - Hook options
 * @param options.debug - Whether to bypass rate limiting (dev only)
 * @param options.enabled - Whether the query should run (default: true)
 * @returns Query object with data, isLoading, error, etc.
 */
export function useAISuggestions(options: { debug?: boolean; enabled?: boolean } = {}) {
  const { debug = false, enabled = true } = options;

  return useQuery<AISuggestionsDto, Error>({
    queryKey: ["ai-suggestions", { debug }],
    queryFn: () => getAISuggestions(debug),
    enabled,
    staleTime: (data) => {
      // If we have data with expires_at, cache until expires_at
      if (data?.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        const timeUntilExpiry = Math.max(0, expiresAt.getTime() - now.getTime());
        return timeUntilExpiry;
      }
      // Default stale time
      return 10 * 60 * 1000; // 10 minutes
    },
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
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
