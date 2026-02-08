/**
 * App-Type Specific Theme Configurations
 *
 * Color palettes based on color psychology research to optimize
 * user experience for different application types.
 */

// =====================================================
// Type Definitions
// =====================================================

export type AppThemeType =
  | "edu"
  | "finance"
  | "ecommerce"
  | "accounting"
  | "notes"
  | "health"
  | "social"
  | "creative";

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SemanticColors {
  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
}

export interface ThemeModeColors {
  // Core palette
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Surface colors (cards, modals, etc.)
  surface: string;
  surfaceHover: string;
  surfaceActive: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Border colors
  border: string;
  borderLight: string;
  borderFocus: string;

  // Semantic colors
  semantic: SemanticColors;
}

export interface TypographyRecommendation {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface AppThemeConfig {
  id: AppThemeType;
  name: string;
  description: string;
  psychology: string;
  light: ThemeModeColors;
  dark: ThemeModeColors;
  primaryShades: ColorShades;
  accentShades: ColorShades;
  typography: TypographyRecommendation;
}

// =====================================================
// Shared Semantic Colors
// =====================================================

const semanticColorsLight: SemanticColors = {
  success: "#16a34a",
  successLight: "#dcfce7",
  successDark: "#15803d",
  warning: "#d97706",
  warningLight: "#fef3c7",
  warningDark: "#b45309",
  error: "#dc2626",
  errorLight: "#fee2e2",
  errorDark: "#b91c1c",
  info: "#0284c7",
  infoLight: "#e0f2fe",
  infoDark: "#0369a1",
};

const semanticColorsDark: SemanticColors = {
  success: "#22c55e",
  successLight: "#166534",
  successDark: "#4ade80",
  warning: "#f59e0b",
  warningLight: "#78350f",
  warningDark: "#fbbf24",
  error: "#ef4444",
  errorLight: "#7f1d1d",
  errorDark: "#f87171",
  info: "#38bdf8",
  infoLight: "#0c4a6e",
  infoDark: "#7dd3fc",
};

// =====================================================
// Educational Theme (edu)
// =====================================================

export const educationalTheme: AppThemeConfig = {
  id: "edu",
  name: "Educational",
  description: "Optimized for learning platforms and educational content",
  psychology: "Enhances focus and information retention through calming blues and attention-grabbing amber accents",

  light: {
    primary: "#1e40af",
    primaryLight: "#3b82f6",
    primaryDark: "#1e3a8a",
    accent: "#f59e0b",
    accentLight: "#fbbf24",
    accentDark: "#d97706",

    background: "#f8fafc",
    backgroundSecondary: "#f1f5f9",
    backgroundTertiary: "#e2e8f0",

    surface: "#ffffff",
    surfaceHover: "#f8fafc",
    surfaceActive: "#f1f5f9",

    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    textInverse: "#ffffff",

    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    borderFocus: "#1e40af",

    semantic: semanticColorsLight,
  },

  dark: {
    primary: "#3b82f6",
    primaryLight: "#60a5fa",
    primaryDark: "#2563eb",
    accent: "#fbbf24",
    accentLight: "#fcd34d",
    accentDark: "#f59e0b",

    background: "#0f172a",
    backgroundSecondary: "#1e293b",
    backgroundTertiary: "#334155",

    surface: "#1e293b",
    surfaceHover: "#334155",
    surfaceActive: "#475569",

    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
    textInverse: "#0f172a",

    border: "#334155",
    borderLight: "#1e293b",
    borderFocus: "#3b82f6",

    semantic: semanticColorsDark,
  },

  primaryShades: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  accentShades: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },

