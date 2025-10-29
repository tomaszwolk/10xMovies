import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { MovieSearchCombobox } from "@/components/onboarding/MovieSearchCombobox";
import { AddedMoviesGrid } from "@/components/onboarding/AddedMoviesGrid";
import { OnboardingFooterNav } from "@/components/onboarding/OnboardingFooterNav";
import { useAddUserMovie } from "@/hooks/useAddUserMovie";
import type { AddedMovieVM, SearchOptionVM } from "@/types/api.types";

/**
 * Onboarding page for adding movies to watchlist.
 * Step 2 of 3 in the onboarding flow.
 * Allows users to search and add up to 3 movies to their watchlist.
 */
export function OnboardingAddPage() {
  const navigate = useNavigate();
  const [added, setAdded] = useState<AddedMovieVM[]>([]);
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set());

  const addUserMovieMutation = useAddUserMovie();

  const MAX_MOVIES = 3;
  const canAddMore = added.length < MAX_MOVIES;

  const handleAddMovie = async (searchOption: SearchOptionVM) => {
    // Prevent adding if already at limit or duplicate in session
    if (!canAddMore || addedSet.has(searchOption.tconst)) {
      return;
    }

    try {
      // Add to pending state immediately for UI feedback
      const tempAddedMovie: AddedMovieVM = {
        tconst: searchOption.tconst,
        primaryTitle: searchOption.primaryTitle,
        startYear: searchOption.startYear,
        posterUrl: searchOption.posterUrl,
      };

      setAdded(prev => [...prev, tempAddedMovie]);
      setAddedSet(prev => new Set(prev).add(searchOption.tconst));

      // Call API
      await addUserMovieMutation.mutateAsync({ tconst: searchOption.tconst });

      // Success toast
      toast.success(`"${searchOption.primaryTitle}" został dodany do Twojej watchlisty`);

    } catch (error: any) {
      // Remove from state on error
      setAdded(prev => prev.filter(movie => movie.tconst !== searchOption.tconst));
      setAddedSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(searchOption.tconst);
        return newSet;
      });

      // Handle different error types
      if (error?.status === 409) {
        // Movie already on watchlist - disable in session and show info toast
        setAddedSet(prev => new Set(prev).add(searchOption.tconst));
        toast.info("Ten film jest już na Twojej watchliście");
      } else if (error?.status === 400) {
        // Invalid tconst or movie not found
        toast.error("Nie udało się dodać filmu");
      } else if (error?.status >= 500) {
        // Server error
        toast.error("Wystąpił błąd serwera. Spróbuj ponownie później");
      } else {
        // Other errors (network, etc.)
        toast.error("Wystąpił błąd podczas dodawania filmu");
      }

    }
  };

  const handleSkip = () => {
    // Navigate to watchlist (since /onboarding/seen doesn't exist yet)
    navigate("/watchlist");
  };

  const handleNext = () => {
    // Navigate to watchlist (since /onboarding/seen doesn't exist yet)
    navigate("/watchlist");
  };

  return (
    <OnboardingLayout title="Dodaj pierwsze 3 filmy do watchlisty">
      <ProgressBar current={2} total={3} />

      <OnboardingHeader
        title="Dodaj pierwsze 3 filmy do watchlisty"
        hint="Wyszukaj filmy i dodaj je do swojej watchlisty, aby rozpocząć"
      />

      <div className="space-y-8">
        {/* Movie search combobox */}
        <div className="max-w-md mx-auto">
          <MovieSearchCombobox
            maxSelectable={MAX_MOVIES}
            disabledTconsts={addedSet}
            onSelectOption={handleAddMovie}
          />
        </div>

        {/* Added movies grid */}
        <div className="max-w-lg mx-auto">
          <AddedMoviesGrid items={added} />
        </div>

        {/* Footer navigation */}
        <div className="pt-4">
          <OnboardingFooterNav
            onSkip={handleSkip}
            onNext={handleNext}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}
