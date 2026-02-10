import { toast } from "sonner";

// =====================================================
// Toast Utility Helpers
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
// =====================================================

/**
 * Shows a success toast notification
 * @param message - The success message to display
 */
export const showSuccess = (message: string) => toast.success(message);

/**
 * Shows an error toast notification
 * @param message - The error message to display
 * @param details - Optional additional details about the error
 */
export const showError = (message: string, details?: string) =>
  toast.error(message, { description: details });

/**
 * Shows a warning toast notification
 * @param message - The warning message to display
 */
export const showWarning = (message: string) => toast.warning(message);

/**
 * Shows an info toast notification
 * @param message - The informational message to display
 */
export const showInfo = (message: string) => toast.info(message);

/**
 * Shows a loading toast notification
 * @param message - The loading message to display
 * @returns Toast ID for dismissal
 */
export const showLoading = (message: string) => toast.loading(message);

/**
 * Dismisses a toast by ID
 * @param id - The toast ID to dismiss
 */
export const dismissToast = (id: string | number) => toast.dismiss(id);

// Re-export toast and core utilities for advanced usage
export { toast } from "sonner";
export * from "@core/lib/toast";