  typography: {
    fontFamily: {
      heading: "'Inter', 'Segoe UI', sans-serif",
      body: "'Inter', 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
};

// =====================================================
// Finance Theme (finance)
// =====================================================

export const financeTheme: AppThemeConfig = {
  id: "finance",
  name: "Finance",
  description: "Designed for banking, investment, and financial applications",
  psychology: "Instills confidence and security through navy blues and growth-oriented greens",

  light: {
    primary: "#1e3a5f",
    primaryLight: "#2d5a8a",
    primaryDark: "#152a45",
    accent: "#059669",
    accentLight: "#10b981",
    accentDark: "#047857",

    background: "#f8fafc",
    backgroundSecondary: "#f1f5f9",
    backgroundTertiary: "#e2e8f0",

    surface: "#ffffff",
    surfaceHover: "#f8fafc",
    surfaceActive: "#f1f5f9",

    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    textInverse: "#ffffff",

    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    borderFocus: "#1e3a5f",

    semantic: semanticColorsLight,
  },

  dark: {
    primary: "#3b82f6",
    primaryLight: "#60a5fa",
    primaryDark: "#2563eb",
    accent: "#10b981",
    accentLight: "#34d399",
    accentDark: "#059669",

    background: "#0c1222",
    backgroundSecondary: "#162032",
    backgroundTertiary: "#1e3048",

    surface: "#162032",
    surfaceHover: "#1e3048",
    surfaceActive: "#2a4060",

    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
    textInverse: "#0f172a",

    border: "#1e3048",
    borderLight: "#162032",
    borderFocus: "#3b82f6",

    semantic: semanticColorsDark,
  },

  primaryShades: {
    50: "#f0f5fa",
    100: "#e0ebf5",
    200: "#c2d7eb",
    300: "#94b8d9",
    400: "#6090c0",
    500: "#3d6a9e",
    600: "#2d5a8a",
    700: "#1e3a5f",
    800: "#152a45",
    900: "#0f1f33",
    950: "#081220",
  },

  accentShades: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22",
  },

  typography: {
    fontFamily: {
      heading: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      body: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      mono: "'IBM Plex Mono', 'Consolas', monospace",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.02em",
    },
    lineHeight: {
      tight: 1.3,
      normal: 1.5,
      relaxed: 1.7,
    },
  },
};

// =====================================================
// E-commerce Theme (ecommerce)
// =====================================================

export const ecommerceTheme: AppThemeConfig = {
  id: "ecommerce",
  name: "E-commerce",
  description: "Optimized for online shopping and marketplace platforms",
  psychology: "Encourages action through warm orange while maintaining trust with reliable blue accents",

  light: {
    primary: "#ea580c",
    primaryLight: "#f97316",
    primaryDark: "#c2410c",
    accent: "#3b82f6",
    accentLight: "#60a5fa",
    accentDark: "#2563eb",

    background: "#fafaf9",
    backgroundSecondary: "#f5f5f4",
    backgroundTertiary: "#e7e5e4",

    surface: "#ffffff",
    surfaceHover: "#fafaf9",
    surfaceActive: "#f5f5f4",

    textPrimary: "#1c1917",
    textSecondary: "#57534e",
    textMuted: "#a8a29e",
    textInverse: "#ffffff",

    border: "#e7e5e4",
    borderLight: "#f5f5f4",
    borderFocus: "#ea580c",

    semantic: semanticColorsLight,
  },

  dark: {
    primary: "#f97316",
    primaryLight: "#fb923c",
    primaryDark: "#ea580c",
    accent: "#60a5fa",
    accentLight: "#93c5fd",
    accentDark: "#3b82f6",

    background: "#1c1917",
    backgroundSecondary: "#292524",
    backgroundTertiary: "#44403c",

    surface: "#292524",
    surfaceHover: "#44403c",
    surfaceActive: "#57534e",

    textPrimary: "#fafaf9",
    textSecondary: "#d6d3d1",
    textMuted: "#78716c",
    textInverse: "#1c1917",

    border: "#44403c",
    borderLight: "#292524",
    borderFocus: "#f97316",

    semantic: semanticColorsDark,
  },

  primaryShades: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },

