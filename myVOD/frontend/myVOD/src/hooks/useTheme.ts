import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  // Sprawdź początkowy motyw z DOM (który został ustawiony przez initializeTheme w main.tsx)
  // lub z localStorage lub preferencji systemowych
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'dark';

    // Sprawdź aktualny stan DOM (czy klasa dark jest na <html>)
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      return 'dark';
    }

    // Sprawdź localStorage
    const stored = localStorage.getItem('theme') as Theme;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }

    // Domyślnie dark mode
    return 'dark';
  };

  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  // Zastosuj motyw do DOM i synchronizuj z localStorage
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Zapisz do localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Nasłuchuj zmian w localStorage (na wypadek gdyby inna zakładka zmieniła motyw)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as Theme;
        if (newTheme === 'dark' || newTheme === 'light') {
          setTheme(newTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Funkcja do przełączania motywu
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}
