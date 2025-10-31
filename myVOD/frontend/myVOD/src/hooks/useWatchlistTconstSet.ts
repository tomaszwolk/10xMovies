import { useMemo } from "react";
import { useListUserMovies } from "@/hooks/useListUserMovies";

/**
 * Custom hook for getting a set of tconst values from user's watchlist.
 * Used to check if movies are already on the watchlist.
 *
 * @returns Set of tconst strings from user's watchlist
 */
export function useWatchlistTconstSet(): Set<string> {
  const watchlistQuery = useListUserMovies();

  return useMemo(() => {
    if (!watchlistQuery.data) {
      return new Set();
    }

    return new Set(watchlistQuery.data.map(movie => movie.movie.tconst));
  }, [watchlistQuery.data]);
}
