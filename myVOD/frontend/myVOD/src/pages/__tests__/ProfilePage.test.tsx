import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ProfilePage components
import {
  PageHeader,
  PlatformPreferencesCard,
  PlatformCheckboxGroup,
  PlatformCheckboxItem,
  SaveChangesBar,
  DangerZoneCard,
  DeleteAccountSection
} from '../ProfilePage';

// Types
import type { PlatformDto } from '@/types/api.types';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    data: { email: 'test@example.com', platforms: [] },
    isLoading: false,
    isError: false,
    isSuccess: true,
  }),
}));

vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: () => ({
    data: [],
    isLoading: false,
    isError: false,
    isSuccess: true,
  }),
}));

vi.mock('@/hooks/useUpdateUserPlatforms', () => ({
  useUpdateUserPlatforms: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDeleteAccount', () => ({
  useDeleteAccount: () => ({
    mutate: vi.fn(),
  }),
}));

// Create a wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ProfilePage Components', () => {
  const mockPlatforms: PlatformDto[] = [
    { id: 1, platform_slug: 'netflix', platform_name: 'Netflix' },
    { id: 2, platform_slug: 'hbo', platform_name: 'HBO' },
    { id: 3, platform_slug: 'disney', platform_name: 'Disney+' },
  ];

  describe('PageHeader', () => {
    it('should render title and email', () => {
      render(
        <TestWrapper>
          <PageHeader email="test@example.com" />
        </TestWrapper>
      );

      expect(screen.getByText('Profil')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('PlatformCheckboxItem', () => {
    const mockPlatform: PlatformDto = {
      id: 1,
      platform_slug: 'netflix',
      platform_name: 'Netflix'
    };

    it('should render platform name and checkbox', () => {
      render(
        <TestWrapper>
          <PlatformCheckboxItem
            platform={mockPlatform}
            checked={false}
            onChange={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Netflix')).toBeInTheDocument();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render checked state correctly', () => {
      render(
        <TestWrapper>
          <PlatformCheckboxItem
            platform={mockPlatform}
            checked={true}
            onChange={vi.fn()}
          />
        </TestWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should call onChange when checkbox is clicked', () => {
      const mockOnChange = vi.fn();
      render(
        <TestWrapper>
          <PlatformCheckboxItem
            platform={mockPlatform}
            checked={false}
            onChange={mockOnChange}
          />
        </TestWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <PlatformCheckboxItem
            platform={mockPlatform}
            checked={false}
            onChange={vi.fn()}
          />
        </TestWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'platform-1');
      expect(checkbox).toHaveAttribute('aria-describedby', 'platform-1-description');

      const label = document.getElementById('platform-1-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', 'platform-1');

      // Screen reader description should be present
      const description = document.getElementById('platform-1-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('sr-only');
      expect(description).toHaveTextContent('Nie wybrana platforma');
    });

    it('should show correct screen reader description for checked state', () => {
      render(
        <TestWrapper>
          <PlatformCheckboxItem
            platform={mockPlatform}
            checked={true}
            onChange={vi.fn()}
          />
        </TestWrapper>
      );

      const description = document.getElementById('platform-1-description');
      expect(description).toHaveTextContent('Wybrana platforma');
    });
  });

  describe('PlatformCheckboxGroup', () => {
    it('should render all platforms', () => {
      render(
        <TestWrapper>
          <PlatformCheckboxGroup
            platforms={mockPlatforms}
            selectedIds={[1]}
            onToggle={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('HBO')).toBeInTheDocument();
      expect(screen.getByText('Disney+')).toBeInTheDocument();
    });

    it('should have proper fieldset and legend for accessibility', () => {
      render(
        <TestWrapper>
          <PlatformCheckboxGroup
            platforms={mockPlatforms}
            selectedIds={[1]}
            onToggle={vi.fn()}
          />
        </TestWrapper>
      );

      const fieldset = document.querySelector('fieldset');
      expect(fieldset).toBeInTheDocument();

      const legend = document.querySelector('legend.sr-only');
      expect(legend).toBeInTheDocument();
      expect(legend).toHaveTextContent('Wybór platform VOD');
    });

    it('should show correct selection count', () => {
      render(
        <TestWrapper>
          <PlatformCheckboxGroup
            platforms={mockPlatforms}
            selectedIds={[1, 2]}
            onToggle={vi.fn()}
          />
        </TestWrapper>
      );

      const group = document.querySelector('[aria-label="2 z 3 platform wybranych"]');
      expect(group).toBeInTheDocument();
    });
  });

  describe('SaveChangesBar', () => {
    it('should render save button when not dirty', () => {
      render(
        <TestWrapper>
          <SaveChangesBar
            dirty={false}
            saving={false}
            onSave={vi.fn()}
            onReset={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument();
      expect(screen.queryByText('Anuluj')).not.toBeInTheDocument();
      expect(screen.getByText('Zapisz zmiany')).toBeDisabled();
    });

    it('should render save and reset buttons when dirty', () => {
      render(
        <TestWrapper>
          <SaveChangesBar
            dirty={true}
            saving={false}
            onSave={vi.fn()}
            onReset={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument();
      expect(screen.getByText('Anuluj')).toBeInTheDocument();
      expect(screen.getByText('Zapisz zmiany')).not.toBeDisabled();
    });

    it('should show loading state', () => {
      render(
        <TestWrapper>
          <SaveChangesBar
            dirty={true}
            saving={true}
            onSave={vi.fn()}
            onReset={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Zapisywanie...')).toBeInTheDocument();
      expect(screen.getByText('Anuluj')).toBeDisabled();
    });

    it('should call onSave when save button is clicked', () => {
      const mockOnSave = vi.fn();
      render(
        <TestWrapper>
          <SaveChangesBar
            dirty={true}
            saving={false}
            onSave={mockOnSave}
            onReset={vi.fn()}
          />
        </TestWrapper>
      );

      const saveButton = screen.getByText('Zapisz zmiany');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('should call onReset when reset button is clicked', () => {
      const mockOnReset = vi.fn();
      render(
        <TestWrapper>
          <SaveChangesBar
            dirty={true}
            saving={false}
            onSave={vi.fn()}
            onReset={mockOnReset}
          />
        </TestWrapper>
      );

      const resetButton = screen.getByText('Anuluj');
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
    });

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <SaveChangesBar
            dirty={true}
            saving={false}
            onSave={vi.fn()}
            onReset={vi.fn()}
          />
        </TestWrapper>
      );

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
      expect(toolbar).toHaveAttribute('aria-label', 'Akcje zapisywania preferencji platform');

      // Screen reader descriptions should be present
      expect(document.getElementById('reset-description')).toBeInTheDocument();
      expect(document.getElementById('save-description')).toBeInTheDocument();
    });
  });

  describe('DangerZoneCard', () => {
    it('should render danger zone with delete button', () => {
      render(
        <TestWrapper>
          <DangerZoneCard onRequestDelete={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('Strefa zagrożenia')).toBeInTheDocument();
      expect(screen.getByText('Trwałe usunięcie konta zgodnie z RODO. Tej akcji nie można cofnąć.')).toBeInTheDocument();
      expect(screen.getByText('Usuń konto')).toBeInTheDocument();
    });

    it('should call onRequestDelete when delete button is clicked', () => {
      const mockOnRequestDelete = vi.fn();
      render(
        <TestWrapper>
          <DangerZoneCard onRequestDelete={mockOnRequestDelete} />
        </TestWrapper>
      );

      const deleteButton = screen.getByText('Usuń konto');
      fireEvent.click(deleteButton);

      expect(mockOnRequestDelete).toHaveBeenCalled();
    });

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <DangerZoneCard onRequestDelete={vi.fn()} />
        </TestWrapper>
      );

      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-labelledby', 'danger-zone-title');

      const title = screen.getByText('Strefa zagrożenia');
      expect(title).toHaveAttribute('id', 'danger-zone-title');
    });
  });

  describe('DeleteAccountSection', () => {
    it('should render confirmation dialog when open', () => {
      render(
        <TestWrapper>
          <DeleteAccountSection
            open={true}
            onOpenChange={vi.fn()}
            deleting={false}
            onConfirm={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Czy na pewno chcesz usunąć konto?')).toBeInTheDocument();
      expect(screen.getByText(/Ta akcja jest nieodwracalna/)).toBeInTheDocument();
      expect(screen.getByText('Anuluj')).toBeInTheDocument();
      expect(screen.getByText('Tak, usuń konto')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <TestWrapper>
          <DeleteAccountSection
            open={false}
            onOpenChange={vi.fn()}
            deleting={false}
            onConfirm={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Czy na pewno chcesz usunąć konto?')).not.toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', () => {
      const mockOnConfirm = vi.fn();
      render(
        <TestWrapper>
          <DeleteAccountSection
            open={true}
            onOpenChange={vi.fn()}
            deleting={false}
            onConfirm={mockOnConfirm}
          />
        </TestWrapper>
      );

      const confirmButton = screen.getByText('Tak, usuń konto');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should disable buttons when deleting', () => {
      render(
        <TestWrapper>
          <DeleteAccountSection
            open={true}
            onOpenChange={vi.fn()}
            deleting={true}
            onConfirm={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Anuluj')).toBeDisabled();
      expect(screen.getByText('Usuwanie...')).toBeDisabled();
    });

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <DeleteAccountSection
            open={true}
            onOpenChange={vi.fn()}
            deleting={false}
            onConfirm={vi.fn()}
          />
        </TestWrapper>
      );

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'delete-dialog-description');

      expect(screen.getByText('Czy na pewno chcesz usunąć konto?')).toHaveAttribute('id', 'delete-dialog-title');
    });
  });

  describe('PlatformPreferencesCard', () => {
    it('should render card with title and description', () => {
      render(
        <TestWrapper>
          <PlatformPreferencesCard
            platforms={mockPlatforms}
            selectedIds={[]}
            onToggle={vi.fn()}
            dirty={false}
            saving={false}
            onSave={vi.fn()}
            onReset={vi.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Moje platformy VOD')).toBeInTheDocument();
      expect(screen.getByText(/Wybierz platformy, na których chcesz sprawdzać dostępność filmów/)).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <PlatformPreferencesCard
            platforms={mockPlatforms}
            selectedIds={[]}
            onToggle={vi.fn()}
            dirty={false}
            saving={false}
            onSave={vi.fn()}
            onReset={vi.fn()}
          />
        </TestWrapper>
      );

      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-labelledby', 'platform-preferences-title');
    });
  });
});
