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

const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL || "http://localhost:3001";

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      const params = new URLSearchParams(window.location.search);

      const token = getSessionToken() || params.get("session");
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Store session token for future requests
      setSessionToken(token);

      // Load session data from studio
      await loadSessionData(token);

      // Handle SSO auto-login if sso param is present
      const ssoToken = params.get("sso");
      if (ssoToken) {
        await handleSsoLogin(token, ssoToken);

        // Clean up URL params after SSO
        const url = new URL(window.location.href);
        url.searchParams.delete("sso");
        window.history.replaceState({}, "", url.toString());
      }
    }

    async function loadSessionData(token: string) {
      try {
        const res = await fetch(`${STUDIO_URL}/api/preview/sessions/${token}`);
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

    async function handleSsoLogin(sessionToken: string, ssoToken: string) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api/v1";
        const res = await fetch(`${apiUrl}/auth/sso`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Preview-Session": sessionToken,
          },
          credentials: "include",
          body: JSON.stringify({ ssoToken }),
        });

        if (!res.ok) {
          console.warn("[preview] SSO auto-login failed:", res.status);
          return;
        }

        // SSO httpOnly cookie is now set by the backend — user is automatically logged in
      } catch (err) {
        console.warn("[preview] SSO auto-login error:", err instanceof Error ? err.message : err);
      }
    }

    loadSession();
  }, []);

  // Heartbeat: send PATCH every 5 minutes to keep session alive
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      fetch(`${STUDIO_URL}/api/preview/sessions/${session.token}`, {
        method: "PATCH",
      }).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  const hasFeature = (feature: string) =>
    session?.features.includes(feature) ?? false;

  const hasModule = (module: string) =>
    session?.features.some((f) => f.startsWith(module)) ?? false;

  return (
    <PreviewContext.Provider value={{ session, isLoading, error, hasFeature, hasModule }}>
      {children}
    </PreviewContext.Provider>
  );
}
