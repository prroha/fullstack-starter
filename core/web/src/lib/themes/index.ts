// =====================================================
// Theme Exports
// =====================================================
// This module provides app-type specific themes with
// comprehensive color psychology support.

// Types
export type {
  AppThemeType,
  ColorShades,
  SemanticColors,
  ThemeModeColors,
  TypographyRecommendation,
  AppThemeConfig,
} from "./app-themes";

// Individual themes
export {
  educationalTheme,
  financeTheme,
  ecommerceTheme,
  accountingTheme,
  notesTheme,
  healthTheme,
  socialTheme,
  creativeTheme,
} from "./app-themes";

// Theme registry
export { appThemes as appTypeThemes } from "./app-themes";

// Utility functions
export {
  getAppTheme,
  getThemeColors as getAppThemeColors,
  getAvailableThemeTypes,
  isValidThemeType,
  generateThemeCSSVariables,
  generateTailwindColors,
} from "./app-themes";

// =====================================================
// Legacy exports (for backward compatibility)
// =====================================================

export {
  appThemes,
  getThemeById,
  getDefaultTheme,
  getThemeColors,
} from "./theme-definitions";

export type { AppTheme, ThemeColors } from "./theme-definitions";
