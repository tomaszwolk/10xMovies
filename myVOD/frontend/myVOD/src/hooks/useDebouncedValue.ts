import { useState, useEffect } from "react";

/**
 * Custom hook that debounces a value.
 * Returns the debounced value after the specified delay.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 250ms)
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
