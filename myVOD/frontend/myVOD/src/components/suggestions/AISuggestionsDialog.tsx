import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useAddToWatchlist } from "@/hooks/useAddToWatchlist";
import { mapAISuggestionsToVM } from "@/lib/utils/suggestions-mapper";
import { AISuggestionsHeader } from "./AISuggestionsHeader";
import { SuggestionList } from "./SuggestionList";
import { EmptyState } from "./EmptyState";

/**
 * Props for AISuggestionsDialog component.
 */
type AISuggestionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debug?: boolean;
  watchlistTconstSet?: Set<string>;
};

/**
 * Modal dialog for AI suggestions displayed over watchlist.
 * Controlled by route state, opens when navigating to /app/suggestions with asModal: true.
 */
export function AISuggestionsDialog({
  open,
  onOpenChange,
  debug,
  watchlistTconstSet
}: AISuggestionsDialogProps) {
  const navigate = useNavigate();
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set());
  const [isAddingByTconst, setIsAddingByTconst] = useState<Record<string, boolean>>({});

  // AI suggestions query
  const suggestionsQuery = useAISuggestions({ debug, enabled: open });
  const addMutation = useAddToWatchlist();

  // Map data to ViewModel
  const viewModel = mapAISuggestionsToVM(suggestionsQuery.data, suggestionsQuery.error);

  // Reset added set when modal opens
  useEffect(() => {
    if (open) {
      setAddedSet(new Set());
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Navigate back when closing modal
      navigate(-1);
    }
    onOpenChange(newOpen);
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleAddToWatchlist = async (tconst: string) => {
    setIsAddingByTconst(prev => ({ ...prev, [tconst]: true }));

    try {
      await addMutation.mutateAsync({ tconst });
      setAddedSet(prev => new Set([...prev, tconst]));
    } finally {
      setIsAddingByTconst(prev => ({ ...prev, [tconst]: false }));
    }
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        aria-describedby="ai-suggestions-description"
      >
        <AISuggestionsHeader
          expiresAt={viewModel.expiresAt}
          isRateLimited={viewModel.isRateLimited}
        />

        <div id="ai-suggestions-description" className="sr-only">
          Dialog zawierający spersonalizowane sugestie filmów wygenerowane przez sztuczną inteligencję
        </div>

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

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleClose} variant="outline" aria-label="Zamknij okno sugestii filmów">
            Zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