  accentShades: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  typography: {
    fontFamily: {
      heading: "'Poppins', 'Segoe UI', sans-serif",
      body: "'Open Sans', 'Segoe UI', sans-serif",
      mono: "'Roboto Mono', 'Consolas', monospace",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.01em",
      normal: "0",
      wide: "0.03em",
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
};

// =====================================================
// Accounting Theme (accounting)
// =====================================================

export const accountingTheme: AppThemeConfig = {
  id: "accounting",
  name: "Accounting",
  description: "Designed for bookkeeping, invoicing, and accounting software",
  psychology: "Professional, detail-oriented feel with precision slate and clarity teal",

  light: {
    primary: "#475569",
    primaryLight: "#64748b",
    primaryDark: "#334155",
    accent: "#0d9488",
    accentLight: "#14b8a6",
    accentDark: "#0f766e",

    background: "#f8fafc",
    backgroundSecondary: "#f1f5f9",
    backgroundTertiary: "#e2e8f0",

    surface: "#ffffff",
    surfaceHover: "#f8fafc",
    surfaceActive: "#f1f5f9",

    textPrimary: "#1e293b",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    textInverse: "#ffffff",

    border: "#cbd5e1",
    borderLight: "#e2e8f0",
    borderFocus: "#475569",

    semantic: semanticColorsLight,
  },

  dark: {
    primary: "#94a3b8",
    primaryLight: "#cbd5e1",
    primaryDark: "#64748b",
    accent: "#2dd4bf",
    accentLight: "#5eead4",
    accentDark: "#14b8a6",

    background: "#0f172a",
    backgroundSecondary: "#1e293b",
    backgroundTertiary: "#334155",

    surface: "#1e293b",
    surfaceHover: "#334155",
    surfaceActive: "#475569",

    textPrimary: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
    textInverse: "#0f172a",

    border: "#334155",
    borderLight: "#1e293b",
    borderFocus: "#94a3b8",

    semantic: semanticColorsDark,
  },

  primaryShades: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },

  accentShades: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },

  typography: {
    fontFamily: {
      heading: "'Source Sans Pro', 'Segoe UI', sans-serif",
      body: "'Source Sans Pro', 'Segoe UI', sans-serif",
      mono: "'Source Code Pro', 'Consolas', monospace",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.015em",
      normal: "0",
      wide: "0.015em",
    },
    lineHeight: {
      tight: 1.3,
      normal: 1.5,
      relaxed: 1.65,
    },
  },
};

// =====================================================
// Notes/Productivity Theme (notes)
// =====================================================

export const notesTheme: AppThemeConfig = {
  id: "notes",
  name: "Notes & Productivity",
  description: "Optimized for note-taking, task management, and productivity apps",
  psychology: "Minimal distractions with soft sage for growth and warm cream for comfort to encourage flow state",

  light: {
    primary: "#65a30d",
    primaryLight: "#84cc16",
    primaryDark: "#4d7c0f",
    accent: "#fef3c7",
    accentLight: "#fef9c3",
    accentDark: "#fde68a",

    background: "#fefdfb",
    backgroundSecondary: "#faf8f5",
    backgroundTertiary: "#f5f3f0",

    surface: "#ffffff",
    surfaceHover: "#fefdfb",
    surfaceActive: "#faf8f5",

    textPrimary: "#1a1a1a",
    textSecondary: "#525252",
    textMuted: "#a3a3a3",
    textInverse: "#ffffff",

    border: "#e5e5e5",
    borderLight: "#f5f5f5",
    borderFocus: "#65a30d",

    semantic: semanticColorsLight,
  },

  dark: {
    primary: "#84cc16",
    primaryLight: "#a3e635",
    primaryDark: "#65a30d",
    accent: "#fde68a",
    accentLight: "#fef3c7",
    accentDark: "#fcd34d",

    background: "#171717",
    backgroundSecondary: "#262626",
    backgroundTertiary: "#404040",

    surface: "#262626",
    surfaceHover: "#404040",
    surfaceActive: "#525252",

    textPrimary: "#fafafa",
    textSecondary: "#d4d4d4",
    textMuted: "#737373",
    textInverse: "#171717",

    border: "#404040",
    borderLight: "#262626",
    borderFocus: "#84cc16",

    semantic: semanticColorsDark,
  },

  primaryShades: {
    50: "#f7fee7",
    100: "#ecfccb",
    200: "#d9f99d",
    300: "#bef264",
    400: "#a3e635",
    500: "#84cc16",
    600: "#65a30d",
    700: "#4d7c0f",
    800: "#3f6212",
    900: "#365314",
    950: "#1a2e05",
  },

  accentShades: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
    950: "#422006",
  },

  typography: {
    fontFamily: {
      heading: "'Nunito', 'Segoe UI', sans-serif",
      body: "'Nunito', 'Segoe UI', sans-serif",
      mono: "'Fira Code', 'Consolas', monospace",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.01em",
      normal: "0",
      wide: "0.02em",
    },
    lineHeight: {
      tight: 1.4,
      normal: 1.6,
      relaxed: 1.8,
    },
  },
};

