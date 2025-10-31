import type { PlatformDto } from "@/types/api.types";

/**
 * View model for platform selection in profile view.
 * Manages the state of platform checkboxes and tracks changes.
 */
export type PlatformSelectionViewModel = {
  allPlatforms: PlatformDto[];
  selectedPlatformIds: number[];
  initialSelectedPlatformIds: number[];
  isDirty: boolean; // selectedPlatformIds !== initialSelectedPlatformIds
  isSaving: boolean;
};

/**
 * View model for delete account functionality.
 * Manages the state of the delete account dialog and operation.
 */
export type DeleteAccountViewModel = {
  isDialogOpen: boolean;
  isDeleting: boolean;
  error?: string;
};

/**
 * Query keys for profile-related data.
 * Used by TanStack Query for consistent cache management.
 */
export const ProfileQueryKeys = {
  userProfile: ['userProfile'] as const,
  platforms: ['platforms'] as const,
} as const;
