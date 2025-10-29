import { useQuery } from "@tanstack/react-query";
import { searchMovies } from "@/lib/api/movies";
import type { MovieSearchResultDto, SearchOptionVM } from "@/types/api.types";

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
  return useQuery<SearchOptionVM[]>({
    queryKey: ["movies", "search", query],
    queryFn: async () => {
      const results = await searchMovies(query);
      // Map DTOs to ViewModels and limit to 10 results
      return results.slice(0, 10).map(mapToSearchOptionVM);
    },
    enabled: query.length >= 2,
    staleTime: 30_000, // 30 seconds
  });
}
