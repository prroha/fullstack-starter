import { toast as sonnerToast, type ExternalToast } from "sonner";
import { DURATIONS } from "./constants";

// =====================================================
// Toast Utility
// =====================================================
//
// A convenient wrapper around sonner for showing toast notifications.
// Provides typed methods for success, error, warning, and info toasts.
//
// Usage:
//   import { toast } from "@/lib/toast";
//   toast.success("Profile updated successfully");
//   toast.error("Failed to save changes");
//   toast.warning("Your session will expire soon");
//   toast.info("New features available");
//
// With options:
//   toast.success("Saved!", { duration: 3000 });
//   toast.error("Failed", { description: "Please try again" });
//
// With action:
//   toast.error("Failed to save", {
//     action: { label: "Retry", onClick: () => handleRetry() }
//   });
// =====================================================

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  /** Optional description text below the main message */
  description?: string;
  /** Duration in milliseconds (default: 4000, use Infinity for persistent) */
  duration?: number;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Cancel button configuration */
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  /** Called when toast is dismissed */
  onDismiss?: () => void;
  /** Called when toast auto-closes */
  onAutoClose?: () => void;
}

/**
 * Shows a success toast notification
 * @param message - The main message to display
 * @param options - Additional toast options
 * @returns Toast ID for programmatic dismissal
 */
function success(message: string, options?: ToastOptions): string | number {
  return sonnerToast.success(message, formatOptions(options));
}

/**
 * Shows an error toast notification
 * @param message - The main message to display
 * @param options - Additional toast options
 * @returns Toast ID for programmatic dismissal
 */
function error(message: string, options?: ToastOptions): string | number {
  return sonnerToast.error(message, {
    ...formatOptions(options),
    duration: options?.duration ?? DURATIONS.TOAST_ERROR,
  });
}

/**
 * Shows a warning toast notification
 * @param message - The main message to display
 * @param options - Additional toast options
 * @returns Toast ID for programmatic dismissal
 */
function warning(message: string, options?: ToastOptions): string | number {
  return sonnerToast.warning(message, formatOptions(options));
}

/**
 * Shows an info toast notification
 * @param message - The main message to display
 * @param options - Additional toast options
 * @returns Toast ID for programmatic dismissal
 */
function info(message: string, options?: ToastOptions): string | number {
  return sonnerToast.info(message, formatOptions(options));
}

/**
 * Shows a loading toast that can be updated later
 * @param message - The main message to display
 * @param options - Additional toast options
 * @returns Toast ID for updating/dismissing
 */
function loading(message: string, options?: ToastOptions): string | number {
  return sonnerToast.loading(message, formatOptions(options));
}

/**
 * Shows a promise-based toast that updates based on promise state
 * @param promise - The promise to track
 * @param messages - Messages for loading, success, and error states
 * @param options - Additional toast options
 * @returns The result of the toast.promise call
 */
function promise<T>(
  promiseToTrack: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  },
  options?: ToastOptions
) {
  return sonnerToast.promise(promiseToTrack, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    ...formatOptions(options),
  });
}

/**
 * Dismisses a toast by ID or all toasts if no ID provided
 * @param toastId - Optional toast ID to dismiss
 */
function dismiss(toastId?: string | number): void {
  sonnerToast.dismiss(toastId);
}

/**
 * Shows a custom toast message (default variant)
 * @param message - The main message to display
 * @param options - Additional toast options
 * @returns Toast ID for programmatic dismissal
 */
function message(message: string, options?: ToastOptions): string | number {
  return sonnerToast(message, formatOptions(options));
}

/**
 * Formats options for sonner toast
 */
function formatOptions(options?: ToastOptions): ExternalToast | undefined {
  if (!options) return undefined;

  const { action, cancel, ...rest } = options;

  return {
    ...rest,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
    cancel: cancel
      ? {
          label: cancel.label,
          onClick: cancel.onClick ?? (() => {}),
        }
      : undefined,
  };
}

/**
 * Toast utility object for showing notifications
 *
 * @example
 * ```tsx
 * import { toast } from "@/lib/toast";
 *
 * // Simple usage
 * toast.success("Profile saved!");
 * toast.error("Something went wrong");
 * toast.warning("Session expires in 5 minutes");
 * toast.info("New version available");
 *
 * // With description
 * toast.success("Order placed", {
 *   description: "You will receive a confirmation email shortly"
 * });
 *
 * // With action button
 * toast.error("Failed to save", {
 *   action: {
 *     label: "Retry",
 *     onClick: () => saveProfile()
 *   }
 * });
 *
 * // Promise-based toast
 * toast.promise(saveData(), {
 *   loading: "Saving...",
 *   success: "Data saved!",
 *   error: "Failed to save"
 * });
 *
 * // Custom duration
 * toast.info("Quick message", { duration: 2000 });
 *
 * // Dismiss programmatically
 * const toastId = toast.loading("Processing...");
 * // later...
 * toast.dismiss(toastId);
 * ```
 */
export const toast = {
  success,
  error,
  warning,
  info,
  loading,
  promise,
  dismiss,
  message,
} as const;

// Re-export for direct usage
export { toast as showToast };
