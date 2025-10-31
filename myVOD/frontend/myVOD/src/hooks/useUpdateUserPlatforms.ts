import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchUserPlatforms } from "@/lib/api/platforms";
import type { UserProfileDto, UpdateUserProfileCommand } from "@/types/api.types";

/**
 * Custom hook for updating user platform preferences.
 * Uses TanStack Query for mutation management and cache invalidation.
 *
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useUpdateUserPlatforms() {
  const queryClient = useQueryClient();

  return useMutation<UserProfileDto, unknown, UpdateUserProfileCommand>({
    mutationFn: ({ platforms }) => patchUserPlatforms(platforms),
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["userMovies"] });
      queryClient.invalidateQueries({ queryKey: ["aiSuggestions"] });
    },
  });
}
