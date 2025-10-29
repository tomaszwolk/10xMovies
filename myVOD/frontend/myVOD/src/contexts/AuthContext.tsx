import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { AuthTokensDto } from "@/types/api.types";

type AuthContextType = {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (tokens: AuthTokensDto) => void;
  logout: () => void;
  updateAccessToken: (newAccessToken: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = "myVOD_access_token";
const REFRESH_TOKEN_KEY = "myVOD_refresh_token";
const ONBOARDING_CHECKED_KEY = "onboarding_initial_check_done";

/**
 * AuthProvider manages JWT tokens and authentication state.
 * Tokens are persisted in localStorage for session management.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize tokens synchronously from localStorage to avoid redirect flicker
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem(REFRESH_TOKEN_KEY)
  );

  const login = (tokens: AuthTokensDto) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
    setAccessToken(tokens.access);
    setRefreshToken(tokens.refresh);
    
    // Clear onboarding check flag on new login to trigger initial redirect
    sessionStorage.removeItem(ONBOARDING_CHECKED_KEY);
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    
    // Clear onboarding check flag on logout
    sessionStorage.removeItem(ONBOARDING_CHECKED_KEY);
  };

  const updateAccessToken = (newAccessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    setAccessToken(newAccessToken);
  };

  const isAuthenticated = !!accessToken && !!refreshToken;

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated, 
        accessToken, 
        refreshToken, 
        login, 
        logout,
        updateAccessToken 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context.
 * Must be used within AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

