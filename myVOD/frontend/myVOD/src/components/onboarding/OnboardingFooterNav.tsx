import { Button } from "@/components/ui/button";

/**
 * Props for OnboardingFooterNav component.
 */
type OnboardingFooterNavProps = {
  onSkip: () => void;
  onNext: () => void;
};

/**
 * Footer navigation for onboarding add movies page.
 * Provides Skip and Next buttons with proper alignment.
 * Next button is always enabled according to PRD requirements.
 */
export function OnboardingFooterNav({ onSkip, onNext }: OnboardingFooterNavProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:justify-between" role="group" aria-label="Onboarding navigation">
      <Button
        variant="outline"
        onClick={onSkip}
        className="sm:order-1"
        aria-label="Skip adding movies and continue to next step"
      >
        Skip
      </Button>

      <Button
        onClick={onNext}
        className="sm:order-2"
        aria-label="Continue to next onboarding step"
      >
        Dalej
      </Button>
    </div>
  );
}
