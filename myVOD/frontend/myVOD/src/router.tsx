import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { WatchlistPage } from "@/pages/WatchlistPage";

/**
 * Application router configuration.
 * Defines all routes and their corresponding components.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/watchlist" replace />,
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
]);

