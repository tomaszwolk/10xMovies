import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { WatchlistPage } from "@/pages/WatchlistPage";
import { OnboardingPlatformsPage, OnboardingFirstMoviesPage, OnboardingAddPage, OnboardingWatchedPage } from "@/pages/onboarding";
import { AppRoot } from "@/components/AppRoot";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Protected route component that requires JWT authentication.
 * Redirects to login page if user is not authenticated.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Protected layout with OnboardingGuard.
 * This ensures OnboardingGuard is mounted only once for all protected routes.
 */
function ProtectedLayout() {
  console.log("[ProtectedLayout] 🏗️ Rendering");
  return (
    <ProtectedRoute>
      <OnboardingGuard>
        <Outlet />
      </OnboardingGuard>
    </ProtectedRoute>
  );
}

/**
 * Application router configuration.
 * Defines all routes and their corresponding components.
 */
export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Outlet />,
    children: [
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <AppRoot />,
      },
      {
        path: "watchlist",
        element: <WatchlistPage />,
      },
      {
        path: "onboarding",
        children: [
          {
            index: true,
            element: <Navigate to="/onboarding/platforms" replace />,
          },
          {
            path: "platforms",
            element: <OnboardingPlatformsPage />,
          },
          {
            path: "first-movies",
            element: <OnboardingFirstMoviesPage />,
          },
          {
            path: "add",
            element: <OnboardingAddPage />,
          },
          {
            path: "watched",
            element: <OnboardingWatchedPage />,
          },
        ],
      },
    ],
  },
]);

