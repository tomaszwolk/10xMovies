import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { restoreUserMovie } from "@/lib/api/movies";

/**
 * Hook for restoring movies from watched back to watchlist.
 * Removes movie from watched list and shows success/error toast.
 */
export function useRestoreToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return restoreUserMovie(id);
    },
    onMutate: async (id: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["user-movies", "watched"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["user-movies", "watched"]);

      // Optimistically remove the movie from watched list
      queryClient.setQueryData(["user-movies", "watched"], (old: any[]) =>
        old ? old.filter((movie: any) => movie.id !== id) : []
      );

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onSuccess: (data) => {
      toast.success(`"${data.movie.primary_title}" został przywrócony do watchlisty`);
    },
    onError: (_, __, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(["user-movies", "watched"], context.previousData);
      }
      toast.error("Nie udało się przywrócić filmu. Spróbuj ponownie.");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["user-movies", "watched"] });
      // Optionally invalidate watchlist too
      queryClient.invalidateQueries({ queryKey: ["user-movies", "watchlist"] });
    },
  });
}
