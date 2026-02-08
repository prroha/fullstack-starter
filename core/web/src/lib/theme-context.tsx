"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// =====================================================
// Theme Types
// =====================================================

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "theme-preference";

// =====================================================
// Theme Context
// =====================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =====================================================
// Helper Functions
// =====================================================

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return null;
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
}

// =====================================================
// Theme Provider Component
// =====================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Resolve the theme based on current setting
  const resolveTheme = useCallback((themeValue: Theme): ResolvedTheme => {
    if (themeValue === "system") {
      return getSystemTheme();
    }
    return themeValue;
  }, []);

  // Initialize theme from storage or system preference
  useEffect(() => {
    const storedTheme = getStoredTheme();
    const initialTheme = storedTheme || defaultTheme;
    const resolved = resolveTheme(initialTheme);

    setThemeState(initialTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, [defaultTheme, resolveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const newResolved = getSystemTheme();
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Set theme function
  const setTheme = useCallback((newTheme: Theme) => {
    const resolved = resolveTheme(newTheme);

    setThemeState(newTheme);
    setResolvedTheme(resolved);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(resolved);
  }, [resolveTheme]);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = resolvedTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Prevent flash of incorrect theme
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: defaultTheme,
          resolvedTheme: "light",
          setTheme: () => {},
          toggleTheme: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// =====================================================
// useTheme Hook
// =====================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// =====================================================
// Theme Script Component (for SSR - prevents flash)
// =====================================================

export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('${STORAGE_KEY}');
        var theme = stored || 'system';
        var resolved = theme;

        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
