import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Hooks
import { useWatchedPreferences } from "@/hooks/useWatchedPreferences";
import { useUserMoviesWatched } from "@/hooks/useUserMoviesWatched";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePlatforms } from "@/hooks/usePlatforms";
import { useRestoreToWatchlist } from "@/hooks/useWatchedActions";

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

  // Actions
  const restoreMutation = useRestoreToWatchlist();

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

  // Loading states
  const isLoading = watchedQuery.isLoading || userProfileQuery.isLoading || platformsQuery.isLoading;

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
