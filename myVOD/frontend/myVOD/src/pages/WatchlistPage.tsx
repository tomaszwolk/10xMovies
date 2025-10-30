import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Hooks
import { useSessionPreferences } from "@/hooks/useSessionPreferences";
import { useWatchlistQuery } from "@/hooks/useWatchlistQuery";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePlatforms } from "@/hooks/usePlatforms";
import { useWatchlistSelectors } from "@/hooks/useWatchlistSelectors";
import { useMarkAsWatched, useDeleteFromWatchlist } from "@/hooks/useWatchlistActions";
import { useAISuggestionsHandler } from "@/hooks/useAISuggestionsHandler";
import { useAddMovie } from "@/hooks/useAddMovie";

// Components
import { WatchlistControlsBar } from "@/components/watchlist/WatchlistControlsBar";
import { WatchlistContent } from "@/components/watchlist/WatchlistContent";
import { ConfirmDialog } from "@/components/watchlist/ConfirmDialog";
import { SuggestionModal } from "@/components/watchlist/SuggestionModal";
import { ToastViewport } from "@/components/watchlist/ToastViewport";

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

  const handleAddFromSearch = (tconst: string) => {
    addMovieMutation.mutate({ tconst });
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

  // Loading states
  const isLoading = watchlistQuery.isLoading || userProfileQuery.isLoading || platformsQuery.isLoading;

  // Check if user has selected platforms for availability filtering
  const hasUserPlatforms = (userProfileQuery.data?.platforms?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2">
              Moja lista filmów
            </h1>
            <p className="text-slate-400">
              Zarządzaj swoimi filmami do obejrzenia
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Wyloguj się
          </button>
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
            onAddFromSearch={handleAddFromSearch}
            existingTconsts={existingTconsts}
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <WatchlistContent
            items={items}
            viewMode={viewMode}
            isLoading={isLoading}
            platforms={platformsQuery.data || []}
            onMarkWatched={handleMarkWatched}
            onDelete={handleDelete}
            onAddFromSearch={handleAddFromSearch}
            existingTconsts={existingTconsts}
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

