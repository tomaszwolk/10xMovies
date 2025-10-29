import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Root component that handles initial routing based on user onboarding status.
 * Checks if authenticated user has completed onboarding (selected platforms).
 */
export function AppRoot() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // Not authenticated - redirect to login
      navigate('/auth/login', { replace: true });
      return;
    }

    // Authenticated users land on watchlist (OnboardingGuard can still redirect once if needed)
    navigate('/watchlist', { replace: true });
  }, [isAuthenticated, navigate]);

  // While redirecting, show a loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Przekierowywanie...</p>
      </div>
    </div>
  );
}
