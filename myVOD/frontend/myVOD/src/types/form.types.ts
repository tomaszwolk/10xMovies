/**
 * Form-specific types for the registration view.
 * These types extend the API types with UI-specific fields.
 */

/**
 * ViewModel for the registration form.
 * Includes confirmPassword field which is not sent to the API.
 */
export type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * Raw error shape from the API (400 response).
 * Can have different structures depending on validation failures.
 */
export type RegisterApiError =
  | { email?: string[]; password?: string[] }
  | { error?: string }
  | Record<string, unknown>;

/**
 * Mapped error for UI display.
 * Normalizes API errors into a consistent structure for the form.
 */
export type RegisterErrorUI = {
  email?: string;
  password?: string;
  global?: string;
};

