// =====================================================
// Theme Context
// =====================================================
//
// Re-exports theme context from core for consistent theming.
// Provides dark/light mode support with system preference detection.
//
// Available exports:
// - ThemeProvider - Wrap your app with this provider
// - useTheme() - Hook to access theme state and toggle
//
// Usage:
//   import { ThemeProvider, useTheme } from "@/lib/theme-context";
//
//   // In layout
//   <ThemeProvider>
//     <App />
//   </ThemeProvider>
//
//   // In component
//   const { theme, toggleTheme, setTheme } = useTheme();
//
// Theme values: "light" | "dark" | "system"
// =====================================================

export * from "@core/lib/theme-context";
