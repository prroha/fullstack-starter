"use client";

// =====================================================
// Theme Provider Wrapper Component
// =====================================================
// This component wraps the core ThemeProvider from lib/theme-context
// and provides additional features like theme persistence and SSR support.

import * as React from "react";
import {
  ThemeProvider as CoreThemeProvider,
  ThemeScript,
  type ColorMode,
} from "@/lib/theme-context";
import { type AppThemeType } from "@/lib/themes";

// =====================================================
// Types
// =====================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * Default color mode (light/dark/system)
   * @default "system"
   */
  defaultColorMode?: ColorMode;
  /**
   * Default app theme
   * @default "edu"
   */
  defaultTheme?: AppThemeType;
  /**
   * Whether to enable smooth color transitions
   * @default true
   */
  enableTransitions?: boolean;
  /**
   * Storage key prefix for localStorage
   * Useful when multiple apps share the same domain
   */
  storageKeyPrefix?: string;
  /**
   * Whether to sync theme across browser tabs
   * @default true
   */
  syncAcrossTabs?: boolean;
}

// =====================================================
// Theme Provider Component
// =====================================================

export function ThemeProvider({
  children,
  defaultColorMode = "system",
  defaultTheme = "edu",
  enableTransitions = true,
  syncAcrossTabs = true,
}: ThemeProviderProps) {
  // Enable smooth transitions after mount
  React.useEffect(() => {
    if (!enableTransitions) return;

    // Add transition styles after initial render to prevent flash
    const timeout = setTimeout(() => {
      document.documentElement.style.setProperty(
        "--theme-transition-duration",
        "0.2s"
      );
      document.documentElement.classList.add("theme-transitions-enabled");
    }, 100);

    return () => clearTimeout(timeout);
  }, [enableTransitions]);

  // Sync theme across tabs
  React.useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (event: StorageEvent) => {
      // The core theme context handles the actual theme application
      // This just triggers a re-render if needed
      if (
        event.key === "color-mode-preference" ||
        event.key === "app-theme-preference"
      ) {
        // Force re-render by dispatching a custom event
        window.dispatchEvent(new Event("theme-sync"));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncAcrossTabs]);

  return (
    <CoreThemeProvider
      defaultColorMode={defaultColorMode}
      defaultTheme={defaultTheme}
    >
      {children}
    </CoreThemeProvider>
  );
}

// =====================================================
// Re-exports for convenience
// =====================================================

export { ThemeScript };
export type { ThemeProviderProps };

// Re-export types from theme-context
export type { ColorMode } from "@/lib/theme-context";
export type { AppThemeType } from "@/lib/themes";
