import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMovieSearch } from '../useMovieSearch';
import { searchMovies } from '@/lib/api/movies';
import type { MovieSearchResultDto } from '@/types/api.types';

// Mock the API
vi.mock('@/lib/api/movies', () => ({
  searchMovies: vi.fn(),
}));

const mockSearchMovies = vi.mocked(searchMovies);

describe('useMovieSearch', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    return Wrapper;
  };

  it('should map MovieSearchResultDto to SearchOptionVM correctly', async () => {
    const mockDto: MovieSearchResultDto = {
      tconst: 'tt0111161',
      primary_title: 'The Shawshank Redemption',
      start_year: 1994,
      avg_rating: '9.3',
      poster_path: '/poster.jpg',
    };

    mockSearchMovies.mockResolvedValue([mockDto]);

    const { result } = renderHook(() => useMovieSearch('shawshank'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toEqual([
      {
        tconst: 'tt0111161',
        primaryTitle: 'The Shawshank Redemption',
        startYear: 1994,
        avgRating: '9.3',
        posterUrl: '/poster.jpg',
      },
    ]);
  });

  it('should limit results to 10 items', async () => {
    const mockDtos = Array.from({ length: 15 }, (_, i) => ({
      tconst: `tt${i}`,
      primary_title: `Movie ${i}`,
      start_year: 2000 + i,
      avg_rating: '8.0',
      poster_path: null,
    }));

    mockSearchMovies.mockResolvedValue(mockDtos);

    const { result } = renderHook(() => useMovieSearch('movie'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toHaveLength(10);
  });

  it('should not fetch when query length is less than 2', () => {
    mockSearchMovies.mockClear();

    const { result } = renderHook(() => useMovieSearch('a'), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(mockSearchMovies).not.toHaveBeenCalled();
  });
});
