import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { patchUserPlatforms } from "@/lib/api/platforms";
import type { UserProfileDto } from "@/types/api.types";

/**
 * Custom hook for updating user's selected platforms.
 * Provides mutation state and helpers for updating platform preferences.
 * Invalidates related queries after successful update.
 *
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useUpdateUserPlatforms() {
  const queryClient = useQueryClient();

  return useMutation<UserProfileDto, Error, number[]>({
    mutationFn: async (platformIds: number[]) => {
      return await patchUserPlatforms(platformIds);
    },
    onSuccess: (data) => {
      // Invalidate queries that depend on user profile/platforms
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-movies"] });
      queryClient.invalidateQueries({ queryKey: ["ai-suggestions"] });
      
      // Update cached user profile with new data
      queryClient.setQueryData<UserProfileDto>(["user-profile"], data);
      
      toast.success("Zapisano zmiany");
    },
    onError: (error: Error) => {
      // Check if it's a 400 error (validation error)
      if (error.message.includes("400") || error.message.includes("Bad Request")) {
        toast.error("Nie udało się zapisać zmian. Sprawdź wybrane platformy.");
        return;
      }
      
      // For other errors (5xx, network, etc.)
      toast.error("Wystąpił błąd. Spróbuj ponownie później.");
    },
  });
}

