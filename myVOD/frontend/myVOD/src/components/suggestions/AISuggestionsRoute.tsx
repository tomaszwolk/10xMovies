import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useAddToWatchlist } from "@/hooks/useAddToWatchlist";
import { useWatchlistTconstSet } from "@/hooks/useWatchlistTconstSet";
import { mapAISuggestionsToVM } from "@/lib/utils/suggestions-mapper";
import { AISuggestionsDialog } from "./AISuggestionsDialog";
import { AISuggestionsHeader } from "./AISuggestionsHeader";
import { SuggestionList } from "./SuggestionList";
import { EmptyState } from "./EmptyState";

/**
 * Props for AISuggestionsRoute component.
 */
type AISuggestionsRouteProps = {
  debug?: boolean;
};

/**
 * Route component for AI suggestions at /app/suggestions.
 * Renders either as modal overlay (when asModal: true in state) or full page.
 */
export function AISuggestionsRoute({ debug }: AISuggestionsRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set());
  const [isAddingByTconst, setIsAddingByTconst] = useState<Record<string, boolean>>({});

  // Check if this should be rendered as modal
  const asModal = (location.state as { asModal?: boolean })?.asModal === true;

  // Get watchlist data for checking existing movies
  const watchlistTconstSet = useWatchlistTconstSet();

  // AI suggestions query
  const suggestionsQuery = useAISuggestions({ debug, enabled: !asModal });
  const addMutation = useAddToWatchlist();

  // Map data to ViewModel
  const viewModel = mapAISuggestionsToVM(suggestionsQuery.data, suggestionsQuery.error);

  // Reset added set when component mounts (for full page view)
  useEffect(() => {
    if (!asModal) {
      setAddedSet(new Set());
    }
  }, [asModal]);

  const handleAddToWatchlist = async (tconst: string) => {
    setIsAddingByTconst(prev => ({ ...prev, [tconst]: true }));

    try {
      await addMutation.mutateAsync({ tconst });
      setAddedSet(prev => new Set([...prev, tconst]));
    } finally {
      setIsAddingByTconst(prev => ({ ...prev, [tconst]: false }));
    }
  };

  const handleClose = () => {
    navigate('/app/watchlist');
  };

  const getEmptyStateVariant = () => {
    if (suggestionsQuery.error) {
      const status = suggestionsQuery.error?.response?.status;
      if (status === 404) return 'no-data';
      if (status === 429) return 'rate-limited';
      return 'error';
    }

    if (viewModel.items.length === 0 && !suggestionsQuery.isLoading) {
      return 'no-suggestions';
    }

    return null;
  };

  const emptyStateVariant = getEmptyStateVariant();

  if (asModal) {
    // Render as modal overlay
    return (
      <AISuggestionsDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            navigate(-1);
          }
        }}
        debug={debug}
        watchlistTconstSet={watchlistTconstSet}
      />
    );
  }

  // Render as full page (standalone route)
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleClose}
          className="flex items-center gap-2 mb-4"
          aria-label="Powrót do listy filmów do obejrzenia"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do watchlisty
        </Button>
      </div>

      <AISuggestionsHeader
        expiresAt={viewModel.expiresAt}
        isRateLimited={viewModel.isRateLimited}
      />

      {suggestionsQuery.isLoading && (
        <div className="py-12 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Generuję sugestie...</span>
          </div>
        </div>
      )}

      {!suggestionsQuery.isLoading && emptyStateVariant && (
        <EmptyState variant={emptyStateVariant} message={viewModel.errorMessage} />
      )}

      {!suggestionsQuery.isLoading && !emptyStateVariant && (
        <SuggestionList
          items={viewModel.items}
          onAdd={handleAddToWatchlist}
          addedSet={addedSet}
          watchlistTconstSet={watchlistTconstSet}
          isAddingByTconst={isAddingByTconst}
        />
      )}
    </div>
  );
}
