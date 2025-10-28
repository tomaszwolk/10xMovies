import { useMutation } from "@tanstack/react-query";
import { registerUser } from "@/lib/api/auth";
import type { 
  RegisterUserCommand, 
  RegisteredUserDto 
} from "@/types/api.types";

/**
 * Custom hook for user registration using TanStack Query.
 * Provides mutation state and helpers for the registration process.
 * 
 * @returns Mutation object with mutate, isLoading, error, etc.
 */
export function useRegister() {
  return useMutation<RegisteredUserDto, unknown, RegisterUserCommand>({
    mutationFn: registerUser,
  });
}

