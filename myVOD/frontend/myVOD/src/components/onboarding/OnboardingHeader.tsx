/**
 * Header component for onboarding steps with title and hint.
 */
export function OnboardingHeader({
  title,
  hint
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {hint && (
        <p className="text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
