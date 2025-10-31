import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Hooks
import { useWatchedPreferences } from "@/hooks/useWatchedPreferences";
import { useUserMoviesWatched } from "@/hooks/useUserMoviesWatched";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePlatforms } from "@/hooks/usePlatforms";
import { useRestoreToWatchlist } from "@/hooks/useWatchedActions";
import { useAddMovie } from "@/hooks/useAddMovie";
import { useListUserMovies } from "@/hooks/useListUserMovies";
import { usePatchUserMovie } from "@/hooks/usePatchUserMovie";

// Components
import { WatchedToolbar } from "@/components/watched/WatchedToolbar";
import { WatchedContent } from "@/components/watched/WatchedContent";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Main watched movies page component.
 * Manages the complete watched movies functionality including preferences, data fetching,
 * user interactions, and UI state management.
 */
export function WatchedPage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/auth/login", { replace: true });
    return null;
  }

  // User preferences (view mode, sort)
  const {
    viewMode,
    sort,
    setViewMode,
    setSort,
  } = useWatchedPreferences();

  // User profile for platform availability
  const userProfileQuery = useUserProfile();
  const platformsQuery = usePlatforms();

  // Watched movies data
  const watchedQuery = useUserMoviesWatched({
    sortKey: sort,
    userPlatforms: userProfileQuery.data?.platforms || [],
  });
  const watchlistQuery = useListUserMovies('watchlist');

  // Actions
  const restoreMutation = useRestoreToWatchlist();
  const addMovieMutation = useAddMovie();
  const patchUserMovieMutation = usePatchUserMovie();

  // Handlers
  const handleViewModeChange = (mode: typeof viewMode) => {
    setViewMode(mode);
  };

  const handleSortChange = (sortKey: typeof sort) => {
    setSort(sortKey);
  };

  const handleRestore = (id: number) => {
    restoreMutation.mutate(id);
  };

  const watchedEntriesByTconst = useMemo(() => {
    const map = new Map<string, number>();
    (watchedQuery.items ?? []).forEach(entry => {
      map.set(entry.tconst, entry.id);
    });
    return map;
  }, [watchedQuery.items]);

  const watchlistEntriesByTconst = useMemo(() => {
    const map = new Map<string, number>();
    (watchlistQuery.data ?? []).forEach(entry => {
      map.set(entry.movie.tconst, entry.id);
    });
    return map;
  }, [watchlistQuery.data]);

  const existingWatchlistTconsts = useMemo(
    () => Array.from(watchlistEntriesByTconst.keys()),
    [watchlistEntriesByTconst]
  );

  const existingWatchedTconsts = useMemo(
    () => Array.from(watchedEntriesByTconst.keys()),
    [watchedEntriesByTconst]
  );

  const handleAddToWatchlist = async (tconst: string) => {
    if (watchlistEntriesByTconst.has(tconst)) {
      toast.info("Ten film jest już na Twojej watchliście");
      return;
    }

    const watchedId = watchedEntriesByTconst.get(tconst);

    try {
      if (watchedId) {
        const result = await patchUserMovieMutation.mutateAsync({
          id: watchedId,
          command: { action: 'restore_to_watchlist' },
        });
        toast.success(`"${result.movie.primary_title}" przywrócono do watchlisty`);
        return;
      }

      const result = await addMovieMutation.mutateAsync({ tconst });
      toast.success(`"${result.primaryTitle}" dodano do watchlisty`);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as any).response?.status === 409
      ) {
        toast.info("Ten film jest już na Twojej watchliście");
      } else {
        toast.error("Nie udało się dodać filmu do watchlisty");
      }
    }
  };

  const handleAddToWatched = async (tconst: string) => {
    if (watchedEntriesByTconst.has(tconst)) {
      toast.info("Ten film był już oznaczony jako obejrzany");
      return;
    }

    try {
      const result = await addMovieMutation.mutateAsync({ tconst, mark_as_watched: true });
      toast.success(`"${result.primaryTitle}" dodano do obejrzanych`);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as any).response?.status === 409
      ) {
        toast.info("Ten film był już oznaczony jako obejrzany");
      } else {
        toast.error("Nie udało się dodać filmu do obejrzanych");
      }
    }
  };

  // Loading states
  const isLoading =
    watchedQuery.isLoading ||
    userProfileQuery.isLoading ||
    platformsQuery.isLoading ||
    watchlistQuery.isLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-foreground mb-2">
              Obejrzane filmy
            </h1>
            <p className="text-muted-foreground">
              Historia filmów, które już obejrzałeś
            </p>
            {/* Navigation Tabs */}
            <div className="flex gap-1 mt-4">
              <button
                onClick={() => navigate('/app/watchlist')}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
              >
                Watchlista
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
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

        {/* Toolbar */}
        <div className="mb-6">
          <WatchedToolbar
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            sortKey={sort}
            onSortKeyChange={handleSortChange}
            onAddToWatchlist={handleAddToWatchlist}
            onAddToWatched={handleAddToWatched}
            existingWatchlistTconsts={existingWatchlistTconsts}
            existingWatchedTconsts={existingWatchedTconsts}
          />
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border">
          <WatchedContent
            items={watchedQuery.items}
            viewMode={viewMode}
            platforms={platformsQuery.data || []}
            isLoading={isLoading}
            isEmpty={watchedQuery.isEmpty}
            onRestore={handleRestore}
            isRestoring={restoreMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
