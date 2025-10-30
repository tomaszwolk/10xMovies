import type { ViewMode } from "@/types/view/watchlist.types";

/**
 * Props for SkeletonList component.
 */
type SkeletonListProps = {
  viewMode: ViewMode;
  count?: number;
};

/**
 * Skeleton card for movie grid view.
 */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Poster skeleton */}
      <div className="aspect-[2/3] bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="flex gap-1">
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded flex-1" />
          <div className="h-8 bg-gray-200 rounded w-8" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton row for movie list view.
 */
function SkeletonRow() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Poster skeleton */}
        <div className="w-16 h-24 bg-gray-200 rounded flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-gray-200 rounded" />
            <div className="w-6 h-6 bg-gray-200 rounded" />
            <div className="w-6 h-6 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loading component for watchlist.
 * Shows different layouts based on view mode.
 */
export function SkeletonList({ viewMode, count = 12 }: SkeletonListProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
