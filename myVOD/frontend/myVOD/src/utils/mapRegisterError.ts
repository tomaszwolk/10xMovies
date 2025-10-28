import type { RegisterApiError, RegisterErrorUI } from "@/types/form.types";

/**
 * Maps API error response to UI-friendly error structure.
 * Handles different error shapes from the backend safely.
 * 
 * @param error - Raw error from API
 * @returns Normalized error object for UI display
 */
export function mapRegisterError(error: unknown): RegisterErrorUI {
  const result: RegisterErrorUI = {};

  if (!error || typeof error !== "object") {
    result.global = "Wystąpił nieoczekiwany błąd";
    return result;
  }

  const apiError = error as RegisterApiError;

  // Handle field-specific errors (array format)
  if ("email" in apiError && Array.isArray(apiError.email)) {
    result.email = apiError.email[0] || "Nieprawidłowy email";
  }

  if ("password" in apiError && Array.isArray(apiError.password)) {
    result.password = apiError.password[0] || "Nieprawidłowe hasło";
  }

  // Handle generic error message
  if ("error" in apiError && typeof apiError.error === "string") {
    result.global = apiError.error;
  }

  // If no specific errors were found, set a generic message
  if (!result.email && !result.password && !result.global) {
    result.global = "Nie udało się utworzyć konta. Spróbuj ponownie później.";
  }

  return result;
}

