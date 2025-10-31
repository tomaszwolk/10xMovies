import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WatchedSortKey } from "@/types/view/watched.types";

/**
 * Props for WatchedSortDropdown component.
 */
type WatchedSortDropdownProps = {
  value: WatchedSortKey;
  onChange: (key: WatchedSortKey) => void;
};

/**
 * Sort options for watched movies with their labels and descriptions.
 */
const SORT_OPTIONS: Record<WatchedSortKey, { label: string; description: string }> = {
  watched_at_desc: { label: "Data obejrzenia (najnowsze)", description: "Najpierw ostatnio obejrzane" },
  rating_desc: { label: "Ocena IMDb (najwyższe)", description: "Najwyższa ocena IMDb" },
};

/**
 * Dropdown for sorting watched movies.
 * Provides predefined sort options with descriptions.
 */
export function WatchedSortDropdown({ value, onChange }: WatchedSortDropdownProps) {
  const currentOption = SORT_OPTIONS[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between min-w-[200px]">
          {currentOption.label}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {(Object.entries(SORT_OPTIONS) as [WatchedSortKey, typeof SORT_OPTIONS[WatchedSortKey]][]).map(
          ([key, option]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onChange(key)}
              className={value === key ? "bg-accent" : ""}
            >
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
