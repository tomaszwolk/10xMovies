import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WatchedEmptyState } from '../WatchedEmptyState';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('WatchedEmptyState', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render empty state message', () => {
    render(<WatchedEmptyState />);

    expect(screen.getByText('Nie oznaczyłeś jeszcze żadnych filmów jako obejrzane')).toBeInTheDocument();
    expect(screen.getByText('Filmy oznaczone jako obejrzane pojawią się tutaj')).toBeInTheDocument();
  });

  it('should render go to watchlist button', () => {
    render(<WatchedEmptyState />);

    const button = screen.getByText('Przejdź do watchlisty');
    expect(button).toBeInTheDocument();
  });

  it('should navigate to watchlist when button is clicked', () => {
    render(<WatchedEmptyState />);

    const button = screen.getByText('Przejdź do watchlisty');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/app/watchlist');
  });
});
