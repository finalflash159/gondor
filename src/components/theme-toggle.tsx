'use client';

import { useTheme } from './theme-provider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-gold" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
