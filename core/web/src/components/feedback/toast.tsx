"use client";

import { Toaster as Sonner } from "sonner";

// =====================================================
// Toast Container Component
// =====================================================
//
// Provides the toast notification container using Sonner.
// Should be placed in the root layout to enable toasts app-wide.
//
// Features:
// - Auto-dismiss with configurable duration
// - Manual dismiss with close button
// - Stack multiple toasts
// - Accessible with role="alert"
// - Dark mode support
// - Four variants: success, error, warning, info
//
// Usage in layout.tsx:
//   import { Toaster } from "@/components/feedback";
//   <Toaster position="top-right" richColors closeButton />
//
// Triggering toasts:
//   import { toast } from "@/lib/toast";
//   toast.success("Profile saved!");
//   toast.error("Failed to save");
//   toast.warning("Session expires soon");
//   toast.info("New features available");
// =====================================================

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toast container component that renders toast notifications.
 * Uses Sonner under the hood with custom styling for the design system.
 *
 * @example
 * ```tsx
 * // In your root layout
 * <Toaster position="top-right" richColors closeButton />
 *
 * // Options
 * <Toaster
 *   position="top-right"      // Position of toasts
 *   richColors               // Use semantic colors for variants
 *   closeButton              // Show close button on toasts
 *   expand={false}           // Expand toasts on hover
 *   duration={4000}          // Default duration in ms
 *   visibleToasts={5}        // Max visible toasts
 *   gap={12}                 // Gap between toasts
 * />
 * ```
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          // Base toast styling
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          // Description text styling
          description: "group-[.toast]:text-muted-foreground",
          // Action button styling
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm",
          // Cancel button styling
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm",
          // Close button styling
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-none group-[.toast]:text-current group-[.toast]:opacity-70 group-[.toast]:hover:opacity-100 group-[.toast]:transition-opacity",
          // Error variant - red background
          error:
            "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive [&_[data-description]]:text-destructive-foreground/90",
          // Success variant - green background
          success:
            "group-[.toaster]:bg-green-600 group-[.toaster]:text-white group-[.toaster]:border-green-600 dark:group-[.toaster]:bg-green-700 dark:group-[.toaster]:border-green-700 [&_[data-description]]:text-white/90",
          // Warning variant - amber/yellow background
          warning:
            "group-[.toaster]:bg-amber-500 group-[.toaster]:text-white group-[.toaster]:border-amber-500 dark:group-[.toaster]:bg-amber-600 dark:group-[.toaster]:border-amber-600 [&_[data-description]]:text-white/90",
          // Info variant - blue background
          info: "group-[.toaster]:bg-blue-600 group-[.toaster]:text-white group-[.toaster]:border-blue-600 dark:group-[.toaster]:bg-blue-700 dark:group-[.toaster]:border-blue-700 [&_[data-description]]:text-white/90",
          // Loading variant
          loading:
            "group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border",
        },
      }}
      {...props}
    />
  );
}

export type { ToasterProps };
