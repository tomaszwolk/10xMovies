import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RestoreButton } from '../RestoreButton';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  RotateCcw: () => <div data-testid="rotate-ccw-icon" />,
}));

describe('RestoreButton', () => {
  const defaultProps = {
    onClick: vi.fn(),
  };

  it('should render restore button with default text', () => {
    render(<RestoreButton {...defaultProps} />);

    const button = screen.getByText('Przywróć');
    expect(button).toBeInTheDocument();
  });

  it('should render icon', () => {
    render(<RestoreButton {...defaultProps} />);

    expect(screen.getByTestId('rotate-ccw-icon')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    render(<RestoreButton {...defaultProps} />);

    const button = screen.getByText('Przywróć');
    fireEvent.click(button);

    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it('should show loading text when loading is true', () => {
    render(<RestoreButton {...defaultProps} loading={true} />);

    expect(screen.getByText('Przywracanie...')).toBeInTheDocument();
    expect(screen.queryByText('Przywróć')).not.toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<RestoreButton {...defaultProps} loading={true} />);

    const button = screen.getByText('Przywracanie...');
    expect(button).toBeDisabled();
  });

  it('should render with custom aria-label', () => {
    const ariaLabel = 'Custom aria label';
    render(<RestoreButton {...defaultProps} ariaLabel={ariaLabel} />);

    const button = screen.getByLabelText(ariaLabel);
    expect(button).toBeInTheDocument();
  });

  it('should have button role', () => {
    render(<RestoreButton {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
