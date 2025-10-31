import { WatchedViewToggle } from "./WatchedViewToggle";
import { WatchedSortDropdown } from "./WatchedSortDropdown";
import type { WatchedViewMode, WatchedSortKey } from "@/types/view/watched.types";

/**
 * Props for WatchedToolbar component.
 */
type WatchedToolbarProps = {
  viewMode: WatchedViewMode;
  onViewModeChange: (mode: WatchedViewMode) => void;
  sortKey: WatchedSortKey;
  onSortKeyChange: (key: WatchedSortKey) => void;
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
}: WatchedToolbarProps) {
  return (
    <div className="bg-card border-b px-4 py-3">
      <div className="flex items-center justify-between">
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
