import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { WatchlistPage } from "@/pages/WatchlistPage";
import { OnboardingPlatformsPage } from "@/pages/onboarding";
import { OnboardingFirstMoviesPage } from "@/pages/onboarding/OnboardingFirstMoviesPage";
import { AppRoot } from "@/components/AppRoot";
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
 * Application router configuration.
 * Defines all routes and their corresponding components.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppRoot />,
  },
  {
    path: "/watchlist",
    element: <WatchlistPage />,
  },
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
    path: "/onboarding",
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <Navigate to="/onboarding/platforms" replace />,
      },
      {
        path: "platforms",
        element: (
          <ProtectedRoute>
            <OnboardingPlatformsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "first-movies",
        element: (
          <ProtectedRoute>
            <OnboardingFirstMoviesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

