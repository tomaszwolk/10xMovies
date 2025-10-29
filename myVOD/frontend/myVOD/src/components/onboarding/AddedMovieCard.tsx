import type { AddedMovieVM } from "@/types/api.types";

/**
 * Props for AddedMovieCard component.
 */
type AddedMovieCardProps = {
  item: AddedMovieVM;
};

/**
 * Mini card displaying an added movie in the onboarding session.
 * Shows poster/placeholder, title, and year in a 1:1 aspect ratio tile.
 */
export function AddedMovieCard({ item }: AddedMovieCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Poster container - 1:1 aspect ratio */}
      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden mb-2 flex-shrink-0">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={`${item.primaryTitle} poster`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>

      {/* Movie info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-1">
          {item.primaryTitle}
        </h4>
        {item.startYear && (
          <p className="text-xs text-muted-foreground">{item.startYear}</p>
        )}
      </div>
    </div>
  );
}
