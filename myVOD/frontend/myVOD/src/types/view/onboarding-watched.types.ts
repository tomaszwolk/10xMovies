/**
 * View model types for the Onboarding Watched Page (Step 3/3).
 * This file defines the types used for managing the watched movies selection flow.
 */

/**
 * Source of a selected movie in the onboarding flow.
 * Tracks whether the movie was already on watchlist, already watched, or newly created.
 */
export type SelectedSource = 'preexisting_watchlist' | 'preexisting_watched' | 'newly_created';

/**
 * Status of a selected movie operation.
 * Tracks the async operation state for each selected movie.
 */
export type SelectedStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Represents a single selected movie item in the onboarding watched flow.
 * Tracks all information needed to display the movie and its operation status.
 */
export type OnboardingSelectedItem = {
  tconst: string;
  primary_title: string;
  start_year: number | null;
  poster_path: string | null;
  userMovieId: number | null; // Known after POST/lookup
  source: SelectedSource;
  status: SelectedStatus;
  error?: string;
};

/**
 * View model for the entire Onboarding Watched Page.
 * Contains all state needed to manage the watched movies selection flow.
 */
export type OnboardingWatchedViewModel = {
  query: string;
  isSubmitting: boolean; // Global lock during navigation/finish
  selected: OnboardingSelectedItem[]; // Max 3
  maxSelected: number; // Always 3 for MVP
};

