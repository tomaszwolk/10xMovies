import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Hooks
import { useSessionPreferences } from "@/hooks/useSessionPreferences";
import { useWatchlistQuery } from "@/hooks/useWatchlistQuery";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePlatforms } from "@/hooks/usePlatforms";
import { useWatchlistSelectors } from "@/hooks/useWatchlistSelectors";
import { useMarkAsWatched, useDeleteFromWatchlist } from "@/hooks/useWatchlistActions";
import { useAISuggestionsHandler } from "@/hooks/useAISuggestionsHandler";
import { useAddMovie } from "@/hooks/useAddMovie";
import { useListUserMovies } from "@/hooks/useListUserMovies";
import { usePatchUserMovie } from "@/hooks/usePatchUserMovie";

// Components
import { WatchlistControlsBar } from "@/components/watchlist/WatchlistControlsBar";
import { WatchlistContent } from "@/components/watchlist/WatchlistContent";
import { ConfirmDialog } from "@/components/watchlist/ConfirmDialog";
import { SuggestionModal } from "@/components/watchlist/SuggestionModal";
import { ToastViewport } from "@/components/watchlist/ToastViewport";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Main watchlist page component.
 * Manages the complete watchlist functionality including preferences, data fetching,
 * user interactions, and UI state management.
 */
