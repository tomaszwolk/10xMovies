import type { AISuggestionsDto, SuggestionItemDto } from "@/types/api.types";
import type { AISuggestionCardVM, AISuggestionsViewModel } from "@/types/view/suggestions.types";

/**
 * Maps a single suggestion item from DTO to ViewModel.
 */
function mapSuggestionItemToVM(item: SuggestionItemDto): AISuggestionCardVM {
  return {
    tconst: item.tconst,
    title: item.primary_title,
    year: item.start_year,
    justification: item.justification,
    posterUrl: item.poster_path,
    availability: item.availability,
  };
}

/**
 * Maps AI suggestions DTO to ViewModel.
 * Handles error states and empty responses.
 */
export function mapAISuggestionsToVM(
  data: AISuggestionsDto | null,
  error: Error | null
): AISuggestionsViewModel {
  // Handle error states
  if (error) {
    const status = error?.response?.status;
    const isRateLimited = status === 429;

    return {
      expiresAt: null,
      items: [],
      isRateLimited,
      errorMessage: status === 404 ? "Brak wystarczających danych do wygenerowania sugestii" :
                   status === 429 ? "Limit sugestii AI został wykorzystany" :
                   status === 500 ? "Wystąpił błąd serwera" :
                   "Nie udało się pobrać sugestii",
    };
  }

  // Handle successful response
  if (data) {
    return {
      expiresAt: data.expires_at,
      items: data.suggestions.map(mapSuggestionItemToVM),
      isRateLimited: false,
    };
  }

  // Default empty state
  return {
    expiresAt: null,
    items: [],
    isRateLimited: false,
  };
}
