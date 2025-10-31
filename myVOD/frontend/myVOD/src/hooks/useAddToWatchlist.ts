import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addUserMovie } from "@/lib/api/movies";
import type { AddUserMovieCommand } from "@/types/api.types";

/**
 * Custom hook for adding movies to user's watchlist.
 * Manages loading state per movie and provides optimistic updates with toast notifications.
 *
 * @returns Mutation object with mutate function and loading states
 */
export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tconst }: { tconst: string }) => {
      const command: AddUserMovieCommand = { tconst };
      await addUserMovie(command);
    },
    onSuccess: (_, { tconst }) => {
      // Invalidate watchlist queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["user-movies"] });
      queryClient.invalidateQueries({ queryKey: ["user-movies-watched"] });

      toast.success("Film dodany do watchlisty");
    },
    onError: (error: any, { tconst }) => {
      // Handle specific error cases
      if (error?.response?.status === 409) {
        toast.info("Ten film jest już na Twojej watchliście");
      } else if (error?.response?.status === 401) {
        toast.error("Sesja wygasła. Zaloguj się ponownie.");
      } else {
        toast.error("Nie udało się dodać filmu do watchlisty");
      }
    },
  });
}
