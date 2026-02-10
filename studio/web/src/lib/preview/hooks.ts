"use client";

import { useState, useCallback, useEffect } from "react";

// ============================================================================
// Device Types
// ============================================================================

export type DeviceType = "desktop" | "tablet" | "mobile";
export type ThemeMode = "light" | "dark" | "system";

export interface DeviceSize {
  width: number;
  height: number;
  label: string;
}

export const DEVICE_SIZES: Record<DeviceType, DeviceSize> = {
  desktop: { width: 1440, height: 900, label: "Desktop" },
  tablet: { width: 768, height: 1024, label: "Tablet" },
  mobile: { width: 375, height: 812, label: "Mobile" },
};

// ============================================================================
// useDevicePreview - Manage device preview state
// ============================================================================

interface UseDevicePreviewReturn {
  device: DeviceType;
  size: DeviceSize;
  setDevice: (device: DeviceType) => void;
  isResponsive: boolean;
  toggleResponsive: () => void;
}

export function useDevicePreview(
  initialDevice: DeviceType = "desktop"
): UseDevicePreviewReturn {
  const [device, setDevice] = useState<DeviceType>(initialDevice);
  const [isResponsive, setIsResponsive] = useState(false);

  const toggleResponsive = useCallback(() => {
    setIsResponsive((prev) => !prev);
  }, []);

  return {
    device,
    size: DEVICE_SIZES[device],
    setDevice,
    isResponsive,
    toggleResponsive,
  };
}

// ============================================================================
// useThemePreview - Manage theme preview state
// ============================================================================

interface UseThemePreviewReturn {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
}

export function useThemePreview(
  initialTheme: ThemeMode = "light"
): UseThemePreviewReturn {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  // Detect system theme preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  return {
    theme,
    setTheme,
    resolvedTheme,
  };
}

// ============================================================================
// usePreviewSession - Track preview session for analytics
// ============================================================================

interface PreviewSession {
  id: string;
  tier: string;
  features: string[];
  startedAt: Date;
  duration: number;
}

interface UsePreviewSessionReturn {
  session: PreviewSession | null;
  startSession: (tier: string, features: string[]) => void;
  endSession: () => void;
}

export function usePreviewSession(): UsePreviewSessionReturn {
  const [session, setSession] = useState<PreviewSession | null>(null);

  const startSession = useCallback((tier: string, features: string[]) => {
    const id = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setSession({
      id,
      tier,
      features,
      startedAt: new Date(),
      duration: 0,
    });

    // Optionally track session start via API
    // fetch('/api/preview/session', { method: 'POST', body: JSON.stringify({ tier, features }) });
  }, []);

  const endSession = useCallback(() => {
    if (session) {
      const duration = Date.now() - session.startedAt.getTime();

      // Optionally track session end via API
      // fetch('/api/preview/session', {
      //   method: 'PATCH',
      //   body: JSON.stringify({ sessionId: session.id, duration }),
      // });

      setSession(null);
    }
  }, [session]);

  // Update duration every minute
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          duration: Date.now() - prev.startedAt.getTime(),
        };
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [session]);

  return {
    session,
    startSession,
    endSession,
  };
}