// =====================================================
// Health/Wellness Theme (health)
// =====================================================

export const healthTheme: AppThemeConfig = {
  id: "health",
  name: "Health & Wellness",
  description: "Designed for healthcare, fitness, and wellness applications",
  psychology: "Promotes relaxation and trust in care through healing teal and calming lavender",

  light: {
    primary: "#14b8a6",
    primaryLight: "#2dd4bf",
    primaryDark: "#0d9488",
    accent: "#a78bfa",
    accentLight: "#c4b5fd",
    accentDark: "#8b5cf6",

    background: "#f0fdfa",
    backgroundSecondary: "#e6fffa",
    backgroundTertiary: "#ccfbf1",

    surface: "#ffffff",
    surfaceHover: "#f0fdfa",
    surfaceActive: "#e6fffa",

    textPrimary: "#134e4a",
    textSecondary: "#2d6a66",
    textMuted: "#5eada5",
    textInverse: "#ffffff",

    border: "#99f6e4",
    borderLight: "#ccfbf1",
    borderFocus: "#14b8a6",

    semantic: semanticColorsLight,
  },

  dark: {
    primary: "#2dd4bf",
    primaryLight: "#5eead4",
    primaryDark: "#14b8a6",
    accent: "#c4b5fd",
    accentLight: "#ddd6fe",
    accentDark: "#a78bfa",

    background: "#0f1f1d",
    backgroundSecondary: "#1a2f2c",
    backgroundTertiary: "#264541",

    surface: "#1a2f2c",
    surfaceHover: "#264541",
    surfaceActive: "#336560",

    textPrimary: "#f0fdfa",
    textSecondary: "#99f6e4",
    textMuted: "#5eead4",
    textInverse: "#0f1f1d",

    border: "#264541",
    borderLight: "#1a2f2c",
    borderFocus: "#2dd4bf",

    semantic: semanticColorsDark,
  },

  primaryShades: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },

  accentShades: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },

  typography: {
    fontFamily: {
      heading: "'Lato', 'Segoe UI', sans-serif",
      body: "'Lato', 'Segoe UI', sans-serif",
      mono: "'Roboto Mono', 'Consolas', monospace",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.01em",
      normal: "0.01em",
      wide: "0.03em",
    },
    lineHeight: {
      tight: 1.3,
      normal: 1.6,
      relaxed: 1.8,
    },
  },
};

// =====================================================
// Social Theme (social)
// =====================================================

