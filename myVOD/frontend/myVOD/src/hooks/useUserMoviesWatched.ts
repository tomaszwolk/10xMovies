import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listUserMovies } from "@/lib/api/movies";
import type { UserMovieDto, PlatformDto } from "@/types/api.types";
import type { WatchedMovieItemVM, WatchedSortKey } from "@/types/view/watched.types";

/**
 * Formats a date string to a human-readable label for watched_at.
 * Returns a localized date string in Polish locale.
 */
function formatWatchedAtLabel(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString; // Fallback to original string if parsing fails
  }
}

/**
 * Maps UserMovieDto to WatchedMovieItemVM.
 * Calculates availability summary and formats watched date.
 */
function mapToWatchedMovieItemVM(dto: UserMovieDto, userPlatforms: PlatformDto[]): WatchedMovieItemVM {
  // Calculate if available on any user's platform
  const userPlatformIds = new Set(userPlatforms.map(p => p.id));
  const isAvailableOnAnyPlatform = dto.availability.some(a =>
    a.is_available === true && userPlatformIds.has(a.platform_id)
  );

  return {
    id: dto.id,
    tconst: dto.movie.tconst,
    title: dto.movie.primary_title,
    year: dto.movie.start_year,
    genres: dto.movie.genres,
    avgRating: dto.movie.avg_rating,
    posterPath: dto.movie.poster_path,
    watchedAt: dto.watched_at || '', // Should exist for watched status, but fallback
    watchedAtLabel: dto.watched_at ? formatWatchedAtLabel(dto.watched_at) : '',
    availability: dto.availability,
    isAvailableOnAnyPlatform,
  };
}

/**
 * Sorts watched movies by watched date (descending).
 * Movies without watched_at are placed at the end.
 */
function sortByWatchedAtDesc(items: WatchedMovieItemVM[]): WatchedMovieItemVM[] {
  return [...items].sort((a, b) => {
    // Handle null/empty watchedAt values
    if (!a.watchedAt && !b.watchedAt) return 0;
    if (!a.watchedAt) return 1; // a goes to end
    if (!b.watchedAt) return -1; // b goes to end

    const aDate = new Date(a.watchedAt).getTime();
    const bDate = new Date(b.watchedAt).getTime();
    return bDate - aDate; // Newest first
  });
}

/**
 * Props for useUserMoviesWatched hook.
 */
type UseUserMoviesWatchedProps = {
  sortKey: WatchedSortKey;
  userPlatforms: PlatformDto[];
};

/**
 * Custom hook for fetching and processing user's watched movies.
 * Handles sorting (backend vs client-side) and data transformation.
 */
export function useUserMoviesWatched({ sortKey, userPlatforms }: UseUserMoviesWatchedProps) {
  const query = useQuery<UserMovieDto[], Error>({
    queryKey: ["user-movies", "watched", sortKey === 'rating_desc' ? { ordering: '-tconst__avg_rating' } : {}],
    queryFn: () => listUserMovies('watched', sortKey === 'rating_desc' ? '-tconst__avg_rating' : undefined),
    staleTime: 30_000, // Consider data fresh for 30 seconds
  });

  const processedData = useMemo(() => {
    if (!query.data) {
      return {
        items: [],
        isEmpty: true,
      };
    }

    // Map to view models
    let items = query.data.map(dto => mapToWatchedMovieItemVM(dto, userPlatforms));

    // Apply client-side sorting if needed
    if (sortKey === 'watched_at_desc') {
      items = sortByWatchedAtDesc(items);
    }
    // For 'rating_desc', backend already sorted, no client-side sorting needed

    return {
      items,
      isEmpty: items.length === 0,
    };
  }, [query.data, userPlatforms, sortKey]);

  return {
    ...query,
    ...processedData,
  };
}
