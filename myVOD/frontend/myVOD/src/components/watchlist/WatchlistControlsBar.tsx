import { SearchCombobox } from "./SearchCombobox";
import { ViewToggle } from "./ViewToggle";
import { SortDropdown } from "./SortDropdown";
import { FiltersBar } from "./FiltersBar";
import { SuggestAIButton } from "./SuggestAIButton";
import type { ViewMode, SortOption, FiltersState } from "@/types/view/watchlist.types";

/**
 * Props for WatchlistControlsBar component.
 */
type WatchlistControlsBarProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sort: SortOption;
  onSortChange: (option: SortOption) => void;
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  visibleCount: number;
  totalCount: number;
  hasUserPlatforms: boolean;
  onSuggest: () => void;
  isSuggestDisabled: boolean;
  onAddFromSearch: (tconst: string) => void;
  existingTconsts: string[];
};

/**
 * Control bar for watchlist page with search, view toggle, sort, filters, and AI suggestions.
 * Responsive layout with Tailwind CSS.
 */
export function WatchlistControlsBar({
  viewMode,
  onViewModeChange,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  visibleCount,
  totalCount,
  hasUserPlatforms,
  onSuggest,
  isSuggestDisabled,
  onAddFromSearch,
  existingTconsts,
}: WatchlistControlsBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left section: Search and AI suggestions */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-1">
          <div className="flex-1 max-w-md">
            <SearchCombobox
              onAdd={onAddFromSearch}
              existingTconsts={existingTconsts}
            />
          </div>
          <SuggestAIButton
            onClick={onSuggest}
            disabled={isSuggestDisabled}
          />
        </div>

        {/* Right section: View controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <ViewToggle
              value={viewMode}
              onChange={onViewModeChange}
            />
            <SortDropdown
              value={sort}
              onChange={onSortChange}
            />
          </div>
          <FiltersBar
            filters={filters}
            onChange={onFiltersChange}
            visibleCount={visibleCount}
            totalCount={totalCount}
            hasUserPlatforms={hasUserPlatforms}
          />
        </div>
      </div>
    </div>
  );
}