export function WatchlistPage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/auth/login", { replace: true });
    return null;
  }

  // Session preferences (view mode, sort, filters)
  const {
    viewMode,
    sort: sortOption,
    filters,
    setViewMode,
    setSort,
    updateFilters,
  } = useSessionPreferences();

  // Data fetching
  const watchlistQuery = useWatchlistQuery();
  const watchedQuery = useListUserMovies('watched');
  const userProfileQuery = useUserProfile();
  const platformsQuery = usePlatforms();

  // Process and filter data
  const { items, totalCount, visibleCount } = useWatchlistSelectors({
    data: watchlistQuery.data,
    userPlatforms: userProfileQuery.data?.platforms || [],
    sortOption,
    filters,
  });

  // Action handlers with optimistic updates
  const { mutate: markAsWatched } = useMarkAsWatched();
  const { mutate: deleteFromWatchlist } = useDeleteFromWatchlist();

  // AI suggestions
  const suggestionsHandler = useAISuggestionsHandler();

  // Add movie from search
  const addMovieMutation = useAddMovie();
  const patchUserMovieMutation = usePatchUserMovie();

  // UI state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Handlers
  const handleViewModeChange = (mode: typeof viewMode) => {
    setViewMode(mode);
  };

  const handleSortChange = (option: typeof sortOption) => {
    setSort(option);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    updateFilters(newFilters);
  };

  const handleAddToWatchlist = async (tconst: string) => {
    const watchedEntryId = watchedEntriesByTconst.get(tconst);

    if (watchedEntryId) {
      try {
        const result = await patchUserMovieMutation.mutateAsync({
          id: watchedEntryId,
          command: { action: 'restore_to_watchlist' },
        });
        toast.success(`"${result.movie.primary_title}" przywrócono do watchlisty`);
        return;
      } catch (error) {
        toast.error("Nie udało się przywrócić filmu do watchlisty");
        throw error;
      }
    }

    try {
      const result = await addMovieMutation.mutateAsync({ tconst });
      toast.success(`"${result.primaryTitle}" dodano do watchlisty`);
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 409) {
          toast.info("Ten film jest już na Twojej watchliście");
        } else {
          const detail = (error.response?.data as any)?.detail ?? (error.response?.data as any)?.tconst?.[0];
          toast.error(detail ?? "Nie udało się dodać filmu do watchlisty");
        }
      } else {
        toast.error("Nie udało się dodać filmu do watchlisty");
      }
      throw error;
    }
  };

  const handleAddToWatched = async (tconst: string) => {
    try {
      const result = await addMovieMutation.mutateAsync({ tconst, mark_as_watched: true });
      toast.success(`"${result.primaryTitle}" dodano do obejrzanych`);
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 409) {
          toast.info("Ten film był już oznaczony jako obejrzany");
        } else {
          const detail = (error.response?.data as any)?.detail ?? (error.response?.data as any)?.tconst?.[0];
          toast.error(detail ?? "Nie udało się dodać filmu do obejrzanych");
        }
      } else {
        toast.error("Nie udało się dodać filmu do obejrzanych");
      }
      throw error;
    }
  };

  const handleMarkWatched = (id: number) => {
    markAsWatched(id);
  };

  const handleDelete = (id: number) => {
    const movie = items.find(item => item.id === id);
    if (!movie) return;

    setConfirmDialog({
      open: true,
      title: "Usuń film z watchlisty",
      message: `Czy na pewno chcesz usunąć "${movie.movie.primary_title}" z Twojej watchlisty?`,
      onConfirm: () => {
        deleteFromWatchlist(id);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleSuggest = () => {
    suggestionsHandler.handleSuggestClick();
  };

  const handleAddFromSuggestion = (tconst: string) => {
    suggestionsHandler.addFromSuggestion(tconst);
  };

  // Get existing tconsts for duplicate checking
  const existingTconsts = items.map(item => item.movie.tconst);
  const watchedEntries = watchedQuery.data ?? [];
  const watchedEntriesByTconst = useMemo(() => {
    const map = new Map<string, number>();
    watchedEntries.forEach(entry => {
      map.set(entry.movie.tconst, entry.id);
    });
    return map;
  }, [watchedEntries]);
  const existingWatchedTconsts = useMemo(
    () => Array.from(watchedEntriesByTconst.keys()),
    [watchedEntriesByTconst]
  );

  // Loading states
  const isLoading = watchlistQuery.isLoading || userProfileQuery.isLoading || platformsQuery.isLoading;

  // Check if user has selected platforms for availability filtering
  const hasUserPlatforms = (userProfileQuery.data?.platforms?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-foreground mb-2">
              Moja lista filmów
            </h1>
            <p className="text-muted-foreground">
              Zarządzaj swoimi filmami do obejrzenia
            </p>
            {/* Navigation Tabs */}
            <div className="flex gap-1 mt-4">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                Watchlista
              </button>
              <button
                onClick={() => navigate('/app/watched')}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
              >
                Obejrzane
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle key="theme-toggle" />
            <button
              onClick={logout}
              className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors"
            >
              Wyloguj się
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="mb-6">
          <WatchlistControlsBar
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            sort={sortOption}
            onSortChange={handleSortChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            visibleCount={visibleCount}
            totalCount={totalCount}
            hasUserPlatforms={hasUserPlatforms}
            onSuggest={handleSuggest}
            isSuggestDisabled={suggestionsHandler.isSuggestDisabled}
            onAddToWatchlist={handleAddToWatchlist}
            onAddToWatched={handleAddToWatched}
            existingTconsts={existingTconsts}
            existingWatchedTconsts={existingWatchedTconsts}
          />
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border">
          <WatchlistContent
            items={items}
            viewMode={viewMode}
            isLoading={isLoading}
            platforms={platformsQuery.data || []}
            onMarkWatched={handleMarkWatched}
            onDelete={handleDelete}
            onAddToWatchlist={handleAddToWatchlist}
            onAddToWatched={handleAddToWatched}
            existingTconsts={existingTconsts}
            existingWatchedTconsts={existingWatchedTconsts}
          />
        </div>

        {/* Dialogs */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
        />

        <SuggestionModal
          open={suggestionsHandler.isModalOpen}
          onOpenChange={suggestionsHandler.closeModal}
          data={suggestionsHandler.suggestionsData || null}
          onAdd={handleAddFromSuggestion}
        />

        {/* Toast notifications */}
        <ToastViewport />
      </div>
    </div>
  );
}

