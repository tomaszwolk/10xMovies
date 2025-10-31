import { Film } from "lucide-react";
import { SearchCombobox } from "./SearchCombobox";

/**
 * Props for EmptyState component.
 */
type EmptyStateProps = {
  onAddToWatchlist: (tconst: string) => Promise<void> | void;
  onAddToWatched: (tconst: string) => Promise<void> | void;
  existingTconsts: string[];
  existingWatchedTconsts: string[];
};

/**
 * Empty state component for when watchlist is empty.
 * Displays message and active search combobox to encourage adding movies.
 */
export function EmptyState({ onAddToWatchlist, onAddToWatched, existingTconsts, existingWatchedTconsts }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Twoja lista filmów jest pusta
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Dodaj swoje pierwsze filmy do obejrzenia, aby śledzić ich dostępność na platformach VOD
        </p>
      </div>

      <div className="w-full max-w-md">
        <SearchCombobox
          onAddToWatchlist={onAddToWatchlist}
          onAddToWatched={onAddToWatched}
          existingTconsts={existingTconsts}
          existingWatchedTconsts={existingWatchedTconsts}
        />
      </div>
    </div>
  );
}
