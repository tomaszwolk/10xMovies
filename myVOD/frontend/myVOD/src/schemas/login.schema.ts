import { z } from "zod";

/**
 * Zod schema for login form validation.
 * Validates email format and ensures password is not empty.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Proszę podać poprawny adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

