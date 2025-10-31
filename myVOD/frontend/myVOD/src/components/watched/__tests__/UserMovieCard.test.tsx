import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserMovieCard } from '../UserMovieCard';
import type { WatchedMovieItemVM, PlatformDto } from '@/types/view/watched.types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  RotateCcw: () => <div data-testid="rotate-ccw-icon" />,
  ImageIcon: () => <div data-testid="image-icon" />,
}));

describe('UserMovieCard', () => {
  const mockPlatforms: PlatformDto[] = [
    { id: 1, platform_slug: 'netflix', platform_name: 'Netflix' },
    { id: 2, platform_slug: 'hbo', platform_name: 'HBO' },
  ];

  const mockItem: WatchedMovieItemVM = {
    id: 1,
    tconst: 'tt0111161',
    title: 'The Shawshank Redemption',
    year: 1994,
    genres: ['Drama', 'Crime'],
    avgRating: '9.3',
    posterPath: '/shawshank.jpg',
    watchedAt: '2024-01-01T00:00:00Z',
    watchedAtLabel: '1 stycznia 2024',
    availability: [
      { platform_id: 1, platform_name: 'Netflix', is_available: true },
      { platform_id: 2, platform_name: 'HBO', is_available: false },
    ],
    isAvailableOnAnyPlatform: true,
  };

  const defaultProps = {
    item: mockItem,
    platforms: mockPlatforms,
    onRestore: vi.fn(),
    isRestoring: false,
  };

  it('should render movie title and details', () => {
    render(<UserMovieCard {...defaultProps} />);

    expect(screen.getByText('The Shawshank Redemption')).toBeInTheDocument();
    expect(screen.getByText('1994')).toBeInTheDocument();
    expect(screen.getByText('Drama, Crime')).toBeInTheDocument();
    expect(screen.getByText('9.3/10')).toBeInTheDocument();
  });

  it('should render poster image when available', () => {
    render(<UserMovieCard {...defaultProps} />);

    const img = screen.getByAltText('The Shawshank Redemption');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/shawshank.jpg');
  });

  it('should render placeholder when poster is not available', () => {
    const itemWithoutPoster = {
      ...mockItem,
      posterPath: null,
    };

    render(<UserMovieCard {...defaultProps} item={itemWithoutPoster} />);

    expect(screen.getByTestId('image-icon')).toBeInTheDocument();
  });

  it('should show watched date', () => {
    render(<UserMovieCard {...defaultProps} />);

    expect(screen.getByText('Obejrzany: 1 stycznia 2024')).toBeInTheDocument();
  });

  it('should call onRestore when restore button is clicked', () => {
    render(<UserMovieCard {...defaultProps} />);

    const restoreButton = screen.getByText('Przywróć');
    fireEvent.click(restoreButton);

    expect(defaultProps.onRestore).toHaveBeenCalledWith(1);
  });

  it('should render restore button with icon', () => {
    render(<UserMovieCard {...defaultProps} />);

    expect(screen.getByTestId('rotate-ccw-icon')).toBeInTheDocument();
    expect(screen.getByText('Przywróć')).toBeInTheDocument();
  });

  it('should show restore button aria-label', () => {
    render(<UserMovieCard {...defaultProps} />);

    const button = screen.getByLabelText('Przywróć "The Shawshank Redemption" do watchlisty');
    expect(button).toBeInTheDocument();
  });

  it('should handle image error gracefully', () => {
    render(<UserMovieCard {...defaultProps} />);

    const img = screen.getByAltText('The Shawshank Redemption');
    fireEvent.error(img);

    // Should show placeholder after error
    expect(screen.getByTestId('image-icon')).toBeInTheDocument();
  });

  it('should limit genres display to 2 items', () => {
    const itemWithManyGenres = {
      ...mockItem,
      genres: ['Drama', 'Crime', 'Thriller', 'Action', 'Adventure'],
    };

    render(<UserMovieCard {...defaultProps} item={itemWithManyGenres} />);

    expect(screen.getByText('Drama, Crime')).toBeInTheDocument();
    expect(screen.queryByText('Thriller')).not.toBeInTheDocument();
  });

  it('should handle null genres gracefully', () => {
    const itemWithoutGenres = {
      ...mockItem,
      genres: null,
    };

    render(<UserMovieCard {...defaultProps} item={itemWithoutGenres} />);

    expect(screen.queryByText('•')).not.toBeInTheDocument();
  });

  it('should handle null year gracefully', () => {
    const itemWithoutYear = {
      ...mockItem,
      year: null,
    };

    render(<UserMovieCard {...defaultProps} item={itemWithoutYear} />);

    expect(screen.queryByText('1994')).not.toBeInTheDocument();
  });

  it('should handle null rating gracefully', () => {
    const itemWithoutRating = {
      ...mockItem,
      avgRating: null,
    };

    render(<UserMovieCard {...defaultProps} item={itemWithoutRating} />);

    expect(screen.queryByText('/10')).not.toBeInTheDocument();
  });

  it('should render with isRestoring state', () => {
    render(<UserMovieCard {...defaultProps} isRestoring={true} />);

    expect(screen.getByText('Przywracanie...')).toBeInTheDocument();
  });
});
