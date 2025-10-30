import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { searchMovies } from "@/lib/api/movies";
import type { MovieSearchResultDto, SearchOptionVM } from "@/types/api.types";

type MovieSearchMetrics = {
  lastQuery: string;
  lastDurationMs: number | null;
  completedCount: number;
  abortedCount: number;
};

function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    return code === "ERR_CANCELED";
  }

  return false;
}

/**
 * Maps MovieSearchResultDto to SearchOptionVM for the search combobox.
 */
function mapToSearchOptionVM(dto: MovieSearchResultDto): SearchOptionVM {
  return {
    tconst: dto.tconst,
    primaryTitle: dto.primary_title,
    startYear: dto.start_year,
    avgRating: dto.avg_rating,
    posterUrl: dto.poster_path,
  };
}

/**
 * Custom hook for movie search using TanStack Query.
 * Provides query state and results for movie search functionality.
 *
 * @param query - Search query string (minimum 2 characters to trigger search)
 * @returns Query object with data (SearchOptionVM[]), isLoading, error, etc.
 */
export function useMovieSearch(query: string) {
  const requestStartRef = useRef<number | null>(null);
  const [metrics, setMetrics] = useState<MovieSearchMetrics>({
    lastQuery: "",
    lastDurationMs: null,
    completedCount: 0,
    abortedCount: 0,
  });

  const queryResult = useQuery<SearchOptionVM[], unknown>({
    queryKey: ["movies", "search", query],
    queryFn: async ({ signal }) => {
      requestStartRef.current = performance.now();
      try {
        const results = await searchMovies(query, { signal });
        // Map DTOs to ViewModels and limit to 10 results
        return results.slice(0, 10).map(mapToSearchOptionVM);
      } catch (error) {
        if (isAbortError(error)) {
          setMetrics((prev) => ({
            ...prev,
            abortedCount: prev.abortedCount + 1,
          }));
          requestStartRef.current = null;
        }

        throw error;
      }
    },
    enabled: query.length >= 2,
    staleTime: 30_000, // 30 seconds
    retry: false,
  });

  useEffect(() => {
    if (queryResult.status !== "success") {
      return;
    }

    const endTime = performance.now();
    const startTime = requestStartRef.current;
    requestStartRef.current = null;
    const durationMs = startTime != null ? endTime - startTime : null;

    if (import.meta.env.DEV && durationMs != null) {
      const resultCount = queryResult.data?.length ?? 0;
      console.info(
        `[movie-search] "%s" fetched %d results in %d ms`,
        query,
        resultCount,
        Math.round(durationMs)
      );
    }

    setMetrics((prev) => ({
      lastQuery: query,
      lastDurationMs: durationMs,
      completedCount: prev.completedCount + 1,
      abortedCount: prev.abortedCount,
    }));
  }, [queryResult.status, queryResult.dataUpdatedAt, queryResult.data, query]);

  return {
    ...queryResult,
    metrics,
  };
}
