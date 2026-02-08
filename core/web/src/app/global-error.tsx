"use client";

import { useEffect, useState } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detect dark mode preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = localStorage.getItem("theme");
    setIsDark(storedTheme === "dark" || (storedTheme !== "light" && prefersDark));

    // Log critical errors - using console since logger may not be available
    console.error("[CRITICAL] Global error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });

    // Attempt to send error to remote endpoint directly
    if (process.env.NEXT_PUBLIC_LOG_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: [{
            timestamp: new Date().toISOString(),
            level: "error",
            message: "Critical global error",
            error: {
              name: error.name,
              message: error.message,
              digest: error.digest,
            },
            metadata: {
              boundary: "global",
              url: typeof window !== "undefined" ? window.location.href : undefined,
            },
          }],
        }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [error]);

  // Theme-aware colors
  const colors = isDark
    ? {
        background: "#0a0a0a",
        surface: "#171717",
        text: "#fafafa",
        textMuted: "#a3a3a3",
        textSecondary: "#737373",
        border: "#262626",
        primary: "#3b82f6",
        destructive: "#ef4444",
        destructiveBg: "rgba(239, 68, 68, 0.1)",
      }
    : {
        background: "#fafafa",
        surface: "#ffffff",
        text: "#171717",
        textMuted: "#737373",
        textSecondary: "#a3a3a3",
        border: "#e5e5e5",
        primary: "#2563eb",
        destructive: "#dc2626",
        destructiveBg: "#fef2f2",
      };

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content={isDark ? "dark" : "light"} />
      </head>
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            backgroundColor: colors.background,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "28rem" }}>
            {/* Illustration */}
            <div style={{ marginBottom: "1.5rem" }}>
              <svg
                style={{ width: "8rem", height: "8rem", margin: "0 auto", opacity: 0.3, color: colors.textMuted }}
                viewBox="0 0 200 200"
                fill="none"
              >
                {/* Broken gear illustration */}
                <circle
                  cx="100"
                  cy="100"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="15 10"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="25"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                {/* Lightning bolt */}
                <path
                  d="M90 75l15-25h-10l15-20-10 25h10l-20 35z"
                  fill={colors.destructive}
                  opacity="0.8"
                />
              </svg>
            </div>

            {/* Error icon */}
            <div
              style={{
                width: "4rem",
                height: "4rem",
                margin: "0 auto 1.5rem",
                borderRadius: "50%",
                backgroundColor: colors.destructiveBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                style={{ width: "2rem", height: "2rem", color: colors.destructive }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: colors.text,
                margin: 0,
              }}
            >
              Critical Error
            </h1>

            {/* Description */}
            <p
              style={{
                marginTop: "0.75rem",
                color: colors.textMuted,
                lineHeight: 1.6,
              }}
            >
              A critical error has occurred that prevented the application from loading.
              Please refresh the page or try again later.
            </p>

            {/* Error ID */}
            {error.digest && (
              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.875rem",
                  color: colors.textSecondary,
                }}
              >
                Error ID:{" "}
                <code
                  style={{
                    padding: "0.125rem 0.375rem",
                    backgroundColor: isDark ? colors.surface : "#f3f4f6",
                    borderRadius: "0.25rem",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                >
                  {error.digest}
                </code>
              </p>
            )}

            {/* Action buttons */}
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  backgroundColor: colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: 500,
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                <svg
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>
              <a
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "transparent",
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "0.5rem",
                  fontWeight: 500,
                  fontSize: "1rem",
                  textDecoration: "none",
                }}
              >
                <svg
                  style={{ width: "1.25rem", height: "1.25rem" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go Home
              </a>
            </div>

            {/* Hard refresh suggestion */}
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.75rem",
                color: colors.textSecondary,
              }}
            >
              If the problem persists, try a hard refresh (Ctrl/Cmd + Shift + R)
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
