"use client";

import { useEffect, useState } from "react";
import { logger, reportError } from "@/lib/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Log the error to the logging service
    logger.error("PageError", "Application error occurred", error, {
      digest: error.digest,
    });
    reportError(error, { digest: error.digest, boundary: "page" });
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg">
        {/* Illustration */}
        <div className="mb-6">
          <svg
            className="w-40 h-40 mx-auto text-muted-foreground/30"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Server/computer with error illustration */}
            <rect
              x="40"
              y="50"
              width="120"
              height="80"
              rx="8"
              className="stroke-current"
              strokeWidth="4"
              fill="none"
            />
            {/* Screen */}
            <rect
              x="50"
              y="60"
              width="100"
              height="50"
              rx="4"
              className="fill-current opacity-10"
            />
            {/* Error icon on screen */}
            <circle
              cx="100"
              cy="85"
              r="18"
              className="stroke-destructive fill-destructive/10"
              strokeWidth="3"
            />
            <path
              d="M100 77v10M100 93h.01"
              className="stroke-destructive"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Stand */}
            <path
              d="M90 130h20M100 130v15M85 145h30"
              className="stroke-current"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Decorative sparks */}
            <path
              d="M170 60l5-5M175 60l-5-5"
              className="stroke-destructive"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M30 90l5-5M35 90l-5-5"
              className="stroke-destructive"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Decorative dots */}
            <circle cx="170" cy="140" r="4" className="fill-primary/20" />
            <circle cx="30" cy="60" r="6" className="fill-primary/15" />
          </svg>
        </div>

        {/* Error icon badge */}
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        <h1 className="text-2xl font-semibold text-foreground">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="mt-3 text-muted-foreground">
          We encountered an unexpected error. Our team has been notified and is
          working to fix the issue.
        </p>

        {/* Error ID */}
        {error.digest && (
          <p className="mt-3 text-sm text-muted-foreground">
            Error ID:{" "}
            <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
              {error.digest}
            </code>
          </p>
        )}

        {/* Dev-only error details */}
        {isDev && (
          <div className="mt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              {showDetails ? "Hide" : "Show"} error details
            </button>
            {showDetails && (
              <div className="mt-3 p-4 bg-muted rounded-lg text-left overflow-auto max-h-48">
                <p className="text-sm font-medium text-destructive mb-2">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <svg
              className="w-5 h-5"
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
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
          >
            <svg
              className="w-5 h-5"
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

        {/* Support link */}
        <p className="mt-8 text-sm text-muted-foreground">
          Need help?{" "}
          <a
            href="mailto:support@example.com"
            className="text-primary hover:underline underline-offset-2"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
