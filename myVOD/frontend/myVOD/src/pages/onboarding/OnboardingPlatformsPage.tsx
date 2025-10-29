import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { PlatformsGrid, type PlatformViewModel } from "@/components/onboarding/PlatformsGrid";
import { ActionBar } from "@/components/onboarding/ActionBar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPlatforms, patchUserPlatforms } from "@/lib/api/platforms";

/**
 * Onboarding page for selecting VOD platforms.
 * Step 1 of 3 in the onboarding flow.
 */
export function OnboardingPlatformsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refs for focus management
  const errorSectionRef = useRef<HTMLDivElement>(null);

  // Local state for selected platform IDs
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Local state for validation errors
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch platforms
  const {
    data: platforms = [],
    isLoading,
    error: platformsError
  } = useQuery({
    queryKey: ['platforms'],
    queryFn: getPlatforms,
  });

  // Mutation for saving platform selection
  const mutation = useMutation({
    mutationFn: patchUserPlatforms,
    onSuccess: () => {
      // Invalidate and refetch user profile queries
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Navigate to next step
      navigate('/onboarding/add');
    },
    onError: (error: any) => {
      console.log('OnboardingPlatformsPage: Mutation error:', error);
      console.log('OnboardingPlatformsPage: Error response:', error?.response);
      console.log('OnboardingPlatformsPage: Error status:', error?.response?.status);

      // Handle authentication errors by redirecting to login
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('OnboardingPlatformsPage: Redirecting to login due to auth error');
        navigate('/auth/login');
      }
    },
  });

  // Helper function to get error message based on error type
  const getErrorMessage = (error: any) => {
    if (!error?.response) {
      return "Network error. Please check your connection and try again.";
    }

    const status = error.response.status;

    if (status === 400 || status === 422) {
      return "Invalid platform selection. Please try again.";
    }

    if (status === 401 || status === 403) {
      return "Your session has expired. Please log in again.";
    }

    if (status >= 500) {
      return "Server error. Please try again later.";
    }

    return "An unexpected error occurred. Please try again.";
  };

  // Focus management for error states
  useEffect(() => {
    if ((platformsError || mutation.error) && errorSectionRef.current) {
      errorSectionRef.current.focus();
    }
  }, [platformsError, mutation.error]);

  // Toggle platform selection
  const togglePlatform = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    // Clear validation error when user makes a selection
    if (validationError) {
      setValidationError(null);
    }
  };

  // Handle next button click
  const handleNext = () => {
    const ids = Array.from(selectedIds);

    // Validate that at least one platform is selected
    if (ids.length === 0) {
      setValidationError("Wybierz przynajmniej jedną platformę.");
      errorSectionRef.current?.focus();
      return;
    }

    // Check if we have a valid token
    const token = localStorage.getItem('myVOD_access_token');
    if (!token) {
      console.log('OnboardingPlatformsPage: No access token found, redirecting to login');
      navigate('/auth/login');
      return;
    }

    console.log('OnboardingPlatformsPage: Token found, proceeding with mutation:', !!token);

    // Clear any previous validation errors
    setValidationError(null);
    mutation.mutate(ids);
  };

  // Handle skip button click
  const handleSkip = () => {
    navigate('/onboarding/first-movies');
  };

  // Map platforms to view models
  const platformViewModels: PlatformViewModel[] = platforms.map(platform => ({
    id: platform.id,
    slug: platform.platform_slug,
    name: platform.platform_name,
    selected: selectedIds.has(platform.id),
  }));

  // Loading state
  if (isLoading) {
    return (
      <OnboardingLayout title="Welcome to MyVOD">
        <ProgressBar current={1} total={3} />
        <div className="space-y-6">
          <OnboardingHeader
            title="Choose your platforms"
            hint="Select the streaming services you have access to"
          />
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Error state for platforms loading
  if (platformsError) {
    return (
      <OnboardingLayout title="Welcome to MyVOD">
        <ProgressBar current={1} total={3} />
        <div className="space-y-6">
          <OnboardingHeader
            title="Choose your platforms"
            hint="Select the streaming services you have access to"
          />
          <Alert variant="destructive">
            <AlertTitle>Loading Error</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>Nie udało się wczytać listy platform. Spróbuj ponownie.</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto"
              >
                Spróbuj ponownie
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout title="Welcome to MyVOD">
      <ProgressBar current={1} total={3} />

      <OnboardingHeader
        title="Choose your platforms"
        hint="Select the streaming services you have access to"
      />

      <PlatformsGrid
        platforms={platformViewModels}
        onToggle={togglePlatform}
        isDisabled={mutation.isPending}
      />

      <ActionBar
        onSkip={handleSkip}
        onNext={handleNext}
        isBusy={mutation.isPending}
      />

      {validationError && (
        <Alert variant="destructive" ref={errorSectionRef} tabIndex={-1}>
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>
            {validationError}
          </AlertDescription>
        </Alert>
      )}

      {mutation.error && mutation.error.response?.status !== 401 && mutation.error.response?.status !== 403 && (
        <Alert variant="destructive" ref={errorSectionRef} tabIndex={-1}>
          <AlertTitle>Save Error</AlertTitle>
          <AlertDescription>
            {getErrorMessage(mutation.error)}
          </AlertDescription>
        </Alert>
      )}
    </OnboardingLayout>
  );
}
