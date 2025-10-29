import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { WatchedSearchCombobox } from "@/components/onboarding/WatchedSearchCombobox";
import { SelectedMoviesList } from "@/components/onboarding/SelectedMoviesList";
import { OnboardingFooterNav } from "@/components/onboarding/OnboardingFooterNav";
import { useOnboardingWatchedController } from "@/hooks/useOnboardingWatchedController";

/**
 * Onboarding page for marking movies as watched.
 * Step 3 of 3 in the onboarding flow.
 * Allows users to search and mark 0-3 movies as watched.
 * Both Skip and Finish buttons are always enabled.
 */
export function OnboardingWatchedPage() {
  const { viewModel, setQuery, pick, undo, finish, skip } = useOnboardingWatchedController();

  const canAddMore = viewModel.selected.length < viewModel.maxSelected;
  const selectedTconsts = new Set(viewModel.selected.map(item => item.tconst));

  return (
    <OnboardingLayout title="Oznacz filmy które już widziałeś">
      <ProgressBar current={3} total={3} />

      <OnboardingHeader
        title="Oznacz 3 filmy które już widziałeś"
        hint="Wyszukaj i oznacz filmy które oglądałeś, aby dostosować rekomendacje"
      />

      <div className="space-y-8">
        {/* Movie search combobox */}
        <div className="max-w-md mx-auto">
          <WatchedSearchCombobox
            value={viewModel.query}
            onChange={setQuery}
            onPick={pick}
            disabled={!canAddMore || viewModel.isSubmitting}
            selectedTconsts={selectedTconsts}
          />
        </div>

        {/* Selected movies list */}
        <div className="max-w-lg mx-auto">
          <SelectedMoviesList
            items={viewModel.selected}
            maxItems={viewModel.maxSelected}
            onUndo={undo}
          />
        </div>

        {/* Footer navigation */}
        <div className="pt-4">
          <OnboardingFooterNav
            onSkip={skip}
            onNext={finish}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}

