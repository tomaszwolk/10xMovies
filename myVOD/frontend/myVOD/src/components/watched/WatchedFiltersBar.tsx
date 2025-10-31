import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type WatchedFiltersBarProps = {
  hideUnavailable: boolean;
  onToggle: () => void;
  visibleCount: number;
  totalCount: number;
  hasUserPlatforms: boolean;
};

/**
 * Filters bar for watched view handling availability toggle and counters.
 */
export function WatchedFiltersBar({
  hideUnavailable,
  onToggle,
  visibleCount,
  totalCount,
  hasUserPlatforms,
}: WatchedFiltersBarProps) {
  return (
    <div className="flex items-center gap-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              disabled={!hasUserPlatforms}
              className="text-sm"
            >
              {hideUnavailable ? "Pokaż niedostępne" : "Ukryj niedostępne"}
            </Button>
          </TooltipTrigger>
          {!hasUserPlatforms && (
            <TooltipContent>
              <p>Wybierz platformy VOD w ustawieniach profilu</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <Badge variant="secondary" className="text-xs">
        Wyświetlane: {visibleCount}/{totalCount}
      </Badge>
    </div>
  );
}


