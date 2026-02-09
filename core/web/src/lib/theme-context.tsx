"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  appTypeThemes as _appTypeThemes,
  getAppTheme,
  getAppThemeColors,
  getAvailableThemeTypes,
  isValidThemeType,
  generateThemeCSSVariables,
  type AppThemeType,
  type AppThemeConfig,
  type ThemeModeColors,
} from "./themes";

// =====================================================
// Theme Types
// =====================================================

export type ColorMode = "light" | "dark" | "system";
export type ResolvedColorMode = "light" | "dark";

export interface ThemeContextType {
  // Color mode (light/dark/system)
  colorMode: ColorMode;
  resolvedColorMode: ResolvedColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;

  // App-type theme
  currentTheme: AppThemeType;
  currentThemeConfig: AppThemeConfig;
  setTheme: (themeId: AppThemeType) => void;
  availableThemes: { id: AppThemeType; name: string; description: string; psychology: string }[];

  // Derived theme colors
  themeColors: ThemeModeColors;

  // Legacy compatibility
  theme: ColorMode;
  resolvedTheme: ResolvedColorMode;
  toggleTheme: () => void;
}

const COLOR_MODE_STORAGE_KEY = "color-mode-preference";
const APP_THEME_STORAGE_KEY = "app-theme-preference";
const DEFAULT_THEME: AppThemeType = "edu";

// =====================================================
// Theme Context
// =====================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =====================================================
// Helper Functions
// =====================================================

function getSystemColorMode(): ResolvedColorMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredColorMode(): ColorMode | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return null;
}

function getStoredAppTheme(): AppThemeType | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(APP_THEME_STORAGE_KEY);
  if (stored && isValidThemeType(stored)) {
    return stored;
  }
  return null;
}

/**
 * Enable smooth transitions temporarily during theme changes.
 * This prevents "flash" effects on hover states by only applying
 * transitions when actively switching themes.
 */
function enableThemeTransition() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.add("theme-transitioning");

  // Remove the class after the transition completes
  setTimeout(() => {
    root.classList.remove("theme-transitioning");
  }, 250); // Slightly longer than the 200ms transition to ensure completion
}

function applyColorMode(resolvedMode: ResolvedColorMode, withTransition = false) {
  if (typeof document === "undefined") return;

  if (withTransition) {
    enableThemeTransition();
  }

  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedMode);
}

function applyThemeColors(themeId: AppThemeType, mode: ResolvedColorMode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const cssVariables = generateThemeCSSVariables(themeId, mode);

  // Apply all CSS custom properties
  Object.entries(cssVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Also apply the theme colors to match the existing CSS variable names
  const colors = getAppThemeColors(themeId, mode);

  // Map to shadcn-style variables for backward compatibility
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--foreground", colors.textPrimary);
  root.style.setProperty("--card", colors.surface);
  root.style.setProperty("--card-foreground", colors.textPrimary);
  root.style.setProperty("--popover", colors.surface);
  root.style.setProperty("--popover-foreground", colors.textPrimary);
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", colors.textInverse);
  root.style.setProperty("--secondary", colors.backgroundSecondary);
  root.style.setProperty("--secondary-foreground", colors.textSecondary);
  root.style.setProperty("--muted", colors.backgroundTertiary);
  root.style.setProperty("--muted-foreground", colors.textMuted);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", colors.textPrimary);
  root.style.setProperty("--destructive", colors.semantic.error);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--input", colors.border);
  root.style.setProperty("--ring", colors.borderFocus);

  // Set theme data attribute for potential CSS selectors
  root.dataset.theme = themeId;
}

// =====================================================
// Theme Provider Component
// =====================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultColorMode?: ColorMode;
  defaultTheme?: AppThemeType;
}

