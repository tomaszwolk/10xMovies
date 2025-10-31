import type { ReactNode } from "react";

type MediaLibraryTabItem = {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
};

type MediaLibraryLayoutProps = {
  title: string;
  subtitle?: string;
  tabs?: MediaLibraryTabItem[];
  headerActions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

/**
 * Shared layout for media library views (watchlist / watched).
 * Encapsulates header, optional navigation tabs, toolbar slot and content container.
 */
export function MediaLibraryLayout({
  title,
  subtitle,
  tabs,
  headerActions,
  toolbar,
  children,
}: MediaLibraryLayoutProps) {
  const shouldRenderTabs = Array.isArray(tabs) && tabs.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-foreground mb-2">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-muted-foreground">{subtitle}</p>
            ) : null}
            {shouldRenderTabs ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {tabs.map((tab) => {
                  const isActive = tab.isActive;
                  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
                  const activeClasses = "bg-primary text-primary-foreground";
                  const inactiveClasses = "bg-muted hover:bg-muted/80 text-muted-foreground";

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={tab.onSelect}
                      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {headerActions ? (
            <div className="flex items-center gap-3 self-start md:self-auto">{headerActions}</div>
          ) : null}
        </header>

        {toolbar ? <div className="mb-6">{toolbar}</div> : null}

        <section className="bg-card rounded-lg shadow-lg overflow-hidden border">
          {children}
        </section>
      </div>
    </div>
  );
}


