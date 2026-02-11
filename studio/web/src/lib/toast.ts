import { toast as sonnerToast } from "sonner";

// =====================================================
// Toast Utility Helpers for Studio Admin
// =====================================================
//
// Convenience wrapper functions for consistent toast notifications
// across the Studio admin pages. These provide a simplified API
// for common use cases.
//
// Usage:
//   import { showSuccess, showError } from "@/lib/toast";
//   showSuccess("Order updated");
//   showError("Failed to load data", "Network error");
//
// For advanced usage (promise-based, custom options):
//   import { toast } from "@/lib/toast";
//   toast.promise(saveData(), { loading: "Saving...", success: "Saved!" });
// =====================================================

/** Default toast duration in milliseconds */
const DEFAULT_DURATION = 4000;

/** Error toast duration (longer to allow reading) */
const ERROR_DURATION = 6000;

/**
 * Shows a success toast notification
 * @param message - The success message to display
 * @param description - Optional additional details
 * @returns Toast ID for programmatic dismissal
 */
export const showSuccess = (message: string, description?: string): string | number =>
  sonnerToast.success(message, { description, duration: DEFAULT_DURATION });

/**
 * Shows an error toast notification
 * @param message - The error message to display
 * @param details - Optional additional details about the error
 * @returns Toast ID for programmatic dismissal
 */
export const showError = (message: string, details?: string): string | number =>
  sonnerToast.error(message, { description: details, duration: ERROR_DURATION });

/**
 * Shows a warning toast notification
 * @param message - The warning message to display
 * @param description - Optional additional details
 * @returns Toast ID for programmatic dismissal
 */
export const showWarning = (message: string, description?: string): string | number =>
  sonnerToast.warning(message, { description, duration: DEFAULT_DURATION });

/**
 * Shows an info toast notification
 * @param message - The informational message to display
 * @param description - Optional additional details
 * @returns Toast ID for programmatic dismissal
 */
export const showInfo = (message: string, description?: string): string | number =>
  sonnerToast.info(message, { description, duration: DEFAULT_DURATION });

/**
 * Shows a loading toast notification
 * @param message - The loading message to display
 * @returns Toast ID for dismissal/update
 */
export const showLoading = (message: string): string | number =>
  sonnerToast.loading(message);

/**
 * Dismisses a toast by ID, or all toasts if no ID provided
 * @param id - The toast ID to dismiss (optional)
 */
export const dismissToast = (id?: string | number): void => {
  sonnerToast.dismiss(id);
};

/**
 * Shows a promise-based toast that updates based on promise state
 * @param promise - The promise to track
 * @param messages - Messages for loading, success, and error states
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
): void {
  sonnerToast.promise(promise, messages);
}

// =====================================================
// Advanced Toast Object
// =====================================================
//
// For more control, use the toast object directly.
// This mirrors the core toast API for consistency.
// =====================================================

/**
 * Toast utility object for advanced usage
 *
 * @example
 * ```tsx
 * import { toast } from "@/lib/toast";
 *
 * // Promise-based toast
 * toast.promise(saveData(), {
 *   loading: "Saving...",
 *   success: "Data saved!",
 *   error: "Failed to save"
 * });
 *
 * // Custom toast with action
 * toast.error("Failed to save", {
 *   action: { label: "Retry", onClick: () => retry() }
 * });
 * ```
 */
export const toast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  dismiss: dismissToast,
  promise: showPromise,
  /** Raw sonner toast for custom notifications */
  message: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast(message, options),
} as const;

// =====================================================
// Core Toast Re-exports
// =====================================================
//
// Re-export the core toast module for components that need
// the full toast API with all options.
// =====================================================

export {
  toast as coreToast,
  type ToastOptions,
  type ToastVariant,
} from "@core/lib/toast";
