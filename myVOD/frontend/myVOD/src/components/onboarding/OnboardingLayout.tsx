import type { ReactNode } from "react";

/**
 * Common layout component for onboarding steps.
 * Provides consistent spacing, max-width, and structure.
 */
export function OnboardingLayout({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <header className="space-y-8">
          {/* Header section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground text-lg">{subtitle}</p>
            )}
          </div>
        </header>

        {/* Main content section */}
        <main className="space-y-6" role="main" aria-label="Onboarding content">
          {children}
        </main>
      </div>
    </div>
  );
}
