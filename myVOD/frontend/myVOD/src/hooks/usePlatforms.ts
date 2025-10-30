import { useQuery } from "@tanstack/react-query";
import { getPlatforms } from "@/lib/api/platforms";
import type { PlatformDto } from "@/types/api.types";

/**
 * Custom hook for fetching all available VOD platforms.
 * Uses TanStack Query for caching and state management.
 *
 * @param enabled - Whether the query should run (default: true)
 * @returns Query object with data, isLoading, error, etc.
 */
export function usePlatforms(enabled: boolean = true) {
  return useQuery<PlatformDto[], Error>({
    queryKey: ["platforms"],
    queryFn: () => getPlatforms(),
    enabled,
    staleTime: 30 * 60 * 1000, // Consider data fresh for 30 minutes (platforms don't change often)
  });
}
