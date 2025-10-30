import { MovieRow } from "./MovieRow";
import type { WatchlistItemVM } from "@/types/view/watchlist.types";
import type { PlatformDto } from "@/types/api.types";

/**
 * Props for MovieList component.
 */
type MovieListProps = {
  items: WatchlistItemVM[];
  platforms: PlatformDto[];
  onMarkWatched: (id: number) => void;
  onDelete: (id: number) => void;
};

/**
 * List layout for displaying movies in row format.
 * Vertical stack of movie rows with consistent spacing.
 */
export function MovieList({ items, platforms, onMarkWatched, onDelete }: MovieListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <MovieRow
          key={item.id}
          item={item}
          platforms={platforms}
          onMarkWatched={onMarkWatched}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
