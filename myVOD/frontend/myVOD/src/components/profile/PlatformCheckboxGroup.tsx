import type { PlatformDto } from "@/types/api.types";
import { PlatformCheckboxCard } from "@/components/onboarding/PlatformCheckboxCard";

/**
 * Props for PlatformCheckboxGroup component.
 */
type PlatformCheckboxGroupProps = {
  platforms: PlatformDto[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  disabled?: boolean;
};

/**
 * Group of platform checkboxes with icons.
 * Displays platforms in a grid layout with accessibility features.
 */
export function PlatformCheckboxGroup({
  platforms,
  selectedIds,
  onToggle,
  disabled = false,
}: PlatformCheckboxGroupProps) {
  const selectedCount = selectedIds.length;

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="text-sm font-medium text-muted-foreground mb-4">
        Wybrane platformy ({selectedCount} z {platforms.length})
      </legend>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {platforms.map((platform) => (
          <PlatformCheckboxCard
            key={platform.id}
            id={platform.id}
            name={platform.platform_name}
            slug={platform.platform_slug}
            checked={selectedIds.includes(platform.id)}
            onChange={onToggle}
            disabled={disabled}
          />
        ))}
      </div>
    </fieldset>
  );
}

