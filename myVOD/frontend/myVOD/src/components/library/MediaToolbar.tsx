import type { ReactNode } from "react";

type MediaToolbarProps = {
  searchSlot?: ReactNode;
  primaryActionsSlot?: ReactNode;
  viewControlsSlot?: ReactNode;
  secondaryControlsSlot?: ReactNode;
};

/**
 * Responsive toolbar shell shared by watchlist and watched views.
 * Accepts slots so each page can plug in its own controls while keeping layout consistent.
 */
export function MediaToolbar({
  searchSlot,
  primaryActionsSlot,
  viewControlsSlot,
  secondaryControlsSlot,
}: MediaToolbarProps) {
  return (
    <div className="bg-card border-b px-4 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-1">
          {searchSlot ? <div className="flex-1 max-w-md">{searchSlot}</div> : null}
          {primaryActionsSlot ? (
            <div className="flex items-stretch sm:items-center gap-3">{primaryActionsSlot}</div>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {viewControlsSlot ? (
            <div className="flex items-center gap-3">{viewControlsSlot}</div>
          ) : null}
          {secondaryControlsSlot ? secondaryControlsSlot : null}
        </div>
      </div>
    </div>
  );
}


