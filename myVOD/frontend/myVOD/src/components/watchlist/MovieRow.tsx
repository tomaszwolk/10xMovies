import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, ImageIcon } from "lucide-react";
import { AvailabilityIcons } from "./AvailabilityIcons";
import type { WatchlistItemVM } from "@/types/view/watchlist.types";
import type { PlatformDto } from "@/types/api.types";

/**
 * Props for MovieRow component.
 */
type MovieRowProps = {
  item: WatchlistItemVM;
  platforms: PlatformDto[];
  onMarkWatched: (id: number) => void;
  onDelete: (id: number) => void;
};

/**
 * Movie row component for list view.
 * Displays movie poster, title, year, genres, rating, availability, and action buttons in a horizontal layout.
 */
export const MovieRow = memo<MovieRowProps>(function MovieRow({ item, platforms, onMarkWatched, onDelete }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const hasGenres = item.movie.genres && item.movie.genres.length > 0;
  const displayGenres = hasGenres ? item.movie.genres!.slice(0, 3).join(", ") : null;

  return (
    <article
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
      aria-labelledby={`movie-title-${item.id}`}
      role="article"
    >
      <div className="flex gap-4">
        {/* Poster */}
        <div className="w-16 h-24 bg-gray-100 rounded flex-shrink-0">
          {!imageError && item.movie.poster_path ? (
            <img
              src={item.movie.poster_path}
              alt={item.movie.primary_title}
              className="w-full h-full object-cover rounded"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
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
                className="font-medium text-base line-clamp-1 mb-1 text-black"
              >
                {item.movie.primary_title}
              </h3>

              {/* Year, Genres, Rating */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {item.movie.start_year && (
                  <span>{item.movie.start_year}</span>
                )}
                {displayGenres && (
                  <>
                    <span>•</span>
                    <span className="truncate">{displayGenres}</span>
                  </>
                )}
                {item.movie.avg_rating && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-black">{item.movie.avg_rating}/10</span>
                  </>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-3">
                <AvailabilityIcons
                  availability={item.availability}
                  platforms={platforms}
                />

                {!item.availabilitySummary.isAvailableOnAny && (
                  <Badge variant="secondary" className="text-xs">
                    Niedostępny na wybranych platformach
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkWatched(item.id)}
                className="flex items-center gap-2"
                aria-label={`Oznacz "${item.movie.primary_title}" jako obejrzany`}
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                Obejrzane
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(item.id)}
                className="flex items-center gap-2 text-red-600 border-red-300 hover:text-red-700 hover:bg-red-50"
                aria-label={`Usuń "${item.movie.primary_title}" z watchlisty`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});
