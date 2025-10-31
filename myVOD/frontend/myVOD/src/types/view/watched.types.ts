// Watched View Model Types

export type WatchedViewMode = 'grid' | 'list';

export type WatchedSortKey =
  | 'watched_at_desc'      // domyślnie, sortowanie po stronie klienta
  | 'rating_desc';         // sortowanie po stronie backendu (-tconst__avg_rating)

export type WatchedMovieItemVM = {
  id: number;
  tconst: string;
  title: string;
  year: number | null;
  genres: string[] | null;
  avgRating: string | null;
  posterPath: string | null;
  watchedAt: string;            // oryginalny ISO string z API
  watchedAtLabel: string;       // sformatowana data do UI
  availability: import("../api.types").MovieAvailabilityDto[];
  isAvailableOnAnyPlatform: boolean; // wyliczane z availability
};
