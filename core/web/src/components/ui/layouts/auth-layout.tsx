"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Text } from "../text";

// =====================================================
// Types
// =====================================================

type MaxWidth = "sm" | "md" | "lg";

interface AuthLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Form content to be rendered inside the card */
  children: React.ReactNode;
  /** Page title (e.g., "Sign In", "Create Account") */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional logo/brand element */
  logo?: React.ReactNode;
  /** Optional footer (e.g., links to other auth pages) */
  footer?: React.ReactNode;
  /** Card width variant */
  maxWidth?: MaxWidth;
  /** Show decorative background pattern */
  showBackgroundPattern?: boolean;
}

// =====================================================
// AuthLayout Component
// =====================================================

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

function AuthLayout({
  children,
  title,
  subtitle,
  logo,
  footer,
  maxWidth = "sm",
  showBackgroundPattern = false,
  className,
  ...props
}: AuthLayoutProps): React.ReactElement {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full flex items-center justify-center",
        "bg-background",
        // Content-first spacing: tighter padding
        "px-3 py-6 sm:px-4 md:px-6",
        className
      )}
      {...props}
    >
      {/* Background Pattern */}
      {showBackgroundPattern && <BackgroundPattern />}

      {/* Auth Card Container - Using main for semantic structure */}
      <main
        className={cn(
          "relative z-10 w-full",
          maxWidthClasses[maxWidth]
        )}
        role="main"
        aria-labelledby="auth-title"
      >
        {/* Logo */}
        {logo && (
          <div className="flex justify-center mb-6">
            {logo}
          </div>
        )}

        {/* Card - Content-first spacing: tighter padding */}
        <div
          className={cn(
            "w-full bg-card rounded-xl border border-border",
            "shadow-lg shadow-black/5 dark:shadow-black/20",
            "p-4 sm:p-6"
          )}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <h1
              id="auth-title"
              className="text-2xl font-bold tracking-tight text-card-foreground"
            >
              {title}
            </h1>
            {subtitle && (
              <Text size="sm" color="muted" className="mt-1">
                {subtitle}
              </Text>
            )}
          </div>

          {/* Form Content */}
          <div className="space-y-3">
            {children}
          </div>
        </div>

        {/* Footer - Enhanced visibility for navigation links */}
        {footer && (
          <nav
            aria-label="Authentication navigation"
            className={cn(
              "mt-4 text-center text-sm",
              // Slightly more visible than muted but still secondary
              "text-muted-foreground",
              // Links within footer should be more discoverable
              "[&_a]:text-foreground [&_a]:underline-offset-4 [&_a]:hover:underline [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2 [&_a]:rounded-sm"
            )}
          >
            {footer}
          </nav>
        )}
      </main>
    </div>
  );
}

AuthLayout.displayName = "AuthLayout";

// =====================================================
// Background Pattern Component
// =====================================================

function BackgroundPattern(): React.ReactElement {
  return (
    <>
      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 z-0",
          "bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
        )}
        aria-hidden="true"
      />

      {/* Grid pattern */}
      <div
        className={cn(
          "absolute inset-0 z-0 opacity-[0.015] dark:opacity-[0.03]",
          "[background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]",
          "[background-size:4rem_4rem]"
        )}
        aria-hidden="true"
      />

      {/* Radial gradient for depth */}
      <div
        className={cn(
          "absolute inset-0 z-0",
          "bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]"
        )}
        aria-hidden="true"
      />
    </>
  );
}

// =====================================================
// Exports
// =====================================================

export { AuthLayout, BackgroundPattern };
export type { AuthLayoutProps, MaxWidth };
