import { Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WatchedViewMode } from "@/types/view/watched.types";

/**
 * Props for WatchedViewToggle component.
 */
type WatchedViewToggleProps = {
  value: WatchedViewMode;
  onChange: (mode: WatchedViewMode) => void;
};

/**
 * Toggle button for switching between grid and list view modes in watched movies.
 * Uses Lucide icons with proper ARIA attributes.
 */
export function WatchedViewToggle({ value, onChange }: WatchedViewToggleProps) {
  return (
    <div className="flex items-center border border-border rounded-md">
      <Button
        variant={value === "grid" ? "secondary" : "outline"}
        size="sm"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        aria-label="Widok kafelkowy"
        className="rounded-r-none border-r border-border"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={value === "list" ? "secondary" : "outline"}
        size="sm"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        aria-label="Widok listy"
        className="rounded-l-none"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
