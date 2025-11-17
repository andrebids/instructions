import { useEffect } from 'react';
import { useTheme } from '@heroui/use-theme';

/**
 * ThemeProvider Component
 * Applies the dark class to the HTML element based on the current theme
 */
export function ThemeProvider({ children }) {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
    
    // Force a reflow to ensure classes are applied immediately
    void root.offsetHeight;
    
    // Dispatch a custom event to notify components of theme change
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }, [theme]);

  return children;
}


