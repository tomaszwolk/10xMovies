import { AddToWatchlistButton } from "./AddToWatchlistButton";
import { AvailabilityIcons } from "./AvailabilityIcons";
import type { AISuggestionCardVM } from "@/types/view/suggestions.types";

/**
 * Props for SuggestionCard component.
 */
type SuggestionCardProps = {
  item: AISuggestionCardVM;
  isAlreadyOnWatchlist: boolean;
  isAdding: boolean;
  onAdd: () => void;
};

/**
 * Card component displaying a single AI movie suggestion.
 * Shows poster, title, year, justification, availability, and add button.
 */
export function SuggestionCard({ item, isAlreadyOnWatchlist, isAdding, onAdd }: SuggestionCardProps) {
  const buttonDisabled = isAlreadyOnWatchlist || isAdding;

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
      role="article"
      aria-label={`Sugestia filmu: ${item.title}${item.year ? ` (${item.year})` : ''}`}
    >
      <div className="flex gap-4">
        {/* Poster */}
        <div className="w-20 h-28 bg-muted rounded flex items-center justify-center flex-shrink-0">
          {item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={`Plakat filmu ${item.title}`}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="text-muted-foreground text-xs text-center px-1">
              Brak plakatu
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 text-foreground mb-1">
            {item.title}
            {item.year && (
              <span className="text-muted-foreground ml-2">
                ({item.year})
              </span>
            )}
          </h3>

          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
            {item.justification}
          </p>

          <AvailabilityIcons availability={item.availability} />
        </div>
      </div>

      {/* Add button */}
      <div className="mt-4 flex justify-end">
        <AddToWatchlistButton
          onAdd={onAdd}
          disabled={buttonDisabled}
          added={isAlreadyOnWatchlist}
        />
      </div>
    </div>
  );
}
