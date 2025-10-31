import { RateLimitBadge } from "./RateLimitBadge";

/**
 * Props for AISuggestionsHeader component.
 */
type AISuggestionsHeaderProps = {
  expiresAt?: string | null;
  isRateLimited: boolean;
};

/**
 * Header component for AI suggestions with title and rate limit badge.
 */
export function AISuggestionsHeader({ expiresAt, isRateLimited }: AISuggestionsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sugestie filmów od AI</h2>
        <p className="text-muted-foreground">
          Spersonalizowane rekomendacje na podstawie Twojej listy filmów
        </p>
      </div>

      <RateLimitBadge expiresAt={expiresAt} isRateLimited={isRateLimited} />
    </div>
  );
}
