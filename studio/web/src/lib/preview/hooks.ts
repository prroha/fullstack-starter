"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { API_CONFIG, PREVIEW_CONFIG } from "@/lib/constants";

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

export function usePreviewSession(): UsePreviewSessionReturn {
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track the session token for cleanup, avoiding stale closures
  const sessionTokenRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    sessionTokenRef.current = session?.sessionToken;
  }, [session?.sessionToken]);

  const startSession = useCallback(async (tier: string, features: string[], templateSlug?: string) => {
    const id = `preview_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Create local session immediately for responsive UI
    const localSession: PreviewSession = {
      id,
      tier,
      features,
      startedAt: new Date(),
    };

    setSession(localSession);
    setError(null);

    // Optionally create backend session for persistence/sharing
    // This is non-blocking - the preview works without backend
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/preview/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    }
  }, []);

  const endSession = useCallback(async () => {
    // Use ref to get latest token without depending on session state
    const token = sessionTokenRef.current;
    if (token) {
      try {
        await fetch(`${API_CONFIG.BASE_URL}/preview/sessions/${token}`, {
          method: "DELETE",
        });
      } catch {
        // Ignore deletion errors
      }
    }
    setSession(null);
    setError(null);
  }, []);

  // Load session configuration from a token (for shared preview links)
  const loadSessionFromToken = useCallback(async (token: string): Promise<PreviewSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/preview/sessions/${token}`);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const errorMessage =
          response.status === 410
            ? "This preview session has expired"
            : response.status === 404
              ? "Preview session not found"
              : (data?.error || "Failed to load preview session");
        setError(errorMessage);
        return null;
      }

      const data = await response.json();
      if (data.success && data.data) {
        const loadedSession: PreviewSession = {
          id: `preview_${Date.now()}`,
          sessionToken: token,
          tier: data.data.tier,
          features: data.data.selectedFeatures,
          startedAt: new Date(),
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

  return {
    session,
    isLoading,
    error,
    startSession,
    endSession,
    loadSessionFromToken,
  };
}

// ============================================================================
// useLivePreview - Launch and manage a live preview session
// ============================================================================

interface UseLivePreviewReturn {
  status: "idle" | "provisioning" | "ready" | "error";
  sessionToken: string | null;
  previewUrl: string | null;
  error: string | null;
  launch: (tier: string, features: string[]) => void;
  stop: () => void;
}

export function useLivePreview(): UseLivePreviewReturn {
  const [status, setStatus] = useState<UseLivePreviewReturn["status"]>("idle");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const launch = useCallback(async (tier: string, features: string[]) => {
    // Abort any in-progress launch
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setStatus("provisioning");
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/preview/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedFeatures: features,
          tier,
          provisionSchema: true,
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to create preview session");
      }

      const data = await response.json();
      if (!data.success || !data.data?.sessionToken) {
        throw new Error("Invalid response from preview service");
      }

      const token = data.data.sessionToken;
      setSessionToken(token);

      // Poll for readiness
      const startTime = Date.now();
      const poll = async (): Promise<void> => {
        if (abort.signal.aborted) return;

        if (Date.now() - startTime > PREVIEW_CONFIG.POLL_TIMEOUT_MS) {
          throw new Error("Preview setup timed out. Please try again.");
        }

        const statusRes = await fetch(
          `${API_CONFIG.BASE_URL}/preview/sessions/${token}/status`,
          { signal: abort.signal }
        );

        if (!statusRes.ok) {
          throw new Error("Failed to check preview status");
        }

        const statusData = await statusRes.json();
        const schemaStatus = statusData.data?.schemaStatus;

        if (schemaStatus === "READY") {
          const url = `${PREVIEW_CONFIG.FRONTEND_URL}?session=${token}`;
          setPreviewUrl(url);
          setStatus("ready");
          return;
        }

        if (schemaStatus === "FAILED") {
          throw new Error("Preview setup failed. Please try again.");
        }

        await new Promise((r) => setTimeout(r, PREVIEW_CONFIG.POLL_INTERVAL_MS));
        return poll();
      };

      await poll();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to launch preview");
    }
  }, []);

  const stop = useCallback(async () => {
    abortRef.current?.abort();
    const token = sessionToken;
    setStatus("idle");
    setSessionToken(null);
    setPreviewUrl(null);
    setError(null);

    if (token) {
      try {
        await fetch(`${API_CONFIG.BASE_URL}/preview/sessions/${token}`, {
          method: "DELETE",
        });
      } catch {
        // Best-effort cleanup
      }
    }
  }, [sessionToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { status, sessionToken, previewUrl, error, launch, stop };
}