export const socialTheme: AppThemeConfig = {
  id: "social",
  name: "Social",
  description: "Optimized for social networks, community platforms, and messaging apps",
  psychology: "Encourages engagement and community through vibrant connection blue and energetic coral warmth",

  light: {
    primary: "#2563eb",
    primaryLight: "#3b82f6",
    primaryDark: "#1d4ed8",
    accent: "#f97316",
    accentLight: "#fb923c",
    accentDark: "#ea580c",

    background: "#f8fafc",
    backgroundSecondary: "#f1f5f9",
    backgroundTertiary: "#e2e8f0",

    surface: "#ffffff",
    surfaceHover: "#f8fafc",
    surfaceActive: "#f1f5f9",

    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    textInverse: "#ffffff",

    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    borderFocus: "#2563eb",

    semantic: semanticColorsLight,
  },

  dark: {
    primary: "#3b82f6",
    primaryLight: "#60a5fa",
    primaryDark: "#2563eb",
    accent: "#fb923c",
    accentLight: "#fdba74",
    accentDark: "#f97316",

    background: "#0a0f1a",
    backgroundSecondary: "#111827",
    backgroundTertiary: "#1f2937",

    surface: "#111827",
    surfaceHover: "#1f2937",
    surfaceActive: "#374151",

    textPrimary: "#f9fafb",
    textSecondary: "#d1d5db",
    textMuted: "#6b7280",
    textInverse: "#0a0f1a",

    border: "#1f2937",
    borderLight: "#111827",
    borderFocus: "#3b82f6",

    semantic: semanticColorsDark,
  },

  primaryShades: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  accentShades: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407",
  },

  typography: {
    fontFamily: {
      heading: "'Inter', 'Segoe UI', sans-serif",
      body: "'Inter', 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Consolas', monospace",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.02em",
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
};

// =====================================================
// Creative Theme (creative)
// =====================================================

export const creativeTheme: AppThemeConfig = {
  id: "creative",
  name: "Creative",
  description: "Designed for design tools, art platforms, and creative applications",
  psychology: "Sparks creativity and inspiration through imaginative purple and warm inspirational coral",

  light: {
    primary: "#7c3aed",
    primaryLight: "#8b5cf6",
    primaryDark: "#6d28d9",
    accent: "#fb7185",
    accentLight: "#fda4af",
    accentDark: "#f43f5e",

    background: "#faf5ff",
    backgroundSecondary: "#f3e8ff",
    backgroundTertiary: "#e9d5ff",

    surface: "#ffffff",
    surfaceHover: "#faf5ff",
    surfaceActive: "#f3e8ff",

    textPrimary: "#1e1b4b",
    textSecondary: "#4c1d95",
    textMuted: "#7c3aed",
    textInverse: "#ffffff",

    border: "#ddd6fe",
    borderLight: "#ede9fe",
    borderFocus: "#7c3aed",

    semantic: semanticColorsLight,
  },

  dark: {
    primary: "#a78bfa",
    primaryLight: "#c4b5fd",
    primaryDark: "#8b5cf6",
    accent: "#fda4af",
    accentLight: "#fecdd3",
    accentDark: "#fb7185",

    background: "#13111c",
    backgroundSecondary: "#1e1b2e",
    backgroundTertiary: "#2e2844",

    surface: "#1e1b2e",
    surfaceHover: "#2e2844",
    surfaceActive: "#433d60",

    textPrimary: "#f5f3ff",
    textSecondary: "#ddd6fe",
    textMuted: "#a78bfa",
    textInverse: "#13111c",

    border: "#2e2844",
    borderLight: "#1e1b2e",
    borderFocus: "#a78bfa",

    semantic: semanticColorsDark,
  },

  primaryShades: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },

  accentShades: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },

  typography: {
    fontFamily: {
      heading: "'Playfair Display', 'Georgia', serif",
      body: "'Raleway', 'Segoe UI', sans-serif",
      mono: "'Fira Code', 'Consolas', monospace",
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0.01em",
      wide: "0.05em",
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
};

// =====================================================
// Theme Registry
// =====================================================

export const appThemes: Record<AppThemeType, AppThemeConfig> = {
  edu: educationalTheme,
  finance: financeTheme,
  ecommerce: ecommerceTheme,
  accounting: accountingTheme,
  notes: notesTheme,
  health: healthTheme,
  social: socialTheme,
  creative: creativeTheme,
};

// =====================================================
// Utility Functions
// =====================================================

/**
 * Get theme configuration by app type
 */
export function getAppTheme(appType: AppThemeType): AppThemeConfig {
  return appThemes[appType];
}

/**
 * Get theme colors for a specific mode
 */
export function getThemeColors(
  appType: AppThemeType,
  mode: "light" | "dark"
): ThemeModeColors {
  return appThemes[appType][mode];
}

/**
 * Get all available app theme types
 */
export function getAvailableThemeTypes(): AppThemeType[] {
  return Object.keys(appThemes) as AppThemeType[];
}

/**
 * Check if a string is a valid app theme type
 */
export function isValidThemeType(type: string): type is AppThemeType {
  return type in appThemes;
}

/**
 * Generate CSS custom properties for a theme
 */
export function generateThemeCSSVariables(
  appType: AppThemeType,
  mode: "light" | "dark"
): Record<string, string> {
  const colors = getThemeColors(appType, mode);
  const theme = getAppTheme(appType);

  return {
    "--color-primary": colors.primary,
    "--color-primary-light": colors.primaryLight,
    "--color-primary-dark": colors.primaryDark,
    "--color-accent": colors.accent,
    "--color-accent-light": colors.accentLight,
    "--color-accent-dark": colors.accentDark,

    "--color-background": colors.background,
    "--color-background-secondary": colors.backgroundSecondary,
    "--color-background-tertiary": colors.backgroundTertiary,

    "--color-surface": colors.surface,
    "--color-surface-hover": colors.surfaceHover,
    "--color-surface-active": colors.surfaceActive,

    "--color-text-primary": colors.textPrimary,
    "--color-text-secondary": colors.textSecondary,
    "--color-text-muted": colors.textMuted,
    "--color-text-inverse": colors.textInverse,

    "--color-border": colors.border,
    "--color-border-light": colors.borderLight,
    "--color-border-focus": colors.borderFocus,

    "--color-success": colors.semantic.success,
    "--color-success-light": colors.semantic.successLight,
    "--color-success-dark": colors.semantic.successDark,
    "--color-warning": colors.semantic.warning,
    "--color-warning-light": colors.semantic.warningLight,
    "--color-warning-dark": colors.semantic.warningDark,
    "--color-error": colors.semantic.error,
    "--color-error-light": colors.semantic.errorLight,
    "--color-error-dark": colors.semantic.errorDark,
    "--color-info": colors.semantic.info,
    "--color-info-light": colors.semantic.infoLight,
    "--color-info-dark": colors.semantic.infoDark,

    "--font-family-heading": theme.typography.fontFamily.heading,
    "--font-family-body": theme.typography.fontFamily.body,
    "--font-family-mono": theme.typography.fontFamily.mono,

    "--font-weight-light": String(theme.typography.fontWeight.light),
    "--font-weight-normal": String(theme.typography.fontWeight.normal),
    "--font-weight-medium": String(theme.typography.fontWeight.medium),
    "--font-weight-semibold": String(theme.typography.fontWeight.semibold),
    "--font-weight-bold": String(theme.typography.fontWeight.bold),

    "--letter-spacing-tight": theme.typography.letterSpacing.tight,
    "--letter-spacing-normal": theme.typography.letterSpacing.normal,
    "--letter-spacing-wide": theme.typography.letterSpacing.wide,

    "--line-height-tight": String(theme.typography.lineHeight.tight),
    "--line-height-normal": String(theme.typography.lineHeight.normal),
    "--line-height-relaxed": String(theme.typography.lineHeight.relaxed),
  };
}

/**
 * Generate Tailwind CSS color configuration for a theme
 */
export function generateTailwindColors(appType: AppThemeType): {
  primary: Record<string, string>;
  accent: Record<string, string>;
} {
  const theme = getAppTheme(appType);

  return {
    primary: {
      "50": theme.primaryShades[50],
      "100": theme.primaryShades[100],
      "200": theme.primaryShades[200],
      "300": theme.primaryShades[300],
      "400": theme.primaryShades[400],
      "500": theme.primaryShades[500],
      "600": theme.primaryShades[600],
      "700": theme.primaryShades[700],
      "800": theme.primaryShades[800],
      "900": theme.primaryShades[900],
      "950": theme.primaryShades[950],
      DEFAULT: theme.light.primary,
    },
    accent: {
      "50": theme.accentShades[50],
      "100": theme.accentShades[100],
      "200": theme.accentShades[200],
      "300": theme.accentShades[300],
      "400": theme.accentShades[400],
      "500": theme.accentShades[500],
      "600": theme.accentShades[600],
      "700": theme.accentShades[700],
      "800": theme.accentShades[800],
      "900": theme.accentShades[900],
      "950": theme.accentShades[950],
      DEFAULT: theme.light.accent,
    },
  };
}

// =====================================================
// Default Export
// =====================================================

export default appThemes;
