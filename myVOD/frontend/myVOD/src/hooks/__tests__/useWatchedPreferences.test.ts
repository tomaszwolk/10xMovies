import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWatchedPreferences } from '../useWatchedPreferences';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useWatchedPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    window.sessionStorage.clear();
  });

  it('should initialize with default values when no stored preferences', () => {
    const { result } = renderHook(() => useWatchedPreferences());

    expect(result.current.viewMode).toBe('grid');
    expect(result.current.sort).toBe('added_desc');
    expect(result.current.hideUnavailable).toBe(false);
  });

  it('should load stored preferences from storage', () => {
    window.sessionStorage.setItem('mediaLibrary:viewMode', 'list');
    window.sessionStorage.setItem('watched:hideUnavailable', 'true');
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'watched:sort') return 'year_desc';
      return null;
    });

    const { result } = renderHook(() => useWatchedPreferences());

    expect(result.current.viewMode).toBe('list');
    expect(result.current.sort).toBe('year_desc');
    expect(result.current.hideUnavailable).toBe(true);
  });

  it('should normalize legacy sort keys stored in localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'watched:viewMode') return 'grid';
      if (key === 'watched:sort') return 'rating_desc';
      return null;
    });

    const { result } = renderHook(() => useWatchedPreferences());

    expect(result.current.sort).toBe('imdb_desc');
  });

  it('should save preferences to localStorage when changed', () => {
    const { result } = renderHook(() => useWatchedPreferences());

    act(() => {
      result.current.setViewMode('list');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('watched:viewMode', 'list');

    act(() => {
      result.current.setSort('imdb_desc');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('watched:sort', 'imdb_desc');

    act(() => {
      result.current.setHideUnavailable(true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('watched:hideUnavailable', 'true');
  });

  it('should update viewMode correctly', () => {
    const { result } = renderHook(() => useWatchedPreferences());

    expect(result.current.viewMode).toBe('grid');

    act(() => {
      result.current.setViewMode('list');
    });

    expect(result.current.viewMode).toBe('list');
  });

  it('should update sort correctly', () => {
    const { result } = renderHook(() => useWatchedPreferences());

    expect(result.current.sort).toBe('added_desc');

    act(() => {
      result.current.setSort('year_desc');
    });

    expect(result.current.sort).toBe('year_desc');
  });

  it('should update hideUnavailable correctly', () => {
    const { result } = renderHook(() => useWatchedPreferences());

    expect(result.current.hideUnavailable).toBe(false);

    act(() => {
      result.current.setHideUnavailable(true);
    });

    expect(result.current.hideUnavailable).toBe(true);
  });

  it('should persist preferences across re-renders', () => {
    const { result, rerender } = renderHook(() => useWatchedPreferences());

    act(() => {
      result.current.setViewMode('list');
      result.current.setSort('imdb_desc');
      result.current.setHideUnavailable(true);
    });

    rerender();

    expect(result.current.viewMode).toBe('list');
    expect(result.current.sort).toBe('imdb_desc');
    expect(result.current.hideUnavailable).toBe(true);
  });
});
