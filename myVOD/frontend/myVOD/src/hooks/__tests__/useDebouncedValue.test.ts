import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 100));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );

    // Initial value should be returned immediately
    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'changed', delay: 100 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 50ms (less than delay)
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Value should still be old
    expect(result.current).toBe('initial');

    // Fast-forward remaining time
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Now value should be updated
    expect(result.current).toBe('changed');
  });

  it('should use default delay of 250ms', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    // After 249ms, value should still be old
    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(result.current).toBe('initial');

    // After 250ms, value should be updated
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('changed');
  });

  it('should use custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'changed', delay: 500 });

    // After 499ms, value should still be old
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // After 500ms, value should be updated
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('changed');
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { result, unmount, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    // Unmount should clear the timeout
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle rapid value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: 'initial' } }
    );

    // Change value multiple times rapidly
    rerender({ value: 'first' });
    act(() => vi.advanceTimersByTime(50));

    rerender({ value: 'second' });
    act(() => vi.advanceTimersByTime(50));

    rerender({ value: 'third' });
    act(() => vi.advanceTimersByTime(50));

    // Value should still be initial (debounced)
    expect(result.current).toBe('initial');

    // After full delay, should have the last value
    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe('third');
  });

  it('should reset debounce when value changes again', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: 'initial' } }
    );

    // Change value
    rerender({ value: 'changed' });

    // Wait 50ms
    act(() => vi.advanceTimersByTime(50));

    // Change value again - should reset the timer
    rerender({ value: 'final' });

    // Wait another 50ms (total 100ms from first change, but timer was reset)
    act(() => vi.advanceTimersByTime(50));

    // Should still be initial (50ms from reset)
    expect(result.current).toBe('initial');

    // Wait final 50ms
    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe('final');
  });

  it('should handle delay changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 200 } }
    );

    rerender({ value: 'changed', delay: 200 });

    // After 199ms, should still be initial
    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe('initial');

    // After 200ms, should be updated
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('changed');
  });

  it('should work with different data types', async () => {
    // Test with number
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value }) => useDebouncedValue(value, 50),
      { initialProps: { value: 42 } }
    );

    rerenderNumber({ value: 100 });
    act(() => vi.advanceTimersByTime(50));
    expect(numberResult.current).toBe(100);

    // Test with object
    const { result: objectResult, rerender: rerenderObject } = renderHook(
      ({ value }) => useDebouncedValue(value, 50),
      { initialProps: { value: { name: 'test' } } }
    );

    const newObj = { name: 'updated' };
    rerenderObject({ value: newObj });
    act(() => vi.advanceTimersByTime(50));
    expect(objectResult.current).toEqual(newObj);
  });

  it('should handle delay of 0 (minimal debounce)', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 0),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    // Even with delay 0, setTimeout makes it async
    // Advance timers to next tick
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe('changed');
  });
});
