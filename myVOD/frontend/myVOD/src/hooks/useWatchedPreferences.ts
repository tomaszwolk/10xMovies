import { useState, useCallback, useEffect } from "react";
import type { WatchedViewMode, WatchedSortKey } from "@/types/view/watched.types";

const WATCHED_VIEW_MODE_KEY = "watched:viewMode";
const WATCHED_SORT_KEY = "watched:sort";

const DEFAULT_VIEW_MODE: WatchedViewMode = "grid";
const DEFAULT_SORT: WatchedSortKey = "watched_at_desc";

const VALID_VIEW_MODES: WatchedViewMode[] = ["grid", "list"];
const VALID_SORT_KEYS: WatchedSortKey[] = ["watched_at_desc", "rating_desc"];

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

function safeGetItem<T extends string>(key: string, validator: (value: string) => value is T, fallback: T): T {
  const storage = getStorage();

  if (!storage) {
    return fallback;
  }

  try {
    const storedValue = storage.getItem(key);

    if (!storedValue) {
      return fallback;
    }

    if (validator(storedValue)) {
      return storedValue;
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

function isValidViewMode(value: string): value is WatchedViewMode {
  return VALID_VIEW_MODES.includes(value as WatchedViewMode);
}

function isValidSortKey(value: string): value is WatchedSortKey {
  return VALID_SORT_KEYS.includes(value as WatchedSortKey);
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
    viewMode: safeGetItem(WATCHED_VIEW_MODE_KEY, isValidViewMode, DEFAULT_VIEW_MODE),
    sort: safeGetItem(WATCHED_SORT_KEY, isValidSortKey, DEFAULT_SORT),
  }));

  useEffect(() => {
    safeSetItem(WATCHED_VIEW_MODE_KEY, preferences.viewMode);
    safeSetItem(WATCHED_SORT_KEY, preferences.sort);
  }, [preferences]);

  const setViewMode = useCallback((viewMode: WatchedViewMode) => {
    setPreferences(prev => {
      if (!isValidViewMode(viewMode)) {
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
      if (!isValidSortKey(sort)) {
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
