import { describe, it, expect } from 'vitest';
import { screen, renderWithProviders } from '@/test/utils';
import { OnboardingHeader } from '../OnboardingHeader';

describe('OnboardingHeader', () => {
  it('should render title and hint', () => {
    renderWithProviders(
      <OnboardingHeader title="Choose your platforms" hint="Select the streaming services you have access to" />
    );

    expect(screen.getByText('Choose your platforms')).toBeInTheDocument();
    expect(screen.getByText('Select the streaming services you have access to')).toBeInTheDocument();
  });

  it('should handle optional hint prop', () => {
    const { rerender } = renderWithProviders(
      <OnboardingHeader title="Test Title" hint="Test Hint" />
    );

    expect(screen.getByText('Test Hint')).toBeInTheDocument();

    // Test without hint
    rerender(<OnboardingHeader title="Test Title" />);

    expect(screen.queryByText('Test Hint')).not.toBeInTheDocument();
  });

  it('should have correct heading structure', () => {
    renderWithProviders(
      <OnboardingHeader title="Test Title" hint="Test Hint" />
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Test Title');
    expect(heading).toHaveClass('text-2xl', 'font-semibold', 'tracking-tight');
  });
});
