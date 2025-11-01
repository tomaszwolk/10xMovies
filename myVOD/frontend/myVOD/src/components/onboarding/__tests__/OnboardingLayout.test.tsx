import { describe, it, expect } from 'vitest';
import { screen, renderWithProviders } from '@/test/utils';
import { OnboardingLayout } from '../OnboardingLayout';

describe('OnboardingLayout', () => {
  it('should render title and subtitle', () => {
    const { container } = renderWithProviders(
      <OnboardingLayout title="Test Title" subtitle="Test Subtitle">
        <div>Content</div>
      </OnboardingLayout>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should render children content', () => {
    const { container } = renderWithProviders(
      <OnboardingLayout title="Test Title">
        <div data-testid="child-content">Child Content</div>
      </OnboardingLayout>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should have correct semantic structure (header/main)', () => {
    const { container } = renderWithProviders(
      <OnboardingLayout title="Test Title">
        <div>Content</div>
      </OnboardingLayout>
    );

    const header = container.querySelector('header');
    const main = container.querySelector('main[role="main"]');

    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('aria-label', 'Onboarding content');
  });

  it('should apply responsive container styles', () => {
    const { container } = renderWithProviders(
      <OnboardingLayout title="Test Title">
        <div>Content</div>
      </OnboardingLayout>
    );

    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toHaveClass('min-h-screen', 'bg-background');

    const innerContainer = containerDiv.firstChild as HTMLElement;
    expect(innerContainer).toHaveClass('container', 'mx-auto', 'max-w-2xl', 'px-4', 'py-8');
  });

  it('should render optional subtitle when provided', () => {
    const { rerender } = renderWithProviders(
      <OnboardingLayout title="Test Title" subtitle="Test Subtitle">
        <div>Content</div>
      </OnboardingLayout>
    );

    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();

    // Test without subtitle
    rerender(
      <OnboardingLayout title="Test Title">
        <div>Content</div>
      </OnboardingLayout>
    );

    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();
  });
});
