import { usePatchUserMovie } from "@/hooks/usePatchUserMovie";

/**
 * Custom hook for marking a movie as watched.
 * Uses optimistic updates and handles rollback on error.
 *
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useMarkWatched() {
  const mutation = usePatchUserMovie();

  return {
    ...mutation,
    mutate: (id: number) => {
      mutation.mutate({ id, command: { action: 'mark_as_watched' } });
    },
  };
}
