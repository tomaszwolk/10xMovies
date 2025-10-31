import { useState, useCallback, useEffect } from "react";
import type { WatchedViewMode, WatchedSortKey } from "@/types/view/watched.types";

const WATCHED_VIEW_MODE_KEY = "watched:viewMode";
const WATCHED_SORT_KEY = "watched:sort";

const DEFAULT_VIEW_MODE: WatchedViewMode = "grid";
const DEFAULT_SORT: WatchedSortKey = "added_desc";

const VALID_VIEW_MODES: WatchedViewMode[] = ["grid", "list"];
const VALID_SORT_KEYS: WatchedSortKey[] = ["added_desc", "imdb_desc", "year_desc", "year_asc"];

const LEGACY_SORT_MAP: Record<string, WatchedSortKey> = {
  watched_at_desc: "added_desc",
  rating_desc: "imdb_desc",
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[useWatchedPreferences] localStorage unavailable", error);
    }
    return null;
  }
}

function safeGetItem<T extends string>(key: string, normalizer: (value: string) => T | null, fallback: T): T {
  const storage = getStorage();

  if (!storage) {
    return fallback;
  }

  try {
    const storedValue = storage.getItem(key);

    if (!storedValue) {
      return fallback;
    }

    const normalized = normalizer(storedValue);

    if (normalized) {
      if (normalized !== storedValue) {
        storage.setItem(key, normalized);
      }
      return normalized;
    }

    storage.removeItem(key);
    return fallback;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[useWatchedPreferences] Failed to read ${key} from localStorage`, error);
    }
    return fallback;
  }
}

function safeSetItem(key: string, value: string) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[useWatchedPreferences] Failed to save ${key} in localStorage`, error);
    }
  }
}

function normalizeViewMode(value: string): WatchedViewMode | null {
  if (VALID_VIEW_MODES.includes(value as WatchedViewMode)) {
    return value as WatchedViewMode;
  }

  return null;
}

function normalizeSortKey(value: string): WatchedSortKey | null {
  if (VALID_SORT_KEYS.includes(value as WatchedSortKey)) {
    return value as WatchedSortKey;
  }

  if (value in LEGACY_SORT_MAP) {
    return LEGACY_SORT_MAP[value];
  }

  return null;
}

type WatchedPreferences = {
  viewMode: WatchedViewMode;
  sort: WatchedSortKey;
};

/**
 * Custom hook for managing watched movies preferences in sessionStorage.
 * Provides read/write access to user preferences with default values.
 *
 * @returns Object with current preferences and setter functions
 */
export function useWatchedPreferences() {
  const [preferences, setPreferences] = useState<WatchedPreferences>(() => ({
    viewMode: safeGetItem(WATCHED_VIEW_MODE_KEY, normalizeViewMode, DEFAULT_VIEW_MODE),
    sort: safeGetItem(WATCHED_SORT_KEY, normalizeSortKey, DEFAULT_SORT),
  }));

  useEffect(() => {
    safeSetItem(WATCHED_VIEW_MODE_KEY, preferences.viewMode);
    safeSetItem(WATCHED_SORT_KEY, preferences.sort);
  }, [preferences]);

  const setViewMode = useCallback((viewMode: WatchedViewMode) => {
    setPreferences(prev => {
      if (!normalizeViewMode(viewMode)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[useWatchedPreferences] Ignoring invalid viewMode value: ${viewMode}`);
        }
        return prev;
      }

      return { ...prev, viewMode };
    });
  }, []);

  const setSort = useCallback((sort: WatchedSortKey) => {
    setPreferences(prev => {
      if (!normalizeSortKey(sort)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[useWatchedPreferences] Ignoring invalid sort value: ${sort}`);
        }
        return prev;
      }

      return { ...prev, sort };
    });
  }, []);

  return {
    viewMode: preferences.viewMode,
    sort: preferences.sort,
    setViewMode,
    setSort,
  };
}
