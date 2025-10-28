import { useEffect } from "react";
import { RegisterForm } from "@/pages/auth/components/RegisterForm";

/**
 * Registration page container.
 * Handles page layout, title, and redirects if user is already logged in.
 */
export function RegisterPage() {
  useEffect(() => {
    // Set page title
    document.title = "Rejestracja - MyVOD";
  }, []);

  // TODO: Add auth check - if user is logged in, redirect to home
  // For now, we'll implement this later when auth context is available

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Utwórz konto
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Dołącz do MyVOD i zarządzaj swoją listą filmów
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 shadow-xl p-6 sm:p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

