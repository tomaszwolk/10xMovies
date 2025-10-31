import { memo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { MovieAvailabilityDto, PlatformDto } from "@/types/api.types";

/**
 * Props for AvailabilityIcons component.
 */
type AvailabilityIconsProps = {
  availability: MovieAvailabilityDto[];
  platforms: PlatformDto[];
};

/**
 * Icon mapping for different platforms.
 * Maps platform slugs to Lucide icons.
 */
const PLATFORM_ICONS: Record<string, string> = {
  'netflix': '🎬',
  'hbo': '📺',
  'amazon-prime': '📦',
  'disney-plus': '🐭',
  'hulu': '📱',
  'max': '🎭',
  'apple-tv': '🍎',
  'paramount-plus': '📡',
  'peacock': '🦚',
  'crave': '🎯',
  // Fallback for unknown platforms
  'default': '📺',
};

/**
 * Displays availability icons for movie platforms.
 * Shows colored icons for available platforms, gray for unavailable.
 * Only shows platforms that user has selected.
 */
export const AvailabilityIcons = memo<AvailabilityIconsProps>(function AvailabilityIcons({ availability, platforms }) {
  // Create a map of platform ID to platform data for quick lookup
  const platformMap = new Map(platforms.map(p => [p.id, p]));

  // Filter availability to only show user's selected platforms
  const userAvailability = availability.filter(a => platformMap.has(a.platform_id));

  if (userAvailability.length === 0) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Dostępność nieznana
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {userAvailability.map((avail) => {
          const platform = platformMap.get(avail.platform_id);
          if (!platform) return null;

          const icon = PLATFORM_ICONS[platform.platform_slug] || PLATFORM_ICONS.default;
          const isAvailable = avail.is_available === true;
          const tooltipText = `${platform.platform_name}: ${isAvailable ? 'Dostępny' : 'Niedostępny'}`;

          return (
            <Tooltip key={avail.platform_id}>
              <TooltipTrigger asChild>
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                    isAvailable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  title={tooltipText}
                >
                  {icon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});
