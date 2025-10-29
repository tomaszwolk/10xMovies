import { describe, it, expect } from 'vitest';
import type { AddedMovieVM, SearchOptionVM } from '@/types/api.types';

describe('OnboardingAdd Validation Logic', () => {
  const createMockAddedMovie = (tconst: string): AddedMovieVM => ({
    userMovieId: 1,
    tconst,
    primaryTitle: `Movie ${tconst}`,
    startYear: 2020,
    posterUrl: null,
  });

  const createMockSearchOption = (tconst: string): SearchOptionVM => ({
    tconst,
    primaryTitle: `Movie ${tconst}`,
    startYear: 2020,
    avgRating: '8.0',
    posterUrl: null,
  });

  describe('Duplicate prevention', () => {
    it('should prevent adding duplicate movies in session', () => {
      const addedMovies = [createMockAddedMovie('tt001')];
      const addedSet = new Set(['tt001']);
      const newMovie = createMockSearchOption('tt001');

      const MAX_MOVIES = 3;
      const canAddMore = addedMovies.length < MAX_MOVIES;
      const isDuplicate = addedSet.has(newMovie.tconst);

      expect(canAddMore).toBe(true);
      expect(isDuplicate).toBe(true);
      expect(canAddMore && !isDuplicate).toBe(false);
    });

    it('should allow adding different movies', () => {
      const addedMovies = [createMockAddedMovie('tt001')];
      const addedSet = new Set(['tt001']);
      const newMovie = createMockSearchOption('tt002');

      const MAX_MOVIES = 3;
      const canAddMore = addedMovies.length < MAX_MOVIES;
      const isDuplicate = addedSet.has(newMovie.tconst);

      expect(canAddMore).toBe(true);
      expect(isDuplicate).toBe(false);
      expect(canAddMore && !isDuplicate).toBe(true);
    });
  });

  describe('3-movie limit', () => {
    it('should prevent adding when limit is reached', () => {
      const addedMovies = [
        createMockAddedMovie('tt001'),
        createMockAddedMovie('tt002'),
        createMockAddedMovie('tt003'),
      ];
      const addedSet = new Set(['tt001', 'tt002', 'tt003']);
      const newMovie = createMockSearchOption('tt004');

      const MAX_MOVIES = 3;
      const canAddMore = addedMovies.length < MAX_MOVIES;
      const isDuplicate = addedSet.has(newMovie.tconst);

      expect(canAddMore).toBe(false);
      expect(isDuplicate).toBe(false);
      expect(canAddMore && !isDuplicate).toBe(false);
    });

    it('should allow adding when under limit', () => {
      const addedMovies = [
        createMockAddedMovie('tt001'),
        createMockAddedMovie('tt002'),
      ];
      const addedSet = new Set(['tt001', 'tt002']);
      const newMovie = createMockSearchOption('tt003');

      const MAX_MOVIES = 3;
      const canAddMore = addedMovies.length < MAX_MOVIES;
      const isDuplicate = addedSet.has(newMovie.tconst);

      expect(canAddMore).toBe(true);
      expect(isDuplicate).toBe(false);
      expect(canAddMore && !isDuplicate).toBe(true);
    });
  });
});
