import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ProfilePage component
import { ProfilePage } from '../ProfilePage';

// Mock all dependencies
vi.mock('sonner');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    data: { email: 'test@example.com', platforms: [{ id: 1, platform_slug: 'netflix', platform_name: 'Netflix' }] },
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePlatforms', () => ({
  usePlatforms: () => ({
    data: [
      { id: 1, platform_slug: 'netflix', platform_name: 'Netflix' },
      { id: 2, platform_slug: 'hbo', platform_name: 'HBO' },
      { id: 3, platform_slug: 'disney', platform_name: 'Disney+' },
    ],
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUpdateUserPlatforms', () => ({
  useUpdateUserPlatforms: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useDeleteAccount', () => ({
  useDeleteAccount: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

describe('ProfilePage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe('ProfilePage Rendering', () => {
    it('should render the complete profile page successfully', () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Check that main elements are present
      expect(screen.getByText('Profil')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Moje platformy VOD')).toBeInTheDocument();
      expect(screen.getByText('Strefa zagrożenia')).toBeInTheDocument();
    });

    it('should render all platform checkboxes', () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('HBO')).toBeInTheDocument();
      expect(screen.getByText('Disney+')).toBeInTheDocument();
    });

    it('should render delete account button', () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      expect(screen.getByText('Usuń konto')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow platform selection changes', () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      const hboCheckbox = screen.getByRole('checkbox', { name: /HBO/ });
      expect(hboCheckbox).not.toBeChecked();

      fireEvent.click(hboCheckbox);
      expect(hboCheckbox).toBeChecked();
    });

    it('should show save button when changes are made', () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      // Initially save button should be disabled
      const saveButton = screen.getByText('Zapisz zmiany');
      expect(saveButton).toBeDisabled();

      // Make a change
      const hboCheckbox = screen.getByRole('checkbox', { name: /HBO/ });
      fireEvent.click(hboCheckbox);

      // Save button should now be enabled
      expect(saveButton).not.toBeDisabled();
    });

    it('should open delete confirmation dialog', () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      );

      const deleteButton = screen.getByText('Usuń konto');
      fireEvent.click(deleteButton);

      // Dialog should appear
      expect(screen.getByText('Czy na pewno chcesz usunąć konto?')).toBeInTheDocument();
    });
  });
});