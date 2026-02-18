"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getSessionToken, setSessionToken } from "./api";

interface PreviewSession {
  token: string;
  features: string[];
  tier: string;
  expiresAt: string;
}

interface PreviewContextValue {
  session: PreviewSession | null;
  isLoading: boolean;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  hasModule: (module: string) => boolean;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreviewContext(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreviewContext must be used within PreviewProvider");
  return ctx;
}

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      const token = getSessionToken();
      if (!token) {
        // Check URL params
        const urlToken = new URLSearchParams(window.location.search).get("session");
        if (urlToken) {
          setSessionToken(urlToken);
          return loadSessionData(urlToken);
        }
        setIsLoading(false);
        return;
      }
      await loadSessionData(token);
    }

    async function loadSessionData(token: string) {
      try {
        const studioUrl = process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3001";
        const res = await fetch(`${studioUrl}/api/preview/sessions/${token}`);
        if (!res.ok) {
          setError("Preview session not found or expired");
          setIsLoading(false);
          return;
        }
        const { data } = await res.json();
        setSession({
          token,
          features: data.selectedFeatures,
          tier: data.tier,
          expiresAt: data.expiresAt,
        });
      } catch {
        setError("Failed to load preview session");
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  // Heartbeat: send PATCH every 5 minutes to keep session alive
  useEffect(() => {
    if (!session) return;
    const studioUrl = process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3001";
    const interval = setInterval(() => {
      fetch(`${studioUrl}/api/preview/sessions/${session.token}`, {
        method: "PATCH",
      }).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  const hasFeature = (feature: string) =>
    session?.features.some((f) => f === feature) ?? false;

  const hasModule = (module: string) =>
    session?.features.some((f) => f.startsWith(module)) ?? false;

  return (
    <PreviewContext.Provider value={{ session, isLoading, error, hasFeature, hasModule }}>
      {children}
    </PreviewContext.Provider>
  );
}