export function ThemeProvider({
  children,
  defaultColorMode = "system",
  defaultTheme = DEFAULT_THEME,
}: ThemeProviderProps) {
  const [colorMode, setColorModeState] = useState<ColorMode>(defaultColorMode);
  const [resolvedColorMode, setResolvedColorMode] = useState<ResolvedColorMode>("light");
  const [currentTheme, setCurrentThemeState] = useState<AppThemeType>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Get current theme configuration
  const currentThemeConfig = useMemo(
    () => getAppTheme(currentTheme),
    [currentTheme]
  );

  // Get current theme colors based on resolved color mode
  const themeColors = useMemo(
    () => getAppThemeColors(currentTheme, resolvedColorMode),
    [currentTheme, resolvedColorMode]
  );

  // Get available themes list
  const availableThemes = useMemo(() => {
    const themeTypes = getAvailableThemeTypes();
    return themeTypes.map((id) => {
      const config = getAppTheme(id);
      return {
        id,
        name: config.name,
        description: config.description,
        psychology: config.psychology,
      };
    });
  }, []);

  // Resolve the color mode based on current setting
  const resolveColorMode = useCallback((mode: ColorMode): ResolvedColorMode => {
    if (mode === "system") {
      return getSystemColorMode();
    }
    return mode;
  }, []);

  // Initialize from storage
  useEffect(() => {
    const storedColorMode = getStoredColorMode();
    const storedTheme = getStoredAppTheme();

    const initialColorMode = storedColorMode || defaultColorMode;
    const initialTheme = storedTheme || defaultTheme;
    const resolved = resolveColorMode(initialColorMode);

    setColorModeState(initialColorMode);
    setResolvedColorMode(resolved);
    setCurrentThemeState(initialTheme);
    applyColorMode(resolved);
    applyThemeColors(initialTheme, resolved);
    setMounted(true);
  }, [defaultColorMode, defaultTheme, resolveColorMode]);

  // Listen for system color mode changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (colorMode === "system") {
        const newResolved = getSystemColorMode();
        setResolvedColorMode(newResolved);
        applyColorMode(newResolved, true); // Enable transition for system theme change
        applyThemeColors(currentTheme, newResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [colorMode, currentTheme]);

  // Apply theme colors when theme or color mode changes
  useEffect(() => {
    if (!mounted) return;

    applyThemeColors(currentTheme, resolvedColorMode);
  }, [currentTheme, resolvedColorMode, mounted]);

  // Set color mode function
  const setColorMode = useCallback((newMode: ColorMode) => {
    const resolved = resolveColorMode(newMode);

    setColorModeState(newMode);
    setResolvedColorMode(resolved);
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, newMode);
    applyColorMode(resolved, true); // Enable transition for user-initiated theme change
    applyThemeColors(currentTheme, resolved);
  }, [resolveColorMode, currentTheme]);

  // Toggle between light and dark (skips system)
  const toggleColorMode = useCallback(() => {
    const newMode: ColorMode = resolvedColorMode === "light" ? "dark" : "light";
    setColorMode(newMode);
  }, [resolvedColorMode, setColorMode]);

  // Set app theme function
  const setTheme = useCallback((themeId: AppThemeType) => {
    if (!isValidThemeType(themeId)) return;

    enableThemeTransition(); // Enable transition for user-initiated theme change
    setCurrentThemeState(themeId);
    localStorage.setItem(APP_THEME_STORAGE_KEY, themeId);
    applyThemeColors(themeId, resolvedColorMode);
  }, [resolvedColorMode]);

  // Create context value with memoization
  const contextValue = useMemo<ThemeContextType>(() => ({
    // Color mode
    colorMode,
    resolvedColorMode,
    setColorMode,
    toggleColorMode,
    // App theme
    currentTheme,
    currentThemeConfig,
    setTheme,
    availableThemes,
    // Derived
    themeColors,
    // Legacy compatibility (maps to color mode)
    theme: colorMode,
    resolvedTheme: resolvedColorMode,
    toggleTheme: toggleColorMode,
  }), [
    colorMode,
    resolvedColorMode,
    setColorMode,
    toggleColorMode,
    currentTheme,
    currentThemeConfig,
    setTheme,
    availableThemes,
    themeColors,
  ]);

  // Prevent flash of incorrect theme
  if (!mounted) {
    const defaultConfig = getAppTheme(defaultTheme);
    const defaultColors = getAppThemeColors(defaultTheme, "light");
    const defaultAvailable = getAvailableThemeTypes().map((id) => {
      const config = getAppTheme(id);
      return {
        id,
        name: config.name,
        description: config.description,
        psychology: config.psychology,
      };
    });

    return (
      <ThemeContext.Provider
        value={{
          colorMode: defaultColorMode,
          resolvedColorMode: "light",
          setColorMode: () => {},
          toggleColorMode: () => {},
          currentTheme: defaultTheme,
          currentThemeConfig: defaultConfig,
          setTheme: () => {},
          availableThemes: defaultAvailable,
          themeColors: defaultColors,
          theme: defaultColorMode,
          resolvedTheme: "light",
          toggleTheme: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
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
        var colorModeKey = '${COLOR_MODE_STORAGE_KEY}';
        var themeKey = '${APP_THEME_STORAGE_KEY}';

        var storedMode = localStorage.getItem(colorModeKey);
        var colorMode = storedMode || 'system';
        var resolvedMode = colorMode;

        if (colorMode === 'system') {
          resolvedMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolvedMode);

        // Store the theme for later CSS variable application
        var storedTheme = localStorage.getItem(themeKey);
        if (storedTheme) {
          document.documentElement.dataset.theme = storedTheme;
        }
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
