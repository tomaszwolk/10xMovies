import { z } from "zod";

/**
 * Zod schema for registration form validation.
 * Validates email format, password strength, and password confirmation.
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email jest wymagany")
      .email("Podaj poprawny adres email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .refine((v) => /[A-Za-z]/.test(v), {
        message: "Hasło musi zawierać literę",
      })
      .refine((v) => /\d/.test(v), {
        message: "Hasło musi zawierać cyfrę",
      }),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Helper function to check password rules for UI feedback.
 * Returns an object with boolean flags for each rule.
 */
export const checkPasswordRules = (password: string) => {
  return {
    hasMinLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
};

