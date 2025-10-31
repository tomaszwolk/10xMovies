import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

type OnboardingGuardProps = {
  children: React.ReactNode;
};

const ONBOARDING_CHECKED_KEY = "onboarding_initial_check_done";

/**
 * "Soft" Guard component that manages initial onboarding redirect after login.
 * - On first navigation after login: checks onboarding status and redirects to first incomplete step if needed
 * - After that: allows free navigation to any page (including onboarding pages)
 * - User can revisit onboarding pages anytime to modify their selections
 * - Onboarding pages will show previously selected items (handled by the pages themselves)
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isOnboardingComplete, requiredStep } = useOnboardingStatus();

  // Track if we've already done the initial check this session
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Check if we've already done the initial redirect this session
    const hasCheckedThisSession = sessionStorage.getItem(ONBOARDING_CHECKED_KEY) === "true";

    // If we've already checked, don't redirect anymore - allow free navigation
    if (hasCheckedThisSession || hasCheckedRef.current) {
      if (hasCheckedThisSession && !hasCheckedRef.current) {
        hasCheckedRef.current = true;
      }
      return;
    }

    // Mark as checked
    hasCheckedRef.current = true;
    sessionStorage.setItem(ONBOARDING_CHECKED_KEY, "true");

    // If onboarding is incomplete, redirect to first incomplete step
    if (!isOnboardingComplete && requiredStep) {
      navigate(requiredStep, { replace: true });
    }
  }, [isLoading, isOnboardingComplete, requiredStep, location.pathname, navigate]);

  // Show loading state while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

