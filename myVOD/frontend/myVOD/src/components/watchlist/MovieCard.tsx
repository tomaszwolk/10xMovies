import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, ImageIcon } from "lucide-react";
import { AvailabilityIcons } from "./AvailabilityIcons";
import type { WatchlistItemVM } from "@/types/view/watchlist.types";
import type { PlatformDto } from "@/types/api.types";

/**
 * Props for MovieCard component.
 */
type MovieCardProps = {
  item: WatchlistItemVM;
  platforms: PlatformDto[];
  onMarkWatched: (id: number) => void;
  onDelete: (id: number) => void;
};

/**
 * Movie card component for grid view.
 * Displays movie poster, title, year, genres, rating, availability, and action buttons.
 */
export const MovieCard = memo<MovieCardProps>(function MovieCard({ item, platforms, onMarkWatched, onDelete }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const hasGenres = item.movie.genres && item.movie.genres.length > 0;
  const displayGenres = hasGenres ? item.movie.genres!.slice(0, 2).join(", ") : null;

  return (
    <article
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      aria-labelledby={`movie-title-${item.id}`}
      role="article"
    >
      {/* Poster */}
      <div className="aspect-[2/3] bg-gray-100 relative">
        {!imageError && item.movie.poster_path ? (
          <img
            src={item.movie.poster_path}
            alt={item.movie.primary_title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Availability badge overlay */}
        {!item.availabilitySummary.isAvailableOnAny && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs bg-black/70 text-white">
              Niedostępny
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3
          id={`movie-title-${item.id}`}
          className="font-medium text-sm line-clamp-2 mb-1 text-black"
        >
          {item.movie.primary_title}
        </h3>

        {/* Year, Genres, Rating */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {item.movie.start_year && (
            <span>{item.movie.start_year}</span>
          )}
          {displayGenres && (
            <>
              <span>•</span>
              <span className="truncate">{displayGenres}</span>
            </>
          )}
        </div>

        {/* Rating */}
        {item.movie.avg_rating && (
          <div className="text-sm font-medium text-gray-900 mb-2">
            {item.movie.avg_rating}/10
          </div>
        )}

        {/* Availability Icons */}
        <div className="mb-3">
          <AvailabilityIcons
            availability={item.availability}
            platforms={platforms}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkWatched(item.id)}
            className="flex-1 flex items-center gap-2"
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
    </article>
  );
});
