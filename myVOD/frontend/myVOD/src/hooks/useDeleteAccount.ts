import { useMutation } from "@tanstack/react-query";
import { deleteUserAccount } from "@/lib/api/auth";

/**
 * Custom hook for deleting user account (GDPR compliance).
 * Uses TanStack Query for mutation management.
 *
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useDeleteAccount() {
  return useMutation<void, unknown, void>({
    mutationFn: deleteUserAccount,
  });
}
