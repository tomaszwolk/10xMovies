import { useMutation } from "@tanstack/react-query";
import { loginUser } from "@/lib/api/auth";
import type { LoginUserCommand, AuthTokensDto } from "@/types/api.types";

/**
 * Custom hook for user login using TanStack Query.
 * Provides mutation state and helpers for the authentication process.
 * 
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useLogin() {
  return useMutation<AuthTokensDto, unknown, LoginUserCommand>({
    mutationFn: loginUser,
  });
}

