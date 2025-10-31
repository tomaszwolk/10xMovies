import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { MovieAvailabilityDto } from "@/types/api.types";

/**
 * Props for AvailabilityIcons component.
 */
type AvailabilityIconsProps = {
  availability: MovieAvailabilityDto[];
};

/**
 * Component displaying platform availability icons.
 * Shows colored badges for available platforms, gray for unavailable.
 */
export function AvailabilityIcons({ availability }: AvailabilityIconsProps) {
  if (!availability || availability.length === 0) {
    return null;
  }

  // Limit to first 3 platforms to avoid clutter
  const displayAvailability = availability.slice(0, 3);
  const hasMore = availability.length > 3;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {displayAvailability.map((avail) => (
          <Tooltip key={avail.platform_id}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 ${
                  avail.is_available === true
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                    : avail.is_available === false
                    ? 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800'
                }`}
              >
                {avail.platform_name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {avail.is_available === true && "Dostępny na tej platformie"}
                {avail.is_available === false && "Niedostępny na tej platformie"}
                {avail.is_available === null && "Status dostępności nieznany"}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}

        {hasMore && (
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            +{availability.length - 3}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
