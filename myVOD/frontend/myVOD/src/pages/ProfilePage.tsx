import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Hooks
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePlatforms } from "@/hooks/usePlatforms";
import { useUpdateUserPlatforms } from "@/hooks/useUpdateUserPlatforms";
import { useDeleteAccount } from "@/hooks/useDeleteAccount";

// Types
import type { PlatformDto } from "@/types/api.types";
import type { PlatformSelectionViewModel, DeleteAccountViewModel } from "@/types/view/profile.types";

// Components
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

/**
 * Profile page component for managing user preferences and account settings.
 * Allows users to configure their VOD platform preferences and delete their account.
 */
export function ProfilePage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Data fetching - must be called before any conditional returns
  const userProfileQuery = useUserProfile();
  const platformsQuery = usePlatforms();

  // Mutations - must be called before any conditional returns
  const updatePlatformsMutation = useUpdateUserPlatforms();
  const deleteAccountMutation = useDeleteAccount();

  // Local state for platform selection - must be called before any conditional returns
  const [platformSelection, setPlatformSelection] = useState<PlatformSelectionViewModel>({
    allPlatforms: [],
    selectedPlatformIds: [],
    initialSelectedPlatformIds: [],
    isDirty: false,
    isSaving: false,
  });

  // Local state for delete account dialog - must be called before any conditional returns
  const [deleteAccountState, setDeleteAccountState] = useState<DeleteAccountViewModel>({
    isDialogOpen: false,
    isDeleting: false,
  });

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/auth/login", { replace: true });
    return null;
  }

  // Initialize platform selection when data is loaded
  if (platformsQuery.isSuccess && userProfileQuery.isSuccess && platformSelection.allPlatforms.length === 0) {
    const selectedIds = userProfileQuery.data.platforms.map(p => p.id);
    setPlatformSelection({
      allPlatforms: platformsQuery.data,
      selectedPlatformIds: selectedIds,
      initialSelectedPlatformIds: selectedIds,
      isDirty: false,
      isSaving: false,
    });
  }

  // Loading state
  if (userProfileQuery.isLoading || platformsQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  // Error state
  if (userProfileQuery.isError || platformsQuery.isError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center text-destructive">
          <h2 className="text-xl font-semibold mb-2">Błąd ładowania danych</h2>
          <p className="text-muted-foreground mb-4">
            Nie udało się pobrać danych profilu. Spróbuj odświeżyć stronę.
          </p>
          <button
            onClick={() => {
              userProfileQuery.refetch();
              platformsQuery.refetch();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // Success state - render full profile
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader email={userProfileQuery.data?.email || ""} />

      <PlatformPreferencesCard
        platforms={platformSelection.allPlatforms}
        selectedIds={platformSelection.selectedPlatformIds}
        onToggle={(id) => {
          const newSelectedIds = platformSelection.selectedPlatformIds.includes(id)
            ? platformSelection.selectedPlatformIds.filter(selectedId => selectedId !== id)
            : [...platformSelection.selectedPlatformIds, id];

          setPlatformSelection(prev => ({
            ...prev,
            selectedPlatformIds: newSelectedIds,
            isDirty: JSON.stringify(newSelectedIds.sort()) !== JSON.stringify(prev.initialSelectedPlatformIds.sort())
          }));
        }}
        dirty={platformSelection.isDirty}
        saving={platformSelection.isSaving}
        onSave={() => {
          setPlatformSelection(prev => ({ ...prev, isSaving: true }));
          updatePlatformsMutation.mutate(
            { platforms: platformSelection.selectedPlatformIds },
            {
              onSuccess: () => {
                setPlatformSelection(prev => ({
                  ...prev,
                  initialSelectedPlatformIds: [...prev.selectedPlatformIds],
                  isDirty: false,
                  isSaving: false
                }));
                toast.success("Zapisano zmiany");
              },
              onError: (error) => {
                setPlatformSelection(prev => ({ ...prev, isSaving: false }));
                toast.error("Nie udało się zapisać zmian. Sprawdź wybrane platformy.");
                console.error("Update platforms error:", error);
              }
            }
          );
        }}
        onReset={() => {
          setPlatformSelection(prev => ({
            ...prev,
            selectedPlatformIds: [...prev.initialSelectedPlatformIds],
            isDirty: false
          }));
        }}
      />

      <Separator className="my-8" />

      <DangerZoneCard
        onRequestDelete={() => setDeleteAccountState(prev => ({ ...prev, isDialogOpen: true }))}
      />

      <DeleteAccountSection
        open={deleteAccountState.isDialogOpen}
        onOpenChange={(open) => setDeleteAccountState(prev => ({ ...prev, isDialogOpen: open }))}
        deleting={deleteAccountState.isDeleting}
        onConfirm={() => {
          setDeleteAccountState(prev => ({ ...prev, isDeleting: true }));
          deleteAccountMutation.mutate(undefined, {
            onSuccess: () => {
              toast.success("Konto zostało usunięte");
              logout();
              navigate("/", { replace: true });
            },
            onError: (error) => {
              setDeleteAccountState(prev => ({ ...prev, isDeleting: false }));
              toast.error("Nie udało się usunąć konta. Spróbuj ponownie później.");
              console.error("Delete account error:", error);
            }
          });
        }}
      />
    </main>
  );
}

/**
 * Page header component displaying the profile title and user email.
 */
export function PageHeader({ email }: { email: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">Profil</h1>
      <p className="text-muted-foreground">{email}</p>
    </div>
  );
}

/**
 * Platform preferences card component.
 * Manages VOD platform selection with checkboxes and save/reset actions.
 * Enhanced with accessibility features for screen readers.
 */
export function PlatformPreferencesCard({
  platforms,
  selectedIds,
  onToggle,
  dirty,
  saving,
  onSave,
  onReset
}: {
  platforms: PlatformDto[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <Card role="region" aria-labelledby="platform-preferences-title">
      <CardHeader>
        <CardTitle id="platform-preferences-title">Moje platformy VOD</CardTitle>
        <CardDescription>
          Wybierz platformy, na których chcesz sprawdzać dostępność filmów.
          Zmiany będą widoczne natychmiast po zapisaniu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlatformCheckboxGroup
          platforms={platforms}
          selectedIds={selectedIds}
          onToggle={onToggle}
        />
      </CardContent>
      <CardFooter>
        <SaveChangesBar
          dirty={dirty}
          saving={saving}
          onSave={onSave}
          onReset={onReset}
        />
      </CardFooter>
    </Card>
  );
}

/**
 * Platform checkbox group component.
 * Displays a grid of platform checkboxes with enhanced accessibility.
 */
export function PlatformCheckboxGroup({
  platforms,
  selectedIds,
  onToggle
}: {
  platforms: PlatformDto[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">
        Wybór platform VOD - zaznacz platformy, na których chcesz sprawdzać dostępność filmów
      </legend>
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        role="group"
        aria-label={`${selectedIds.length} z ${platforms.length} platform wybranych`}
      >
        {platforms.map((platform) => (
          <PlatformCheckboxItem
            key={platform.id}
            platform={platform}
            checked={selectedIds.includes(platform.id)}
            onChange={onToggle}
          />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Individual platform checkbox item component.
 * Shows platform name with checkbox and handles toggle interaction.
 * Enhanced with accessibility features for screen readers and keyboard navigation.
 */
export function PlatformCheckboxItem({
  platform,
  checked,
  onChange
}: {
  platform: PlatformDto;
  checked: boolean;
  onChange: (id: number) => void;
}) {
  const checkboxId = `platform-${platform.id}`;

  return (
    <div
      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      role="group"
      aria-labelledby={`${checkboxId}-label`}
    >
      <Checkbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={() => onChange(platform.id)}
        aria-describedby={`${checkboxId}-description`}
      />
      <label
        id={`${checkboxId}-label`}
        htmlFor={checkboxId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 select-none"
      >
        {platform.platform_name}
      </label>
      <span
        id={`${checkboxId}-description`}
        className="sr-only"
      >
        {checked ? 'Wybrana platforma' : 'Nie wybrana platforma'}
      </span>
    </div>
  );
}

/**
 * Save changes bar component.
 * Provides save and reset buttons with proper state handling and accessibility.
 */
export function SaveChangesBar({
  dirty,
  saving,
  onSave,
  onReset
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div
      className="flex gap-2 w-full justify-end"
      role="toolbar"
      aria-label="Akcje zapisywania preferencji platform"
    >
      {dirty && (
        <Button
          variant="outline"
          onClick={onReset}
          disabled={saving}
          aria-describedby="reset-description"
        >
          Anuluj
        </Button>
      )}
      <Button
        onClick={onSave}
        disabled={!dirty || saving}
        aria-describedby="save-description"
      >
        {saving ? "Zapisywanie..." : "Zapisz zmiany"}
      </Button>

      {/* Screen reader descriptions */}
      <div className="sr-only">
        <span id="reset-description">
          Przywróć pierwotne ustawienia platform bez zapisywania zmian
        </span>
        <span id="save-description">
          {saving
            ? "Trwa zapisywanie zmian preferencji platform"
            : dirty
              ? "Zapisz wprowadzone zmiany preferencji platform"
              : "Brak zmian do zapisania"
          }
        </span>
      </div>
    </div>
  );
}

/**
 * Danger zone card component.
 * Contains the delete account functionality with enhanced accessibility.
 */
export function DangerZoneCard({ onRequestDelete }: { onRequestDelete: () => void }) {
  return (
    <Card className="border-destructive" role="region" aria-labelledby="danger-zone-title">
      <CardHeader>
        <CardTitle id="danger-zone-title" className="text-destructive">
          Strefa zagrożenia
        </CardTitle>
        <CardDescription>
          Trwałe usunięcie konta zgodnie z RODO. Tej akcji nie można cofnąć.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={onRequestDelete}
          aria-describedby="delete-account-description"
        >
          Usuń konto
        </Button>
        <div id="delete-account-description" className="sr-only">
          Otwórz okno dialogowe potwierdzające trwałe usunięcie konta zgodnie z RODO
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Delete account dialog component.
 * Handles the confirmation dialog for account deletion with enhanced accessibility.
 */
export function DeleteAccountSection({
  open,
  onOpenChange,
  deleting,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        role="alertdialog"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <AlertDialogHeader>
          <AlertDialogTitle id="delete-dialog-title">
            Czy na pewno chcesz usunąć konto?
          </AlertDialogTitle>
          <AlertDialogDescription id="delete-dialog-description">
            Ta akcja jest nieodwracalna. Wszystkie Twoje dane, filmy w watchliście
            oraz ustawienia zostaną trwale usunięte zgodnie z RODO.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={deleting}
            aria-describedby="cancel-description"
          >
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleting}
            onClick={onConfirm}
            aria-describedby="confirm-description"
          >
            {deleting ? "Usuwanie..." : "Tak, usuń konto"}
          </AlertDialogAction>

          {/* Screen reader descriptions for actions */}
          <div className="sr-only">
            <span id="cancel-description">
              Anuluj usunięcie konta i wróć do ustawień profilu
            </span>
            <span id="confirm-description">
              {deleting
                ? "Trwa usuwanie konta"
                : "Potwierdź trwałe usunięcie konta zgodnie z RODO"
              }
            </span>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Skeleton loading component for profile page.
 */
function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-10 w-48 mb-8" />

      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-6 w-64" />
      </div>

      {/* Preferences card skeleton */}
      <div className="mb-8 p-6 border rounded-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Danger zone skeleton */}
      <div className="p-6 border border-destructive rounded-lg">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-4 w-80 mb-4" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
