/**
 * Progress bar component showing current step in onboarding flow.
 */
export function ProgressBar({
  current,
  total
}: {
  current: number;
  total: number;
}) {
  const progress = (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Step {current} of {total}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
