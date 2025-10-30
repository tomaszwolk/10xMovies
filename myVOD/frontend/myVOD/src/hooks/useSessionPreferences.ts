import { useState, useCallback, useEffect } from "react";
import type { ViewMode, SortOption, FiltersState } from "@/types/view/watchlist.types";

// Session storage keys
const WATCHLIST_VIEW_MODE_KEY = "watchlist:viewMode";
const WATCHLIST_SORT_KEY = "watchlist:sort";
const WATCHLIST_ONLY_AVAILABLE_KEY = "watchlist:onlyAvailable";
const WATCHLIST_HIDE_UNAVAILABLE_KEY = "watchlist:hideUnavailable";

// Default values
const DEFAULT_VIEW_MODE: ViewMode = "grid";
const DEFAULT_SORT: SortOption = "added_desc";
const DEFAULT_FILTERS: FiltersState = {
  onlyAvailable: false,
  hideUnavailable: false,
};

type SessionPreferences = {
  viewMode: ViewMode;
  sort: SortOption;
  filters: FiltersState;
};

/**
 * Custom hook for managing watchlist preferences in sessionStorage.
 * Provides read/write access to user preferences with default values.
 *
 * @returns Object with current preferences and setter functions
 */
export function useSessionPreferences() {
  // Initialize state from sessionStorage or defaults
  const [preferences, setPreferences] = useState<SessionPreferences>(() => ({
    viewMode: (sessionStorage.getItem(WATCHLIST_VIEW_MODE_KEY) as ViewMode) || DEFAULT_VIEW_MODE,
    sort: (sessionStorage.getItem(WATCHLIST_SORT_KEY) as SortOption) || DEFAULT_SORT,
    filters: {
      onlyAvailable: sessionStorage.getItem(WATCHLIST_ONLY_AVAILABLE_KEY) === "true" || DEFAULT_FILTERS.onlyAvailable,
      hideUnavailable: sessionStorage.getItem(WATCHLIST_HIDE_UNAVAILABLE_KEY) === "true" || DEFAULT_FILTERS.hideUnavailable,
    },
  }));

  // Update sessionStorage when preferences change
  useEffect(() => {
    sessionStorage.setItem(WATCHLIST_VIEW_MODE_KEY, preferences.viewMode);
    sessionStorage.setItem(WATCHLIST_SORT_KEY, preferences.sort);
    sessionStorage.setItem(WATCHLIST_ONLY_AVAILABLE_KEY, String(preferences.filters.onlyAvailable));
    sessionStorage.setItem(WATCHLIST_HIDE_UNAVAILABLE_KEY, String(preferences.filters.hideUnavailable));
  }, [preferences]);

  // Setter functions
  const setViewMode = useCallback((viewMode: ViewMode) => {
    setPreferences(prev => ({ ...prev, viewMode }));
  }, []);

  const setSort = useCallback((sort: SortOption) => {
    setPreferences(prev => ({ ...prev, sort }));
  }, []);

  const setFilters = useCallback((filters: FiltersState) => {
    setPreferences(prev => ({ ...prev, filters }));
  }, []);

  const updateFilters = useCallback((updates: Partial<FiltersState>) => {
    setPreferences(prev => ({
      ...prev,
      filters: { ...prev.filters, ...updates }
    }));
  }, []);

  return {
    viewMode: preferences.viewMode,
    sort: preferences.sort,
    filters: preferences.filters,
    setViewMode,
    setSort,
    setFilters,
    updateFilters,
  };
}
