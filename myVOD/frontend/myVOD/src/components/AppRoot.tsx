import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile } from "@/lib/api/auth";

/**
 * Root component that handles initial routing based on user onboarding status.
 * Checks if authenticated user has completed onboarding (selected platforms).
 */
export function AppRoot() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Check if we have tokens in localStorage (more reliable than isAuthenticated)
  const hasTokens = !!localStorage.getItem('myVOD_access_token') && !!localStorage.getItem('myVOD_refresh_token');

  // Fetch user profile to check onboarding status
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
    enabled: hasTokens, // Use localStorage check instead of isAuthenticated
    retry: 1,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache (formerly cacheTime)
  });

  useEffect(() => {
    console.log('AppRoot: isAuthenticated:', isAuthenticated);
    console.log('AppRoot: hasTokens:', hasTokens);
    console.log('AppRoot: isLoading:', isLoading);
    console.log('AppRoot: profile:', profile);
    console.log('AppRoot: error:', error);

    // Small delay to ensure AuthContext has updated
    const timer = setTimeout(() => {
      if (!hasTokens) {
        // Not authenticated - redirect to login
        console.log('AppRoot: Redirecting to login');
        navigate('/auth/login', { replace: true });
        return;
      }

      if (isLoading) {
        // Still loading profile - wait
        console.log('AppRoot: Still loading profile');
        return;
      }

      if (error) {
        // Error fetching profile - assume onboarding not completed (new user)
        console.log('AppRoot: Error fetching profile, redirecting to onboarding');
        navigate('/onboarding/platforms', { replace: true });
        return;
      }

      if (profile) {
        // User has profile - check if they completed onboarding
        console.log('AppRoot: profile data:', JSON.stringify(profile, null, 2));
        const platforms = (profile as any).platforms || [];
        const hasCompletedOnboarding = platforms.length > 0;
        console.log('AppRoot: platforms array:', platforms);
        console.log('AppRoot: platforms.length:', platforms.length);
        console.log('AppRoot: hasCompletedOnboarding:', hasCompletedOnboarding);

        if (hasCompletedOnboarding) {
          // User has selected platforms - go to watchlist
          console.log('AppRoot: Redirecting to watchlist');
          navigate('/watchlist', { replace: true });
        } else {
          // User hasn't selected platforms - go to onboarding
          console.log('AppRoot: Redirecting to onboarding');
          navigate('/onboarding/platforms', { replace: true });
        }
      } else if (!isLoading) {
        // No profile data and not loading - likely a new user or API issue
        console.log('AppRoot: No profile data, redirecting to onboarding');
        navigate('/onboarding/platforms', { replace: true });
      }
    }, 100); // Small delay to ensure state updates

    return () => clearTimeout(timer);
  }, [hasTokens, profile, isLoading, error, navigate]);

  // Show loading spinner while checking authentication and profile
  if (!hasTokens || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // This should not be reached, but just in case
  return null;
}
