import { useState, useEffect } from "react";

/**
 * Custom hook for countdown timer to a specific date.
 * Updates every second and returns formatted time string.
 *
 * @param targetDate - Target date to count down to
 * @returns Formatted countdown string (hh:mm:ss) or null if target date is in the past
 */
export function useCountdownTo(targetDate: Date | string | null): string | null {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setCountdown(null);
      return;
    }

    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

    const updateCountdown = () => {
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown(null);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setCountdown(formatted);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup on unmount or targetDate change
    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}
