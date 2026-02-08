// =====================================================
// useTheme Hook
// =====================================================
// A convenient hook for accessing theme context with
// additional utility functions.

import { useCallback, useMemo } from "react";
import { useTheme as useThemeContext } from "../theme-context";
import {
  getAppTheme,
  type AppThemeType,
  type AppThemeConfig,
  type ThemeModeColors,
} from "../themes";

// =====================================================
// Types
// =====================================================

export type ColorMode = "light" | "dark" | "system";
export type ResolvedColorMode = "light" | "dark";

export interface ThemeInfo {
  id: AppThemeType;
  name: string;
  description: string;
  psychology: string;
}

export interface UseThemeReturn {
  // App-type theme
  currentTheme: AppThemeType;
  currentThemeConfig: AppThemeConfig;
  setTheme: (themeId: AppThemeType) => void;
  availableThemes: ThemeInfo[];

  // Color mode (light/dark/system)
  colorMode: ColorMode;
  resolvedColorMode: ResolvedColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;

  // Theme colors
  themeColors: ThemeModeColors;

  // Utility functions
  isLight: boolean;
  isDark: boolean;
  isSystem: boolean;

  // Theme utilities
  getThemeById: (id: AppThemeType) => AppThemeConfig;
  getThemePreviewColors: (themeId: AppThemeType) => {
    primary: string;
    accent: string;
    background: string;
  };
}

// =====================================================
// Hook Implementation
// =====================================================

export function useTheme(): UseThemeReturn {
  const context = useThemeContext();

  const {
    currentTheme,
    currentThemeConfig,
    setTheme,
    availableThemes,
    colorMode,
    resolvedColorMode,
    setColorMode,
    toggleColorMode,
    themeColors,
  } = context;

  // Utility booleans
  const isLight = resolvedColorMode === "light";
  const isDark = resolvedColorMode === "dark";
  const isSystem = colorMode === "system";

  // Get theme by ID
  const getThemeById = useCallback(
    (id: AppThemeType): AppThemeConfig => {
      return getAppTheme(id);
    },
    []
  );

  // Get theme preview colors
  const getThemePreviewColors = useCallback(
    (themeId: AppThemeType) => {
      const theme = getAppTheme(themeId);
      const colors = theme.light;
      return {
        primary: colors.primary,
        accent: colors.accent,
        background: colors.background,
      };
    },
    []
  );

  return useMemo(
    () => ({
      // App-type theme
      currentTheme,
      currentThemeConfig,
      setTheme,
      availableThemes,

      // Color mode
      colorMode,
      resolvedColorMode,
      setColorMode,
      toggleColorMode,

      // Theme colors
      themeColors,

      // Utilities
      isLight,
      isDark,
      isSystem,
      getThemeById,
      getThemePreviewColors,
    }),
    [
      currentTheme,
      currentThemeConfig,
      setTheme,
      availableThemes,
      colorMode,
      resolvedColorMode,
      setColorMode,
      toggleColorMode,
      themeColors,
      isLight,
      isDark,
      isSystem,
      getThemeById,
      getThemePreviewColors,
    ]
  );
}
