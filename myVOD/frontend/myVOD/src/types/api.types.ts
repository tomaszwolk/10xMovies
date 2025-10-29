// --- API DTOs (decoupled from DB schema) ---
// These types mirror the Django serializers' responses instead of raw DB tables.

export type PlatformDto = {
  id: number;
  platform_slug: string;
  platform_name: string;
};

type MovieSearchCore = {
  tconst: string;
  primary_title: string;
  start_year: number | null;
  poster_path: string | null;
};


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
 * DTO for a movie item in a search result list.
 * A subset of the movie entity returned by the API.
 */
export type MovieSearchResultDto = MovieSearchCore & {
  /** The average rating as a string in API responses. */
  avg_rating: string | null;
};

/**
 * DTO for a movie item in a search result list.
 * A subset of the 'movie' entity.
 * Note: `avg_rating` is represented as a string, as specified in the API plan.
 * Corresponds to an item in the response of `GET /api/movies/`.
 */
// --- Watchlist & Watched History ---


// --- Watchlist & Watched History ---

/** Details nested within a user movie item. */
type UserMovieDetailDto = {
  tconst: string;
  primary_title: string;
  start_year: number | null;
  genres: string[] | null;
  avg_rating: string | null;
  poster_path: string | null;
};

/**
 * DTO for the availability status of a movie on a specific platform.
 */
export type MovieAvailabilityDto = {
  platform_id: number;
  platform_name: string;
  is_available: boolean | null;
};

/**
 * DTO for a movie on a user's watchlist or watched history.
 * Corresponds to an item in the response of `GET /api/user-movies/`.
 */
export type UserMovieDto = {
  id: number;
  watchlisted_at: string | null;
  watched_at: string | null;
  movie: UserMovieDetailDto;
  availability: MovieAvailabilityDto[];
};

/**
 * Command model for adding a movie to the user's watchlist.
 * Corresponds to the request body of `POST /api/user-movies/`.
 */
export type AddUserMovieCommand = { tconst: string };

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
export type SuggestionItemDto = {
  tconst: string;
  primary_title: string;
  start_year: number | null;
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
