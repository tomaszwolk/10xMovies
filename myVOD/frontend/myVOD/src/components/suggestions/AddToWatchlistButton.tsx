import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Plus, Loader2 } from "lucide-react";

/**
 * Props for AddToWatchlistButton component.
 */
type AddToWatchlistButtonProps = {
  onAdd: () => Promise<void>;
  disabled: boolean;
  added: boolean;
};

/**
 * Button for adding movies to watchlist with loading states.
 * Shows different states: idle, loading, success (added).
 */
export function AddToWatchlistButton({ onAdd, disabled, added }: AddToWatchlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || added || isLoading) return;

    setIsLoading(true);
    try {
      await onAdd();
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (added) {
      return (
        <>
          <Check className="h-4 w-4" />
          Dodano
        </>
      );
    }

    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Dodaję...
        </>
      );
    }

    return (
      <>
        <Plus className="h-4 w-4" />
        Dodaj
      </>
    );
  };

  const getAriaLabel = () => {
    if (added) return "Film został już dodany do watchlisty";
    if (isLoading) return "Dodaję film do watchlisty...";
    if (disabled) return "Nie można dodać filmu do watchlisty";
    return "Dodaj film do watchlisty";
  };

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={disabled || added || isLoading}
      className="flex items-center gap-2"
      variant={added ? "secondary" : "default"}
      aria-label={getAriaLabel()}
    >
      {getButtonContent()}
    </Button>
  );
}
