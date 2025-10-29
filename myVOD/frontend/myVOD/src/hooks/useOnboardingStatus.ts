import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/api/auth";
import { listUserMovies } from "@/lib/api/movies";
import type { UserMovieDto, UserProfileDto } from "@/types/api.types";

type OnboardingStepKey = "platforms" | "add" | "watched";

export type OnboardingProgress = {
  hasPlatforms: boolean;
  hasWatchlistMovies: boolean;
  hasWatchedMovies: boolean;
};

const ONBOARDING_SEQUENCE: Array<{ key: OnboardingStepKey; path: string }> = [
  { key: "platforms", path: "/onboarding/platforms" },
  { key: "add", path: "/onboarding/add" },
  { key: "watched", path: "/onboarding/watched" },
];

type NextStepOptions = {
  fromStep?: OnboardingStepKey;
  fallback?: string;
};

const DEFAULT_FALLBACK_PATH = "/";

export function getNextOnboardingPath(
  progress: OnboardingProgress,
  options: NextStepOptions = {}
): string {
  const { fromStep, fallback = DEFAULT_FALLBACK_PATH } = options;

  const completionMap: Record<OnboardingStepKey, boolean> = {
    platforms: progress.hasPlatforms,
    add: progress.hasWatchlistMovies,
    watched: progress.hasWatchedMovies,
  };

  const startIndex = fromStep
    ? ONBOARDING_SEQUENCE.findIndex((step) => step.key === fromStep) + 1
    : 0;

  for (let index = Math.max(startIndex, 0); index < ONBOARDING_SEQUENCE.length; index += 1) {
    const step = ONBOARDING_SEQUENCE[index];
    if (!completionMap[step.key]) {
      return step.path;
    }
  }

  return fallback;
}

/**
 * Hook to check onboarding completion status.
 * Returns the current step user should be on based on their data.
 */
export function useOnboardingStatus() {
  // Fetch user profile to check platforms
  const { data: profile, isLoading: isLoadingProfile } = useQuery<UserProfileDto>({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    retry: false,
  });

  // Fetch watchlist movies
  const {
    data: watchlistMovies = [],
    isLoading: isLoadingWatchlist,
  } = useQuery<UserMovieDto[]>({
    queryKey: ["user-movies", "watchlist"],
    queryFn: () => listUserMovies("watchlist"),
    retry: false,
  });

  // Fetch watched movies
  const {
    data: watchedMovies = [],
    isLoading: isLoadingWatched,
  } = useQuery<UserMovieDto[]>({
    queryKey: ["user-movies", "watched"],
    queryFn: () => listUserMovies("watched"),
    retry: false,
  });

  const isLoading = isLoadingProfile || isLoadingWatchlist || isLoadingWatched;

  // Check completion status
  const hasPlatforms = (profile?.platforms?.length ?? 0) >= 1;
  const hasWatchlistMovies = watchlistMovies.length >= 3;
  const hasWatchedMovies = watchedMovies.length >= 3;

  // Determine which step user should be on
  let requiredStep: string | null = null;
  
  if (!hasPlatforms) {
    requiredStep = "/onboarding/platforms";
  } else if (!hasWatchlistMovies) {
    requiredStep = "/onboarding/add";
  } else if (!hasWatchedMovies) {
    requiredStep = "/onboarding/watched";
  }

  const isOnboardingComplete = hasPlatforms && hasWatchlistMovies && hasWatchedMovies;

  return {
    isLoading,
    isOnboardingComplete,
    requiredStep,
    progress: {
      hasPlatforms,
      hasWatchlistMovies,
      hasWatchedMovies,
    },
    profile,
    watchlistMovies,
    watchedMovies,
  };
}

