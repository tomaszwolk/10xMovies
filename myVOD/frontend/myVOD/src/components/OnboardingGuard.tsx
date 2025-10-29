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
  console.log("[OnboardingGuard] 🎨 Component RENDER", { path: window.location.pathname });
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isOnboardingComplete, requiredStep } = useOnboardingStatus();
  
  // Track if we've already done the initial check this session
  const hasCheckedRef = useRef(false);

  // Log when component mounts/unmounts
  useEffect(() => {
    console.log("[OnboardingGuard] 🟢 Component MOUNTED");
    return () => {
      console.log("[OnboardingGuard] 🔴 Component UNMOUNTED");
    };
  }, []);

  useEffect(() => {
    console.log("[OnboardingGuard] 🔄 useEffect START", {
      isLoading,
      currentPath: location.pathname,
      guardInstanceId: hasCheckedRef, // To see if it's the same instance
    });

    if (isLoading) {
      console.log("[OnboardingGuard] ⏸️  Still loading, returning early");
      return;
    }

    // Check if we've already done the initial redirect this session
    const hasCheckedThisSession = sessionStorage.getItem(ONBOARDING_CHECKED_KEY) === "true";
    
    console.log("[OnboardingGuard] 📊 State check:", {
      currentPath: location.pathname,
      hasCheckedRef: hasCheckedRef.current,
      hasCheckedThisSession,
      isOnboardingComplete,
      requiredStep
    });
    
    // If we've already checked, don't redirect anymore - allow free navigation
    if (hasCheckedThisSession || hasCheckedRef.current) {
      if (hasCheckedThisSession && !hasCheckedRef.current) {
        hasCheckedRef.current = true;
        console.log("[OnboardingGuard] 📝 Syncing ref with session flag");
      }
      console.log("[OnboardingGuard] ✅ Already checked, skipping redirect");
      return;
    }

    // Mark as checked
    console.log("[OnboardingGuard] 🎯 First check - setting flags");
    hasCheckedRef.current = true;
    sessionStorage.setItem(ONBOARDING_CHECKED_KEY, "true");

    console.log("[OnboardingGuard] 🏁 Initial check - marked as checked");

    // If onboarding is incomplete, redirect to first incomplete step
    if (!isOnboardingComplete && requiredStep) {
      console.log("[OnboardingGuard] 🔀 Redirecting to first incomplete step:", requiredStep);
      navigate(requiredStep, { replace: true });
    } else {
      console.log("[OnboardingGuard] ✅ Onboarding complete or no required step, no redirect needed");
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

