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
  sessionToken?: string;
  tier: string;
  features: string[];
  startedAt: Date;
  duration: number;
  expiresAt?: Date;
}

interface UsePreviewSessionReturn {
  session: PreviewSession | null;
  isLoading: boolean;
  error: string | null;
  startSession: (tier: string, features: string[], templateSlug?: string) => void;
  endSession: () => void;
  loadSessionFromToken: (token: string) => Promise<PreviewSession | null>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export function usePreviewSession(): UsePreviewSessionReturn {
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (tier: string, features: string[], templateSlug?: string) => {
    const id = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create local session immediately for responsive UI
    const localSession: PreviewSession = {
      id,
      tier,
      features,
      startedAt: new Date(),
      duration: 0,
    };

    setSession(localSession);
    setError(null);

    // Optionally create backend session for persistence/sharing
    // This is non-blocking - the preview works without backend
    if (features.length > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/preview/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedFeatures: features,
            tier,
            templateSlug,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setSession((prev) => prev ? {
              ...prev,
              sessionToken: data.data.sessionToken,
              expiresAt: new Date(data.data.expiresAt),
            } : prev);
          }
        }
      } catch {
        // Backend session creation is optional - continue without it
        console.debug("Backend session creation skipped - preview works offline");
      }
    }
  }, []);

  const endSession = useCallback(async () => {
    if (session?.sessionToken) {
      // Optionally delete backend session
      try {
        await fetch(`${API_BASE_URL}/preview/sessions/${session.sessionToken}`, {
          method: "DELETE",
        });
      } catch {
        // Ignore deletion errors
      }
    }
    setSession(null);
    setError(null);
  }, [session]);

  // Load session configuration from a token (for shared preview links)
  const loadSessionFromToken = useCallback(async (token: string): Promise<PreviewSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/preview/sessions/${token}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to load preview session";
        setError(errorMessage);
        return null;
      }

      if (data.success && data.data) {
        const loadedSession: PreviewSession = {
          id: `preview_${Date.now()}`,
          sessionToken: token,
          tier: data.data.tier,
          features: data.data.selectedFeatures,
          startedAt: new Date(),
          duration: 0,
          expiresAt: new Date(data.data.expiresAt),
        };
        setSession(loadedSession);
        return loadedSession;
      }

      setError("Invalid session data");
      return null;
    } catch {
      setError("Failed to connect to preview service");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    isLoading,
    error,
    startSession,
    endSession,
    loadSessionFromToken,
  };
}
