"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loading, LoadingCard } from "./loading";
import { ErrorMessage } from "./inline-feedback";

// =====================================================
// Loading Wrapper Component
// =====================================================

interface LoadingWrapperProps {
  /** Whether the content is loading */
  isLoading: boolean;
  /** Error message to display if there's an error */
  error?: string | null;
  /** The content to render when not loading */
  children: React.ReactNode;
  /** Loading message to display */
  loadingMessage?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** Loading variant */
  variant?: "inline" | "card" | "overlay" | "minimal";
  /** Spinner size for inline/minimal variants */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Minimum loading time in ms (prevents flash for fast loads) */
  minLoadingTime?: number;
}

/**
 * LoadingWrapper component for handling async content loading states.
 * Provides consistent loading and error handling patterns.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingWrapper isLoading={isLoading} error={error}>
 *   <UserProfile user={user} />
 * </LoadingWrapper>
 *
 * // With retry functionality
 * <LoadingWrapper
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   loadingMessage="Loading user data..."
 * >
 *   <UserProfile user={user} />
 * </LoadingWrapper>
 *
 * // Card variant for dashboard widgets
 * <LoadingWrapper
 *   isLoading={isLoading}
 *   variant="card"
 *   loadingMessage="Loading statistics..."
 * >
 *   <StatsCard stats={stats} />
 * </LoadingWrapper>
 * ```
 */
function LoadingWrapper({
  isLoading,
  error,
  children,
  loadingMessage,
  loadingComponent,
  errorComponent,
  onRetry,
  variant = "inline",
  size = "md",
  className,
  minLoadingTime = 0,
}: LoadingWrapperProps) {
  const [showLoading, setShowLoading] = React.useState(isLoading);
  const loadStartTimeRef = React.useRef<number | null>(null);

  // Handle minimum loading time
  React.useEffect(() => {
    if (isLoading) {
      loadStartTimeRef.current = Date.now();
      setShowLoading(true);
    } else if (loadStartTimeRef.current && minLoadingTime > 0) {
      const elapsed = Date.now() - loadStartTimeRef.current;
      const remaining = minLoadingTime - elapsed;

      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoading(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setShowLoading(false);
      }
    } else {
      setShowLoading(false);
    }
  }, [isLoading, minLoadingTime]);

  // Error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className={cn("py-4", className)}>
        <div className="flex flex-col items-center gap-3">
          <ErrorMessage message={error} />
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    switch (variant) {
      case "card":
        return (
          <LoadingCard
            message={loadingMessage}
            className={className}
          />
        );

      case "overlay":
        return (
          <div className={cn("relative min-h-[100px]", className)}>
            {children}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <Loading size={size} message={loadingMessage} />
            </div>
          </div>
        );

      case "minimal":
        return (
          <div className={cn("flex items-center justify-center py-2", className)}>
            <Loading size={size} />
          </div>
        );

      case "inline":
      default:
        return (
          <div className={cn("flex items-center justify-center py-8", className)}>
            <Loading size={size} message={loadingMessage} />
          </div>
        );
    }
  }

  // Content
  return <>{children}</>;
}

// =====================================================
// AsyncContent Component
// =====================================================

interface AsyncContentProps<T> {
  /** The data being loaded */
  data: T | undefined | null;
  /** Whether the content is loading */
  isLoading: boolean;
  /** Error message */
  error?: string | null;
  /** Render function for the content */
  children: (data: T) => React.ReactNode;
  /** Loading message */
  loadingMessage?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Empty state when data is null/undefined but not loading */
  emptyState?: React.ReactNode;
  /** Loading variant */
  variant?: "inline" | "card" | "overlay" | "minimal";
  /** Additional CSS classes */
  className?: string;
}

/**
 * AsyncContent component for rendering async data with loading states.
 * Provides type-safe rendering of loaded data.
 *
 * @example
 * ```tsx
 * <AsyncContent
 *   data={user}
 *   isLoading={isLoading}
 *   error={error}
 *   loadingMessage="Loading user..."
 *   emptyState={<div>No user found</div>}
 * >
 *   {(user) => <UserCard user={user} />}
 * </AsyncContent>
 * ```
 */
function AsyncContent<T>({
  data,
  isLoading,
  error,
  children,
  loadingMessage,
  onRetry,
  emptyState,
  variant = "inline",
  className,
}: AsyncContentProps<T>) {
  return (
    <LoadingWrapper
      isLoading={isLoading}
      error={error}
      loadingMessage={loadingMessage}
      onRetry={onRetry}
      variant={variant}
      className={className}
    >
      {data !== undefined && data !== null ? (
        children(data)
      ) : (
        emptyState ?? null
      )}
    </LoadingWrapper>
  );
}

// =====================================================
// Exports
// =====================================================

export { LoadingWrapper, AsyncContent };
export type { LoadingWrapperProps, AsyncContentProps };
