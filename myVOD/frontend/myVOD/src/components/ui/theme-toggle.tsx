import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * ThemeToggle component for switching between light and dark modes.
 * Displays a sun icon for light mode and moon icon for dark mode.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--foreground)' }}>
        {theme === 'light' ? 'Jasny' : 'Ciemny'}
      </span>
      <button
        onClick={toggleTheme}
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
          outline: 'none',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '8px',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent-foreground)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--background)';
          e.currentTarget.style.color = 'var(--foreground)';
        }}
        aria-label={`Przełącz na ${theme === 'light' ? 'tryb ciemny' : 'tryb jasny'}`}
      >
        {theme === 'light' ? (
          <Moon style={{ width: '16px', height: '16px' }} />
        ) : (
          <Sun style={{ width: '16px', height: '16px' }} />
        )}
        <span style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0' }}>
          Przełącz na {theme === 'light' ? 'tryb ciemny' : 'tryb jasny'}
        </span>
      </button>
    </div>
  );
}
