import { Badge } from "@/components/ui/badge";
import { SelectedMovieItem } from "./SelectedMovieItem";
import type { OnboardingSelectedItem } from "@/types/view/onboarding-watched.types";

/**
 * Props for SelectedMoviesList component.
 */
type SelectedMoviesListProps = {
  items: OnboardingSelectedItem[];
  maxItems: number;
  onUndo: (item: OnboardingSelectedItem) => void;
};

/**
 * List of selected movies marked as watched in the onboarding session.
 * Shows status indicators and allows undoing selections.
 */
export function SelectedMoviesList({ items, maxItems, onUndo }: SelectedMoviesListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Brak oznaczonych filmów</p>
        <p className="text-xs mt-1">Wyszukaj i oznacz filmy które już widziałeś</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Oznaczone filmy
        </h3>
        <Badge variant="secondary">
          {items.length}/{maxItems}
        </Badge>
      </div>

      {/* List of selected movies */}
      <div className="space-y-2">
        {items.map((item) => (
          <SelectedMovieItem
            key={item.tconst}
            item={item}
            onUndo={onUndo}
          />
        ))}
      </div>
    </div>
  );
}

