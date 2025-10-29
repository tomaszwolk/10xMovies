import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/pages/auth/components/LoginForm";

/**
 * Login page container.
 * Handles page layout, title, and displays success message from registration.
 */
export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const successMessage = location.state?.message;

  useEffect(() => {
    document.title = "Logowanie - MyVOD";
  }, []);

  // Redirect authenticated users via root gate
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Logowanie
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Zaloguj się do swojego konta MyVOD
          </p>
        </div>

        {/* Success Message from Registration */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <p className="text-green-200 text-sm text-center">
              {successMessage}
            </p>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl p-6 sm:p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

