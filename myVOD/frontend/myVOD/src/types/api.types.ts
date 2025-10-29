// API Types for MyVOD application

// Platform types
export type PlatformDto = {
  id: number;
  platform_slug: string;
  platform_name: string;
};

// Core movie type
type MovieSearchCore = {
  tconst: string;
  primary_title: string;
  start_year: number | null;
  poster_path: string | null;
};

// Auth types
export type RegisterUserCommand = {
  email: string;
  password: string;
};

export type RegisteredUserDto = {
  email: string;
};

export type LoginUserCommand = {
  email: string;
  password: string;
};

export type AuthTokensDto = {
  access: string;
  refresh: string;
};

export type AuthErrorDto = {
  detail: string;
};

export type UserProfileDto = {
  email: string;
  platforms: PlatformDto[];
};

export type UpdateUserProfileCommand = {
  platforms: number[];
};

// Movie types
export type MovieSearchResultDto = MovieSearchCore & {
  avg_rating: string | null;
};

// Watchlist types
type UserMovieDetailDto = {
  tconst: string;
  primary_title: string;
  start_year: number | null;
  genres: string[] | null;
  avg_rating: string | null;
  poster_path: string | null;
};

export type MovieAvailabilityDto = {
  platform_id: number;
  platform_name: string;
  is_available: boolean | null;
};

export type UserMovieDto = {
  id: number;
  watchlisted_at: string | null;
  watched_at: string | null;
  movie: UserMovieDetailDto;
  availability: MovieAvailabilityDto[];
};

export type AddUserMovieCommand = {
  tconst: string;
};

export type UpdateUserMovieCommand = {
  action: 'mark_as_watched' | 'restore_to_watchlist';
};

// AI Suggestions types
export type SuggestionItemDto = {
  tconst: string;
  primary_title: string;
  start_year: number | null;
  justification: string;
  availability: MovieAvailabilityDto[];
};

export type AISuggestionsDto = {
  expires_at: string;
  suggestions: SuggestionItemDto[];
};

// Onboarding View Models
export type SearchOptionVM = {
  tconst: string;
  primaryTitle: string;
  startYear: number | null;
  avgRating: string | null;
  posterUrl: string | null;
};

export type AddedMovieVM = {
  tconst: string;
  primaryTitle: string;
  startYear: number | null;
  posterUrl: string | null;
};

export type OnboardingAddState = {
  query: string;
  debouncedQuery: string;
  results: SearchOptionVM[];
  added: AddedMovieVM[];
  addedSet: Set<string>;
  isAddingByTconst: Record<string, boolean>;
  errorMessage?: string;
};