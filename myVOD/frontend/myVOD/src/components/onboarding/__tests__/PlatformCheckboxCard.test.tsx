import { describe, it, expect, vi } from 'vitest';
import { screen, renderWithProviders, fireEvent } from '@/test/utils';
import { PlatformCheckboxCard } from '../PlatformCheckboxCard';

// Mock platform icons
vi.mock('../platformIcons.tsx', () => ({
  getPlatformIcon: vi.fn((slug: string) => {
    if (slug === 'netflix') {
      return ({ className }: { className?: string }) => (
        <svg className={className} data-testid="netflix-icon" />
      );
    }
    return null; // Return null for unknown platforms to test fallback
  }),
}));

describe('PlatformCheckboxCard', () => {
  const defaultProps = {
    id: 1,
    name: 'Netflix',
    slug: 'netflix',
    checked: false,
    onChange: vi.fn(),
  };

  it('should render platform name and icon', () => {
    renderWithProviders(<PlatformCheckboxCard {...defaultProps} />);

    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByTestId('netflix-icon')).toBeInTheDocument();
  });

  it('should show checked state when checked=true', () => {
    renderWithProviders(<PlatformCheckboxCard {...defaultProps} checked={true} />);

    const card = screen.getByRole('checkbox');
    expect(card).toHaveAttribute('aria-checked', 'true');

    // Check visual indicator
    const checkIcon = document.querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
  });

  it('should call onChange when clicked', () => {
    const onChange = vi.fn();
    renderWithProviders(<PlatformCheckboxCard {...defaultProps} onChange={onChange} />);

    const card = screen.getByRole('checkbox');
    fireEvent.click(card);

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should call onChange on Space/Enter key press', () => {
    const onChange = vi.fn();
    renderWithProviders(<PlatformCheckboxCard {...defaultProps} onChange={onChange} />);

    const card = screen.getByRole('checkbox');

    // Test Space key
    fireEvent.keyDown(card, { key: ' ' });
    expect(onChange).toHaveBeenCalledWith(1);

    // Reset mock
    onChange.mockClear();

    // Test Enter key
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should be keyboard focusable', () => {
    renderWithProviders(<PlatformCheckboxCard {...defaultProps} />);

    const card = screen.getByRole('checkbox');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should show disabled state when disabled=true', () => {
    renderWithProviders(<PlatformCheckboxCard {...defaultProps} disabled={true} />);

    const card = screen.getByRole('checkbox');
    expect(card).toHaveAttribute('aria-disabled', 'true');
    expect(card).toHaveAttribute('tabIndex', '-1');
    expect(card).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should have correct aria attributes', () => {
    renderWithProviders(<PlatformCheckboxCard {...defaultProps} />);

    const card = screen.getByRole('checkbox');
    expect(card).toHaveAttribute('aria-checked', 'false');
    expect(card).toHaveAttribute('role', 'checkbox');
  });

  it('should display fallback icon when iconSrc not provided', () => {
    renderWithProviders(<PlatformCheckboxCard {...defaultProps} slug="unknown-platform" />);

    // Should show fallback with first letter
    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.getByText('N')).toHaveClass('font-bold');
  });
});
