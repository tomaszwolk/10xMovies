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
  });

  it('should initialize with default values when no stored preferences', () => {
    const { result } = renderHook(() => useWatchedPreferences());

    expect(result.current.viewMode).toBe('grid');
    expect(result.current.sort).toBe('watched_at_desc');
  });

  it('should load stored preferences from localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'watched:viewMode') return 'list';
      if (key === 'watched:sort') return 'rating_desc';
      return null;
    });

    const { result } = renderHook(() => useWatchedPreferences());

    expect(result.current.viewMode).toBe('list');
    expect(result.current.sort).toBe('rating_desc');
  });

  it('should save preferences to localStorage when changed', () => {
    const { result } = renderHook(() => useWatchedPreferences());

    act(() => {
      result.current.setViewMode('list');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('watched:viewMode', 'list');

    act(() => {
      result.current.setSort('rating_desc');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('watched:sort', 'rating_desc');
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

    expect(result.current.sort).toBe('watched_at_desc');

    act(() => {
      result.current.setSort('rating_desc');
    });

    expect(result.current.sort).toBe('rating_desc');
  });

  it('should persist preferences across re-renders', () => {
    const { result, rerender } = renderHook(() => useWatchedPreferences());

    act(() => {
      result.current.setViewMode('list');
      result.current.setSort('rating_desc');
    });

    rerender();

    expect(result.current.viewMode).toBe('list');
    expect(result.current.sort).toBe('rating_desc');
  });
});
