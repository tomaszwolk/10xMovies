import { WatchedViewToggle } from "./WatchedViewToggle";
import { WatchedSortDropdown } from "./WatchedSortDropdown";
import { SearchCombobox } from "../watchlist/SearchCombobox";
import type { WatchedViewMode, WatchedSortKey } from "@/types/view/watched.types";

/**
 * Props for WatchedToolbar component.
 */
type WatchedToolbarProps = {
  viewMode: WatchedViewMode;
  onViewModeChange: (mode: WatchedViewMode) => void;
  sortKey: WatchedSortKey;
  onSortKeyChange: (key: WatchedSortKey) => void;
  onAddToWatchlist: (tconst: string) => Promise<void> | void;
  onAddToWatched: (tconst: string) => Promise<void> | void;
  existingWatchlistTconsts: string[];
  existingWatchedTconsts: string[];
};

/**
 * Toolbar for watched movies page with view toggle and sort dropdown.
 * Responsive layout with Tailwind CSS.
 */
export function WatchedToolbar({
  viewMode,
  onViewModeChange,
  sortKey,
  onSortKeyChange,
  onAddToWatchlist,
  onAddToWatched,
  existingWatchlistTconsts,
  existingWatchedTconsts,
}: WatchedToolbarProps) {
  return (
    <div className="bg-card border-b px-4 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left section: Search */}
        <div className="flex-1 max-w-md">
          <SearchCombobox
            onAddToWatchlist={onAddToWatchlist}
            onAddToWatched={onAddToWatched}
            existingTconsts={existingWatchlistTconsts}
            existingWatchedTconsts={existingWatchedTconsts}
          />
        </div>

        {/* Right section: View controls */}
        <div className="flex items-center gap-3">
          <WatchedViewToggle
            value={viewMode}
            onChange={onViewModeChange}
          />
          <WatchedSortDropdown
            value={sortKey}
            onChange={onSortKeyChange}
          />
        </div>
      </div>
    </div>
  );
}
