import { SuggestionCard } from "./SuggestionCard";
import type { AISuggestionCardVM } from "@/types/view/suggestions.types";

/**
 * Props for SuggestionList component.
 */
type SuggestionListProps = {
  items: AISuggestionCardVM[];
  onAdd: (tconst: string) => Promise<void>;
  addedSet: Set<string>;
  watchlistTconstSet?: Set<string>;
  isAddingByTconst?: Record<string, boolean>;
};

/**
 * List component displaying AI suggestion cards in a responsive grid.
 * Handles loading states and watchlist status checking.
 */
export function SuggestionList({
  items,
  onAdd,
  addedSet,
  watchlistTconstSet,
  isAddingByTconst = {},
}: SuggestionListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Lista sugestii filmów"
    >
      {items.map((item) => {
        const isAlreadyOnWatchlist = watchlistTconstSet?.has(item.tconst) || addedSet.has(item.tconst);
        const isAdding = isAddingByTconst[item.tconst] || false;

        return (
          <div key={item.tconst} role="listitem">
            <SuggestionCard
              item={item}
              isAlreadyOnWatchlist={isAlreadyOnWatchlist}
              isAdding={isAdding}
              onAdd={() => onAdd(item.tconst)}
            />
          </div>
        );
      })}
    </div>
  );
}
