import { cn } from "@/lib/utils";

// =====================================================
// Spinner Component
// =====================================================

interface SpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

/**
 * Spinner component for indicating loading state.
 * A simple animated circular spinner.
 *
 * @example
 * ```tsx
 * <Spinner size="md" />
 * <Button disabled><Spinner size="sm" className="mr-2" /> Loading...</Button>
 * ```
 */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// =====================================================
// SpinnerOverlay Component
// =====================================================
// Note: For full-page loading overlays, prefer using LoadingOverlay
// from @/components/feedback which offers more customization options.

interface SpinnerOverlayProps {
  /** Message to display below the spinner */
  message?: string;
}

/**
 * Full-screen spinner overlay for blocking loading states.
 *
 * @deprecated Prefer using `LoadingOverlay` from `@/components/feedback`
 * which provides more customization options (transparent mode, className, etc.)
 *
 * @example
 * ```tsx
 * // Instead of:
 * <SpinnerOverlay message="Loading..." />
 *
 * // Prefer:
 * import { LoadingOverlay } from "@/components/feedback";
 * <LoadingOverlay message="Loading..." transparent />
 * ```
 */
export function SpinnerOverlay({ message = "Loading..." }: SpinnerOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export type { SpinnerProps, SpinnerOverlayProps };
