import type { MovieAvailabilityDto } from "@/types/api.types";

/**
 * ViewModel for individual AI suggestion card.
 */
export type AISuggestionCardVM = {
  tconst: string;
  title: string;
  year: number | null;
  justification: string;
  posterUrl: string | null;
  availability: MovieAvailabilityDto[];
};

/**
 * ViewModel for AI suggestions page/component.
 */
export type AISuggestionsViewModel = {
  expiresAt: string | null;
  items: AISuggestionCardVM[];
  isRateLimited: boolean;
  errorMessage?: string;
};

/**
 * Simplified API error shape for UI display.
 */
export type ApiError = {
  status: number;
  message?: string;
};
