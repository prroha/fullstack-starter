"use client";

import { useEffect, useState } from "react";
import { logger, reportError } from "@/lib/logger";
import { Button, Text } from "@/components/ui";
import { AppLink } from "@/components/ui/link";
import { Icon } from "@/components/ui/icon";

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
          <Icon name="TriangleAlert" size="lg" color="destructive" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-foreground">
          Something went wrong
        </h1>

        {/* Description */}
        <Text color="muted" className="mt-3">
          We encountered an unexpected error. Our team has been notified and is
          working to fix the issue.
        </Text>

        {/* Error ID */}
        {error.digest && (
          <Text variant="caption" color="muted" className="mt-3">
            Error ID:{" "}
            <Text variant="code" as="span" size="xs">
              {error.digest}
            </Text>
          </Text>
        )}

        {/* Dev-only error details */}
        {isDev && (
          <div className="mt-4">
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide" : "Show"} error details
            </Button>
            {showDetails && (
              <div className="mt-3 p-4 bg-muted rounded-lg text-left overflow-auto max-h-48">
                <Text variant="caption" color="destructive" className="font-medium mb-2">
                  {error.name}: {error.message}
                </Text>
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
          <Button size="lg" onClick={reset}>
            <Icon name="RefreshCw" size="sm" className="mr-2" />
            Try Again
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.location.href = "/"}>
            <Icon name="House" size="sm" className="mr-2" />
            Go Home
          </Button>
        </div>

        {/* Support link */}
        <Text variant="caption" color="muted" className="mt-8">
          Need help?{" "}
          <AppLink href="mailto:support@example.com" variant="primary">
            Contact support
          </AppLink>
        </Text>
      </div>
    </div>
  );
}
