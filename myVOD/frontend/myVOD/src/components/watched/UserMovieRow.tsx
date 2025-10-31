import { useState, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { ImageIcon } from "lucide-react";
import { AvailabilityIcons } from "../watchlist/AvailabilityIcons";
import { RestoreButton } from "./RestoreButton";
import type { WatchedMovieItemVM } from "@/types/view/watched.types";
import type { PlatformDto } from "@/types/api.types";

/**
 * Props for UserMovieRow component.
 */
type UserMovieRowProps = {
  item: WatchedMovieItemVM;
  platforms: PlatformDto[];
  onRestore: (id: number) => void;
  isRestoring: boolean;
};

/**
 * Movie row component for watched movies list view.
 * Displays movie poster, title, year, genres, rating, availability, watched date, and restore button in a horizontal layout.
 */
export const UserMovieRow = memo<UserMovieRowProps>(function UserMovieRow({
  item,
  platforms,
  onRestore,
  isRestoring
}) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const hasGenres = item.genres && item.genres.length > 0;
  const displayGenres = hasGenres ? item.genres!.slice(0, 3).join(", ") : null;

  const handleRestore = () => {
    onRestore(item.id);
  };

  return (
    <article
      className="bg-card rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
      aria-labelledby={`movie-title-${item.id}`}
      role="article"
    >
      <div className="flex gap-4">
        {/* Poster */}
        <div className="w-16 h-24 bg-muted rounded flex-shrink-0">
          {!imageError && item.posterPath ? (
            <img
              src={item.posterPath}
              alt={item.title}
              className="w-full h-full object-cover rounded"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3
                id={`movie-title-${item.id}`}
                className="font-medium text-base line-clamp-1 mb-1 text-foreground"
              >
                {item.title}
              </h3>

              {/* Year, Genres, Rating */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {item.year && (
                  <span>{item.year}</span>
                )}
                {displayGenres && (
                  <>
                    <span>•</span>
                    <span className="truncate">{displayGenres}</span>
                  </>
                )}
                {item.avgRating && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-foreground">{item.avgRating}/10</span>
                  </>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-3 mb-2">
                <AvailabilityIcons
                  availability={item.availability}
                  platforms={platforms}
                />

                {!item.isAvailableOnAnyPlatform && (
                  <Badge variant="secondary" className="text-xs">
                    Niedostępny na wybranych platformach
                  </Badge>
                )}
              </div>

              {/* Watched Date */}
              <div className="text-sm text-muted-foreground">
                Obejrzany: {item.watchedAtLabel}
              </div>
            </div>

            {/* Action Button */}
            <div className="ml-4 flex-shrink-0">
              <RestoreButton
                onClick={handleRestore}
                loading={isRestoring}
                ariaLabel={`Przywróć "${item.title}" do watchlisty`}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});
