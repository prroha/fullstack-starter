"use client";

import { useEffect } from "react";
import { getSessionToken } from "@preview/lib/api";

/**
 * Intercepts all fetch calls to inject X-Preview-Session header
 * for API requests. This allows module pages (which use their own
 * API clients with plain fetch) to work in preview mode without modification.
 */
export function FetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const token = getSessionToken();

      if (token) {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
        const isApiCall = url.includes("/api/") || url.includes("/api/v1/");

        if (isApiCall) {
          const headers = new Headers(init?.headers);
          if (!headers.has("X-Preview-Session")) {
            headers.set("X-Preview-Session", token);
          }
          return originalFetch(input, { ...init, headers });
        }
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
