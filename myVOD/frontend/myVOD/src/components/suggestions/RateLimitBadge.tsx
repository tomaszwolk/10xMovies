import { Badge } from "@/components/ui/badge";
import { useCountdownTo } from "@/hooks/useCountdownTo";

/**
 * Props for RateLimitBadge component.
 */
type RateLimitBadgeProps = {
  expiresAt?: string | null;
  isRateLimited: boolean;
};

/**
 * Badge displaying countdown to rate limit reset.
 * Shows remaining time until suggestions can be requested again.
 */
export function RateLimitBadge({ expiresAt, isRateLimited }: RateLimitBadgeProps) {
  const countdown = useCountdownTo(expiresAt);

  // Don't render if not rate limited or no expires_at
  if (!isRateLimited || !expiresAt) {
    return null;
  }

  // Calculate next reset time (midnight if no expires_at)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const targetDate = expiresAt ? new Date(expiresAt) : (() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next midnight
    return midnight;
  })();

  const displayTime = countdown || "00:00:00";

  return (
    <Badge variant="secondary" className="text-xs">
      Nowe sugestie za: {displayTime}
    </Badge>
  );
}
