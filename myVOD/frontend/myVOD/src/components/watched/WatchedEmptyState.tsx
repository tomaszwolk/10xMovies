import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * Empty state component for when watched movies list is empty.
 * Displays message and link to watchlist to encourage watching movies.
 */
export function WatchedEmptyState() {
  const navigate = useNavigate();

  const handleGoToWatchlist = () => {
    navigate('/app/watchlist');
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nie oznaczyłeś jeszcze żadnych filmów jako obejrzane
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Filmy oznaczone jako obejrzane pojawią się tutaj
        </p>
      </div>

      <Button onClick={handleGoToWatchlist} variant="outline">
        Przejdź do watchlisty
      </Button>
    </div>
  );
}
