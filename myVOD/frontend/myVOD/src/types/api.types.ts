import type { Tables } from './database.types';

// --- Database Entity Aliases ---
// These aliases provide convenient shortcuts to the raw database types.

/** Represents a row from the 'movie' table. */
type Movie = Tables<'movie'>;

/** Represents a row from the 'platform' table. */
type Platform = Tables<'platform'>;

/** Represents a row from the 'user_movie' table. */
type UserMovie = Tables<'user_movie'>;

/** Represents a row from the 'movie_availability' table. */
type MovieAvailability = Tables<'movie_availability'>;


// --- Auth & User Management ---

/**
 * Command model for registering a new user.
 * Corresponds to the request body of `POST /api/register/`.
 */
export type RegisterUserCommand = {
  email: string;
  password: string;
};

/**
 * DTO for the response after a successful user registration.
 * Corresponds to the response of `POST /api/register/`.
 */
export type RegisteredUserDto = {
  email: string;
};

/**
 * Command model for authenticating a user.
 * Corresponds to the request body of `POST /api/token/`.
 */
export type LoginUserCommand = {
  email: string;
  password: string;
};

/**
 * DTO for the JWT token pair returned upon successful authentication.
 * Corresponds to the response of `POST /api/token/`.
 */
export type AuthTokensDto = {
  access: string;
  refresh: string;
};

/**
 * DTO for a generic authentication error response.
 * Standard error from djangorestframework-simplejwt on 401.
 */
export type AuthErrorDto = {
  detail: string;
};

/**
 * DTO for the authenticated user's profile.
 * Corresponds to the response of `GET /api/me/`.
 */
export type UserProfileDto = {
  email: string;
  platforms: PlatformDto[];
};

/**
 * Command model for updating the user's selected platforms.
 * Corresponds to the request body of `PATCH /api/me/`.
 */
export type UpdateUserProfileCommand = {
  /** An array of platform IDs to associate with the user. */
  platforms: number[];
};


// --- Movies & Platforms ---

/**
 * DTO for a single VOD platform.
 * This directly maps to the 'platform' table schema.
 * Corresponds to an item in the response of `GET /api/platforms/`.
 */
export type PlatformDto = Platform;

/**
 * DTO for a movie item in a search result list.
 * A subset of the 'movie' entity.
 * Note: `avg_rating` is represented as a string, as specified in the API plan.
 * Corresponds to an item in the response of `GET /api/movies/`.
 */
export type MovieSearchResultDto = Omit<
  Pick<
    Movie,
    'tconst' | 'primary_title' | 'start_year' | 'avg_rating' | 'poster_path'
  >,
  'avg_rating'
> & {
  /** The average rating, potentially as a string from the API. */
  avg_rating: string | null;
};


// --- Watchlist & Watched History ---

/**
 * DTO for the detailed movie information nested within `UserMovieDto`.
 */
type UserMovieDetailDto = Omit<
  Pick<
    Movie,
    | 'tconst'
    | 'primary_title'
    | 'start_year'
    | 'genres'
    | 'avg_rating'
    | 'poster_path'
  >,
  'avg_rating'
> & {
  /** The average rating, potentially as a string from the API. */
  avg_rating: string | null;
};

/**
 * DTO for the availability status of a movie on a specific platform.
 */
export type MovieAvailabilityDto = {
  platform_id: Platform['id'];
  platform_name: Platform['platform_name'];
  is_available: MovieAvailability['is_available'];
};

/**
 * DTO for a movie on a user's watchlist or watched history.
 * Corresponds to an item in the response of `GET /api/user-movies/`.
 */
export type UserMovieDto = Pick<UserMovie, 'id' | 'watchlisted_at' | 'watched_at'> & {
  movie: UserMovieDetailDto;
  availability: MovieAvailabilityDto[];
};

/**
 * Command model for adding a movie to the user's watchlist.
 * Corresponds to the request body of `POST /api/user-movies/`.
 */
export type AddUserMovieCommand = Pick<Movie, 'tconst'>;

/**
 * Command model for updating a `user_movie` entry, e.g., marking it as watched.
 * Corresponds to the request body of `PATCH /api/user-movies/<id>/`.
 */
export type UpdateUserMovieCommand = {
  action: 'mark_as_watched' | 'restore_to_watchlist';
};


// --- AI Suggestions ---

/**
 * DTO for a single AI-generated movie suggestion.
 * Nested within the `AISuggestionsDto`.
 */
export type SuggestionItemDto = Pick<
  Movie,
  'tconst' | 'primary_title' | 'start_year'
> & {
  /** AI-generated reason for the suggestion. */
  justification: string;
  availability: MovieAvailabilityDto[];
};

/**
 * DTO for the complete AI movie suggestions response.
 * Corresponds to the response of `GET /api/suggestions/`.
 */
export type AISuggestionsDto = {
  /** The timestamp when the current suggestion batch expires. */
  expires_at: string;
  suggestions: SuggestionItemDto[];
};
