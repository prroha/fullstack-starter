"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

// =====================================================
// Loading Components
// =====================================================
//
// A collection of loading state components for different use cases:
//
// - Loading: Basic inline loading indicator with optional message
// - LoadingOverlay: Full-screen blocking overlay
// - LoadingCard: Loading state for card/widget placeholders
// - LoadingPage: Full-page loading state
// - LoadingButtonContent: Helper for button loading states
//
// For async content wrapping, see LoadingWrapper in ./loading-wrapper.tsx
// For skeleton placeholders, see Skeleton in @/components/ui/skeleton
//
// Usage:
//   import { Loading, LoadingOverlay, LoadingCard } from "@/components/feedback";
//
//   <Loading message="Loading data..." />
//   <LoadingOverlay message="Processing..." transparent />
//   <LoadingCard message="Loading statistics..." />
// =====================================================

// =====================================================
// Loading Component - Inline Loading Indicator
// =====================================================

interface LoadingProps {
  /** Spinner size */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Message to display next to spinner */
  message?: string;
  /** Whether to take full width */
  fullWidth?: boolean;
}

/**
 * Basic inline loading indicator with optional message.
 * Use for inline loading states within content areas.
 *
 * @example
 * ```tsx
 * <Loading size="md" message="Loading users..." />
 * ```
 */
function Loading({
  size = "md",
  className,
  message,
  fullWidth = false,
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3",
        fullWidth && "w-full",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size={size} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

// =====================================================
// LoadingOverlay Component - Full Screen Overlay
// =====================================================

interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
  className?: string;
}

function LoadingOverlay({
  message = "Loading...",
  transparent = false,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        transparent
          ? "bg-background/50 backdrop-blur-sm"
          : "bg-background/80 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// =====================================================
// LoadingCard Component - Loading State for Cards
// =====================================================

interface LoadingCardProps {
  message?: string;
  className?: string;
  height?: string;
}

function LoadingCard({
  message,
  className,
  height = "h-40",
}: LoadingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-card",
        height,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size="md" />
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

// =====================================================
// LoadingPage Component - Full Page Loading State
// =====================================================

interface LoadingPageProps {
  message?: string;
  className?: string;
}

function LoadingPage({ message = "Loading...", className }: LoadingPageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-screen",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

// =====================================================
// LoadingButton Content - For Button Loading States
// =====================================================

interface LoadingButtonContentProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

function LoadingButtonContent({
  isLoading,
  loadingText,
  children,
}: LoadingButtonContentProps) {
  if (isLoading) {
    return (
      <>
        <Spinner size="sm" className="mr-2" />
        {loadingText ?? children}
      </>
    );
  }

  return <>{children}</>;
}

export {
  Loading,
  LoadingOverlay,
  LoadingCard,
  LoadingPage,
  LoadingButtonContent,
};
export type {
  LoadingProps,
  LoadingOverlayProps,
  LoadingCardProps,
  LoadingPageProps,
  LoadingButtonContentProps,
};
