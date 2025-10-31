import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/api/auth";
import type { UserProfileDto } from "@/types/api.types";

/**
 * Custom hook for fetching user profile with selected platforms.
 * Uses TanStack Query for caching and state management.
 *
 * @param enabled - Whether the query should run (default: true)
 * @returns Query object with data, isLoading, error, etc.
 */
export function useUserProfile(enabled: boolean = true) {
  return useQuery<UserProfileDto, Error>({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
    enabled,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}
