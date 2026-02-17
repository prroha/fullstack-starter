"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button, Container } from "@/components/ui";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Public route error:", error);
  }, [error]);

  return (
    <Container className="py-12">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        {/* Error Icon */}
        <div className="w-16 h-16 mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>

        {/* Error Digest (for debugging) */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={reset} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
