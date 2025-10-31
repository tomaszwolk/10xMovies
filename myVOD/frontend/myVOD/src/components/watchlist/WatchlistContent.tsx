import { MovieGrid } from "./MovieGrid";
import { MovieList } from "./MovieList";
import { EmptyState } from "./EmptyState";
import { SkeletonList } from "./SkeletonList";
import type { ViewMode, WatchlistItemVM } from "@/types/view/watchlist.types";
import type { PlatformDto } from "@/types/api.types";

/**
 * Props for WatchlistContent component.
 */
type WatchlistContentProps = {
  items: WatchlistItemVM[];
  viewMode: ViewMode;
  isLoading: boolean;
  platforms: PlatformDto[];
  onMarkWatched: (id: number) => void;
  onDelete: (id: number) => void;
  onAddFromSearch: (tconst: string) => void;
  existingTconsts: string[];
};

/**
 * Main content component for watchlist.
 * Manages different view modes, loading states, and empty states.
 * Delegates rendering to appropriate sub-components.
 */
export function WatchlistContent({
  items,
  viewMode,
  isLoading,
  platforms,
  onMarkWatched,
  onDelete,
  onAddFromSearch,
  existingTconsts,
}: WatchlistContentProps) {
  // Show skeleton during loading
  if (isLoading) {
    return <SkeletonList viewMode={viewMode} count={12} />;
  }

  // Show empty state when no items
  if (items.length === 0) {
    return (
      <EmptyState
        onAdd={onAddFromSearch}
        existingTconsts={existingTconsts}
      />
    );
  }

  // Render appropriate view mode
  if (viewMode === "grid") {
    return (
      <MovieGrid
        items={items}
        platforms={platforms}
        onMarkWatched={onMarkWatched}
        onDelete={onDelete}
      />
    );
  }

  return (
    <MovieList
      items={items}
      platforms={platforms}
      onMarkWatched={onMarkWatched}
      onDelete={onDelete}
    />
  );
}
