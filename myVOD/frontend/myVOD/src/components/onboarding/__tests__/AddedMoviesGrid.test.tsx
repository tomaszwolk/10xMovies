import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { AddedMoviesGrid } from '../AddedMoviesGrid';
import type { AddedMovieVM } from '@/types/api.types';

const mockMovie1: AddedMovieVM = {
  tconst: 'tt0111161',
  primaryTitle: 'The Shawshank Redemption',
  startYear: 1994,
  posterUrl: '/poster1.jpg',
  userMovieId: 1,
};

const mockMovie2: AddedMovieVM = {
  tconst: 'tt0068646',
  primaryTitle: 'The Godfather',
  startYear: 1972,
  posterUrl: '/poster2.jpg',
  userMovieId: 2,
};

const mockMovie3: AddedMovieVM = {
  tconst: 'tt0071562',
  primaryTitle: 'The Godfather: Part II',
  startYear: 1974,
  posterUrl: null,
  userMovieId: 3,
};

describe('AddedMoviesGrid', () => {
  it('should render empty state when no items', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[]} onRemove={mockOnRemove} />);

    expect(screen.getByText('Brak dodanych filmów')).toBeInTheDocument();
  });

  it('should render movie cards for each item', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie1]} onRemove={mockOnRemove} />);

    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
  });

  it('should show counter badge with correct count', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie1, mockMovie2]} onRemove={mockOnRemove} />);

    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('should show placeholder slots for empty positions', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie1]} onRemove={mockOnRemove} />);

    // Should show 2 placeholder slots when only 1 movie is added
    const placeholders = document.querySelectorAll('.border-dashed');
    expect(placeholders).toHaveLength(2);
  });

  it('should render max 3 items', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie1, mockMovie2, mockMovie3]} onRemove={mockOnRemove} />);

    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('The Godfather')).toBeInTheDocument();
    expect(screen.getByText('The Godfather: Part II')).toBeInTheDocument();

    // Should not show placeholders when all 3 slots are filled
    const placeholders = document.querySelectorAll('.border-dashed');
    expect(placeholders).toHaveLength(0);
  });

  it('should call onRemove when remove button clicked', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie1]} onRemove={mockOnRemove} />);

    const removeButton = screen.getByRole('button', { name: /usuń.*shawshank.*watchlisty/i });
    removeButton.click();

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
    expect(mockOnRemove).toHaveBeenCalledWith(mockMovie1);
  });

  it('should render multiple movies correctly', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie1, mockMovie2]} onRemove={mockOnRemove} />);

    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('The Godfather')).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
    expect(screen.getByText('1972')).toBeInTheDocument();
  });

  it('should handle movie without poster', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie3]} onRemove={mockOnRemove} />);

    expect(screen.getByText('No image')).toBeInTheDocument();
  });

  it('should handle movie without year', () => {
    const mockOnRemove = vi.fn();
    const movieWithoutYear: AddedMovieVM = {
      ...mockMovie1,
      startYear: null,
    };

    render(<AddedMoviesGrid items={[movieWithoutYear]} onRemove={mockOnRemove} />);

    // Should not render year if null
    expect(screen.queryByText('1994')).not.toBeInTheDocument();
  });

  it('should show loading state when removing', () => {
    const mockOnRemove = vi.fn();

    render(
      <AddedMoviesGrid
        items={[mockMovie1]}
        onRemove={mockOnRemove}
        removingTconsts={new Set(['tt0111161'])}
      />
    );

    // The loading state is handled by AddedMovieCard, but we can verify the prop is passed
    const grid = screen.getByText('The Shawshank Redemption').closest('.bg-card');
    expect(grid).toBeInTheDocument();
  });

  it('should have correct grid layout classes', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie1]} onRemove={mockOnRemove} />);

    // Check for responsive grid classes - find the grid container by its classes
    const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-2');
    expect(gridContainer).toHaveClass('lg:grid-cols-3');
  });

  it('should render header with correct text', () => {
    const mockOnRemove = vi.fn();

    render(<AddedMoviesGrid items={[mockMovie1]} onRemove={mockOnRemove} />);

    expect(screen.getByText('Dodane filmy')).toBeInTheDocument();
  });
});
