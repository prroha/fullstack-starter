// =====================================================
// App-Type Theme Definitions
// =====================================================
// Each theme represents a different app personality/type
// with carefully chosen colors for psychological impact.

export interface ThemeColors {
  // Core colors
  background: string;
  foreground: string;
  // Card colors
  card: string;
  cardForeground: string;
  // Popover colors
  popover: string;
  popoverForeground: string;
  // Primary brand color
  primary: string;
  primaryForeground: string;
  // Secondary color
  secondary: string;
  secondaryForeground: string;
  // Muted colors for subtle UI
  muted: string;
  mutedForeground: string;
  // Accent color for highlights
  accent: string;
  accentForeground: string;
  // Destructive actions
  destructive: string;
  // Border and input colors
  border: string;
  input: string;
  ring: string;
}

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  psychology: string;
  previewColors: {
    primary: string;
    accent: string;
    background: string;
  };
  light: ThemeColors;
  dark: ThemeColors;
}

// =====================================================
// Theme Definitions
// =====================================================

export const appThemes: AppTheme[] = [
  {
    id: "default",
    name: "Professional",
    description: "Clean and trustworthy",
    psychology: "Evokes trust, stability, and professionalism. Ideal for business and productivity apps.",
    previewColors: {
      primary: "#0891b2",
      accent: "#f59e0b",
      background: "#fafafa",
    },
    light: {
      background: "oklch(0.99 0.002 90)",
      foreground: "oklch(0.20 0.02 250)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.20 0.02 250)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.20 0.02 250)",
      primary: "oklch(0.55 0.15 195)",
      primaryForeground: "oklch(0.99 0 0)",
      secondary: "oklch(0.96 0.01 80)",
      secondaryForeground: "oklch(0.30 0.02 250)",
      muted: "oklch(0.96 0.008 80)",
      mutedForeground: "oklch(0.50 0.01 250)",
      accent: "oklch(0.75 0.15 65)",
      accentForeground: "oklch(0.20 0.02 65)",
      destructive: "oklch(0.55 0.22 25)",
      border: "oklch(0.90 0.01 80)",
      input: "oklch(0.90 0.01 80)",
      ring: "oklch(0.55 0.15 195)",
    },
    dark: {
      background: "oklch(0.16 0.02 250)",
      foreground: "oklch(0.95 0.01 80)",
      card: "oklch(0.20 0.02 250)",
      cardForeground: "oklch(0.95 0.01 80)",
      popover: "oklch(0.20 0.02 250)",
      popoverForeground: "oklch(0.95 0.01 80)",
      primary: "oklch(0.70 0.14 195)",
      primaryForeground: "oklch(0.15 0.02 250)",
      secondary: "oklch(0.25 0.02 250)",
      secondaryForeground: "oklch(0.90 0.01 80)",
      muted: "oklch(0.25 0.02 250)",
      mutedForeground: "oklch(0.65 0.01 80)",
      accent: "oklch(0.70 0.14 65)",
      accentForeground: "oklch(0.15 0.02 65)",
      destructive: "oklch(0.60 0.20 25)",
      border: "oklch(0.30 0.02 250)",
      input: "oklch(0.30 0.02 250)",
      ring: "oklch(0.70 0.14 195)",
    },
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold and expressive",
    psychology: "Inspires creativity, energy, and innovation. Perfect for design and artistic apps.",
    previewColors: {
      primary: "#8b5cf6",
      accent: "#f43f5e",
      background: "#fefce8",
    },
    light: {
      background: "oklch(0.99 0.01 95)",
      foreground: "oklch(0.20 0.03 300)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.20 0.03 300)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.20 0.03 300)",
      primary: "oklch(0.58 0.22 290)",
      primaryForeground: "oklch(0.99 0 0)",
      secondary: "oklch(0.96 0.02 320)",
      secondaryForeground: "oklch(0.30 0.03 300)",
      muted: "oklch(0.96 0.015 320)",
      mutedForeground: "oklch(0.50 0.02 300)",
      accent: "oklch(0.65 0.25 10)",
      accentForeground: "oklch(0.99 0 0)",
      destructive: "oklch(0.55 0.22 25)",
      border: "oklch(0.90 0.02 320)",
      input: "oklch(0.90 0.02 320)",
      ring: "oklch(0.58 0.22 290)",
    },
    dark: {
      background: "oklch(0.15 0.03 300)",
      foreground: "oklch(0.95 0.01 320)",
      card: "oklch(0.18 0.03 300)",
      cardForeground: "oklch(0.95 0.01 320)",
      popover: "oklch(0.18 0.03 300)",
      popoverForeground: "oklch(0.95 0.01 320)",
      primary: "oklch(0.72 0.20 290)",
      primaryForeground: "oklch(0.15 0.03 300)",
      secondary: "oklch(0.25 0.03 300)",
      secondaryForeground: "oklch(0.90 0.01 320)",
      muted: "oklch(0.25 0.03 300)",
      mutedForeground: "oklch(0.65 0.02 320)",
      accent: "oklch(0.70 0.22 10)",
      accentForeground: "oklch(0.15 0.02 10)",
      destructive: "oklch(0.60 0.20 25)",
      border: "oklch(0.30 0.03 300)",
      input: "oklch(0.30 0.03 300)",
      ring: "oklch(0.72 0.20 290)",
    },
  },
  {
    id: "nature",
    name: "Nature",
    description: "Calm and organic",
    psychology: "Creates feelings of calm, growth, and natural harmony. Great for wellness and eco-friendly apps.",
    previewColors: {
      primary: "#16a34a",
      accent: "#84cc16",
      background: "#f0fdf4",
    },
    light: {
      background: "oklch(0.99 0.01 145)",
      foreground: "oklch(0.20 0.03 145)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.20 0.03 145)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.20 0.03 145)",
      primary: "oklch(0.55 0.18 145)",
      primaryForeground: "oklch(0.99 0 0)",
      secondary: "oklch(0.96 0.02 145)",
      secondaryForeground: "oklch(0.30 0.03 145)",
      muted: "oklch(0.96 0.015 145)",
      mutedForeground: "oklch(0.50 0.02 145)",
      accent: "oklch(0.75 0.18 125)",
      accentForeground: "oklch(0.20 0.03 125)",
      destructive: "oklch(0.55 0.22 25)",
      border: "oklch(0.90 0.02 145)",
      input: "oklch(0.90 0.02 145)",
      ring: "oklch(0.55 0.18 145)",
    },
    dark: {
      background: "oklch(0.15 0.02 145)",
      foreground: "oklch(0.95 0.01 145)",
      card: "oklch(0.18 0.02 145)",
      cardForeground: "oklch(0.95 0.01 145)",
      popover: "oklch(0.18 0.02 145)",
      popoverForeground: "oklch(0.95 0.01 145)",
      primary: "oklch(0.65 0.16 145)",
      primaryForeground: "oklch(0.15 0.02 145)",
      secondary: "oklch(0.25 0.02 145)",
      secondaryForeground: "oklch(0.90 0.01 145)",
      muted: "oklch(0.25 0.02 145)",
      mutedForeground: "oklch(0.65 0.01 145)",
      accent: "oklch(0.70 0.16 125)",
      accentForeground: "oklch(0.15 0.02 125)",
      destructive: "oklch(0.60 0.20 25)",
      border: "oklch(0.30 0.02 145)",
      input: "oklch(0.30 0.02 145)",
      ring: "oklch(0.65 0.16 145)",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep and serene",
    psychology: "Conveys depth, tranquility, and reliability. Ideal for finance and communication apps.",
    previewColors: {
      primary: "#0ea5e9",
      accent: "#06b6d4",
      background: "#f0f9ff",
    },
    light: {
      background: "oklch(0.99 0.01 220)",
      foreground: "oklch(0.20 0.03 230)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.20 0.03 230)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.20 0.03 230)",
      primary: "oklch(0.60 0.18 230)",
      primaryForeground: "oklch(0.99 0 0)",
      secondary: "oklch(0.96 0.02 220)",
      secondaryForeground: "oklch(0.30 0.03 230)",
      muted: "oklch(0.96 0.015 220)",
      mutedForeground: "oklch(0.50 0.02 230)",
      accent: "oklch(0.70 0.15 195)",
      accentForeground: "oklch(0.20 0.03 195)",
      destructive: "oklch(0.55 0.22 25)",
      border: "oklch(0.90 0.02 220)",
      input: "oklch(0.90 0.02 220)",
      ring: "oklch(0.60 0.18 230)",
    },
    dark: {
      background: "oklch(0.14 0.03 230)",
      foreground: "oklch(0.95 0.01 220)",
      card: "oklch(0.17 0.03 230)",
      cardForeground: "oklch(0.95 0.01 220)",
      popover: "oklch(0.17 0.03 230)",
      popoverForeground: "oklch(0.95 0.01 220)",
      primary: "oklch(0.70 0.15 230)",
      primaryForeground: "oklch(0.14 0.03 230)",
      secondary: "oklch(0.24 0.03 230)",
      secondaryForeground: "oklch(0.90 0.01 220)",
      muted: "oklch(0.24 0.03 230)",
      mutedForeground: "oklch(0.65 0.02 220)",
      accent: "oklch(0.65 0.14 195)",
      accentForeground: "oklch(0.14 0.02 195)",
      destructive: "oklch(0.60 0.20 25)",
      border: "oklch(0.30 0.03 230)",
      input: "oklch(0.30 0.03 230)",
      ring: "oklch(0.70 0.15 230)",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm and inviting",
    psychology: "Evokes warmth, comfort, and energy. Perfect for social and entertainment apps.",
    previewColors: {
      primary: "#f97316",
      accent: "#eab308",
      background: "#fffbeb",
    },
    light: {
      background: "oklch(0.99 0.01 85)",
      foreground: "oklch(0.20 0.03 50)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.20 0.03 50)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.20 0.03 50)",
      primary: "oklch(0.70 0.18 45)",
      primaryForeground: "oklch(0.15 0.02 45)",
      secondary: "oklch(0.96 0.02 85)",
      secondaryForeground: "oklch(0.30 0.03 50)",
      muted: "oklch(0.96 0.015 85)",
      mutedForeground: "oklch(0.50 0.02 50)",
      accent: "oklch(0.80 0.16 95)",
      accentForeground: "oklch(0.20 0.03 95)",
      destructive: "oklch(0.55 0.22 25)",
      border: "oklch(0.90 0.02 85)",
      input: "oklch(0.90 0.02 85)",
      ring: "oklch(0.70 0.18 45)",
    },
    dark: {
      background: "oklch(0.15 0.02 50)",
      foreground: "oklch(0.95 0.01 85)",
      card: "oklch(0.18 0.02 50)",
      cardForeground: "oklch(0.95 0.01 85)",
      popover: "oklch(0.18 0.02 50)",
      popoverForeground: "oklch(0.95 0.01 85)",
      primary: "oklch(0.75 0.16 45)",
      primaryForeground: "oklch(0.15 0.02 45)",
      secondary: "oklch(0.25 0.02 50)",
      secondaryForeground: "oklch(0.90 0.01 85)",
      muted: "oklch(0.25 0.02 50)",
      mutedForeground: "oklch(0.65 0.01 85)",
      accent: "oklch(0.75 0.14 95)",
      accentForeground: "oklch(0.15 0.02 95)",
      destructive: "oklch(0.60 0.20 25)",
      border: "oklch(0.30 0.02 50)",
      input: "oklch(0.30 0.02 50)",
      ring: "oklch(0.75 0.16 45)",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and focused",
    psychology: "Emphasizes clarity, focus, and simplicity. Ideal for productivity and reading apps.",
    previewColors: {
      primary: "#525252",
      accent: "#a3a3a3",
      background: "#fafafa",
    },
    light: {
      background: "oklch(0.99 0 0)",
      foreground: "oklch(0.20 0 0)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.20 0 0)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.20 0 0)",
      primary: "oklch(0.40 0 0)",
      primaryForeground: "oklch(0.99 0 0)",
      secondary: "oklch(0.96 0 0)",
      secondaryForeground: "oklch(0.30 0 0)",
      muted: "oklch(0.96 0 0)",
      mutedForeground: "oklch(0.50 0 0)",
      accent: "oklch(0.70 0 0)",
      accentForeground: "oklch(0.20 0 0)",
      destructive: "oklch(0.55 0.22 25)",
      border: "oklch(0.90 0 0)",
      input: "oklch(0.90 0 0)",
      ring: "oklch(0.40 0 0)",
    },
    dark: {
      background: "oklch(0.15 0 0)",
      foreground: "oklch(0.95 0 0)",
      card: "oklch(0.18 0 0)",
      cardForeground: "oklch(0.95 0 0)",
      popover: "oklch(0.18 0 0)",
      popoverForeground: "oklch(0.95 0 0)",
      primary: "oklch(0.70 0 0)",
      primaryForeground: "oklch(0.15 0 0)",
      secondary: "oklch(0.25 0 0)",
      secondaryForeground: "oklch(0.90 0 0)",
      muted: "oklch(0.25 0 0)",
      mutedForeground: "oklch(0.65 0 0)",
      accent: "oklch(0.50 0 0)",
      accentForeground: "oklch(0.95 0 0)",
      destructive: "oklch(0.60 0.20 25)",
      border: "oklch(0.30 0 0)",
      input: "oklch(0.30 0 0)",
      ring: "oklch(0.70 0 0)",
    },
  },
  {
    id: "rose",
    name: "Rose",
    description: "Soft and elegant",
    psychology: "Conveys warmth, compassion, and sophistication. Great for lifestyle and beauty apps.",
    previewColors: {
      primary: "#e11d48",
      accent: "#f472b6",
      background: "#fff1f2",
    },
    light: {
      background: "oklch(0.99 0.01 350)",
      foreground: "oklch(0.20 0.03 350)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.20 0.03 350)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.20 0.03 350)",
      primary: "oklch(0.55 0.22 360)",
      primaryForeground: "oklch(0.99 0 0)",
      secondary: "oklch(0.96 0.02 350)",
      secondaryForeground: "oklch(0.30 0.03 350)",
      muted: "oklch(0.96 0.015 350)",
      mutedForeground: "oklch(0.50 0.02 350)",
      accent: "oklch(0.75 0.16 340)",
      accentForeground: "oklch(0.20 0.03 340)",
      destructive: "oklch(0.55 0.22 25)",
      border: "oklch(0.90 0.02 350)",
      input: "oklch(0.90 0.02 350)",
      ring: "oklch(0.55 0.22 360)",
    },
    dark: {
      background: "oklch(0.15 0.02 350)",
      foreground: "oklch(0.95 0.01 350)",
      card: "oklch(0.18 0.02 350)",
      cardForeground: "oklch(0.95 0.01 350)",
      popover: "oklch(0.18 0.02 350)",
      popoverForeground: "oklch(0.95 0.01 350)",
      primary: "oklch(0.65 0.20 360)",
      primaryForeground: "oklch(0.15 0.02 350)",
      secondary: "oklch(0.25 0.02 350)",
      secondaryForeground: "oklch(0.90 0.01 350)",
      muted: "oklch(0.25 0.02 350)",
      mutedForeground: "oklch(0.65 0.01 350)",
      accent: "oklch(0.70 0.14 340)",
      accentForeground: "oklch(0.15 0.02 340)",
      destructive: "oklch(0.60 0.20 25)",
      border: "oklch(0.30 0.02 350)",
      input: "oklch(0.30 0.02 350)",
      ring: "oklch(0.65 0.20 360)",
    },
  },
];

// =====================================================
// Helper Functions
// =====================================================

export function getThemeById(id: string): AppTheme | undefined {
  return appThemes.find((theme) => theme.id === id);
}

export function getDefaultTheme(): AppTheme {
  return appThemes[0];
}

export function getThemeColors(themeId: string, colorMode: "light" | "dark"): ThemeColors {
  const theme = getThemeById(themeId) || getDefaultTheme();
  return colorMode === "dark" ? theme.dark : theme.light;
}
