import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchUserMovie } from "@/lib/api/movies";
import type { UpdateUserMovieCommand, UserMovieDto } from "@/types/api.types";

type PatchUserMovieParams = {
  id: number;
  command: UpdateUserMovieCommand;
};

/**
 * Custom hook for updating user movies (mark as watched or restore to watchlist).
 * Provides mutation state and helpers for the patch movie process.
 *
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function usePatchUserMovie() {
  const queryClient = useQueryClient();

  return useMutation<UserMovieDto, unknown, PatchUserMovieParams>({
    mutationFn: async ({ id, command }) => {
      return await patchUserMovie(id, command);
    },
    onSuccess: () => {
      // Invalidate user movies queries to refresh watchlist and watched lists
      queryClient.invalidateQueries({ queryKey: ["user-movies"] });
    },
  });
}

