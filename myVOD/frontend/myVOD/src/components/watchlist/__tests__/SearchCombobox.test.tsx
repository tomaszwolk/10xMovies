import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { SearchCombobox } from '../SearchCombobox';
import type { SearchOptionVM } from '@/types/api.types';

// Mock hooks and UI dependencies
const mockUseMovieSearch = vi.fn();

vi.mock('@/hooks/useMovieSearch', () => ({
  useMovieSearch: (query: string) => mockUseMovieSearch(query),
}));

vi.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader" />,
  Search: () => <div data-testid="search-icon" />,
  ImageIcon: () => <div data-testid="image-icon" />,
}));

describe('SearchCombobox', () => {
  const defaultResult: SearchOptionVM = {
    tconst: 'tt1234567',
    primaryTitle: 'Superman',
    startYear: 1978,
    avgRating: '7.4',
    posterUrl: '/poster.jpg',
  };

  beforeEach(() => {
    mockUseMovieSearch.mockReset();
    mockUseMovieSearch.mockReturnValue({
      data: [defaultResult],
      isLoading: false,
      error: null,
    });
  });

  const renderComponent = (props?: Partial<ComponentProps<typeof SearchCombobox>>) => {
    const onAddToWatchlist = vi.fn().mockResolvedValue(undefined);
    const onAddToWatched = vi.fn().mockResolvedValue(undefined);

    render(
      <SearchCombobox
        onAddToWatchlist={onAddToWatchlist}
        onAddToWatched={onAddToWatched}
        existingTconsts={[]}
        existingWatchedTconsts={[]}
        {...props}
      />
    );

    return { onAddToWatchlist, onAddToWatched };
  };

  const openResults = () => {
    const input = screen.getByPlaceholderText('Szukaj filmu...');
    fireEvent.change(input, { target: { value: 'su' } });
  };

  it('renders action buttons for each result', () => {
    renderComponent();
    openResults();

    const option = screen.getByRole('option');
    expect(within(option).getByText('+ do watchlist')).toBeInTheDocument();
    expect(within(option).getByText('+ do obejrzane')).toBeInTheDocument();
  });

  it('calls watchlist handler when clicking add to watchlist button', async () => {
    const { onAddToWatchlist } = renderComponent();
    openResults();

    const button = screen.getByText('+ do watchlist');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onAddToWatchlist).toHaveBeenCalledWith(defaultResult.tconst);
    });
  });

  it('calls watched handler when clicking add to watched button', async () => {
    const { onAddToWatched } = renderComponent();
    openResults();

    const button = screen.getByText('+ do obejrzane');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onAddToWatched).toHaveBeenCalledWith(defaultResult.tconst);
    });
  });

  it('disables watchlist button when movie already exists', () => {
    renderComponent({ existingTconsts: [defaultResult.tconst] });
    openResults();

    const button = screen.getByText('+ do watchlist');
    expect(button).toBeDisabled();
  });

  it('disables watched button when movie already in watched list', () => {
    renderComponent({ existingWatchedTconsts: [defaultResult.tconst] });
    openResults();

    const button = screen.getByText('+ do obejrzane');
    expect(button).toBeDisabled();
  });
});

