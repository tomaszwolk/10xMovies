import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FiltersState } from "@/types/view/watchlist.types";

/**
 * Props for FiltersBar component.
 */
type FiltersBarProps = {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  visibleCount: number;
  totalCount: number;
  hasUserPlatforms: boolean;
};

/**
 * Filters bar with availability checkboxes and visible items counter.
 * Includes tooltips for disabled states and explanatory text.
 */
export function FiltersBar({
  filters,
  onChange,
  visibleCount,
  totalCount,
  hasUserPlatforms,
}: FiltersBarProps) {
  const handleOnlyAvailableChange = (checked: boolean) => {
    onChange({
      ...filters,
      onlyAvailable: checked,
    });
  };

  const handleHideUnavailableChange = () => {
    // "Ukryj niedostępne" sets onlyAvailable to true
    onChange({
      ...filters,
      onlyAvailable: true,
    });
  };

  return (
    <div className="flex items-center gap-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="only-available"
                checked={filters.onlyAvailable}
                onCheckedChange={handleOnlyAvailableChange}
                disabled={!hasUserPlatforms}
              />
              <label
                htmlFor="only-available"
                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                  !hasUserPlatforms ? "text-gray-400" : "cursor-pointer"
                }`}
              >
                Tylko dostępne
              </label>
            </div>
          </TooltipTrigger>
          {!hasUserPlatforms && (
            <TooltipContent>
              <p>Wybierz platformy VOD w ustawieniach profilu</p>
            </TooltipContent>
          )}
        </Tooltip>

        <Button
          variant="outline"
          size="sm"
          onClick={handleHideUnavailableChange}
          disabled={!hasUserPlatforms}
          className="text-sm"
        >
          Ukryj niedostępne
        </Button>
      </TooltipProvider>

      <Badge variant="secondary" className="text-xs">
        Wyświetlane: {visibleCount}/{totalCount}
      </Badge>
    </div>
  );
}
