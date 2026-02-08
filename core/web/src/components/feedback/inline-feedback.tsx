"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Inline Feedback Types
// =====================================================

type FeedbackVariant = "success" | "error" | "warning" | "info";

interface InlineFeedbackProps {
  /** The feedback variant determines styling */
  variant: FeedbackVariant;
  /** The message to display */
  message: string;
  /** Optional icon to override default */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the feedback */
  show?: boolean;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
}

// =====================================================
// Variant Configurations
// =====================================================

const variantStyles: Record<FeedbackVariant, { container: string; icon: string }> = {
  success: {
    container: "text-green-700 dark:text-green-400",
    icon: "text-green-600 dark:text-green-400",
  },
  error: {
    container: "text-destructive",
    icon: "text-destructive",
  },
  warning: {
    container: "text-yellow-700 dark:text-yellow-400",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  info: {
    container: "text-blue-700 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
  },
};

// =====================================================
// Icon Components
// =====================================================

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}

const defaultIcons: Record<FeedbackVariant, React.ReactNode> = {
  success: <SuccessIcon className="h-4 w-4" />,
  error: <ErrorIcon className="h-4 w-4" />,
  warning: <WarningIcon className="h-4 w-4" />,
  info: <InfoIcon className="h-4 w-4" />,
};

// =====================================================
// InlineFeedback Component
// =====================================================

/**
 * Inline feedback component for displaying status messages.
 * Lighter weight than Alert, suitable for form field feedback or inline notifications.
 *
 * @example
 * ```tsx
 * <InlineFeedback variant="success" message="Changes saved successfully" />
 * <InlineFeedback variant="error" message="Failed to save changes" />
 * ```
 */
function InlineFeedback({
  variant,
  message,
  icon,
  className,
  show = true,
  onDismiss,
}: InlineFeedbackProps) {
  if (!show || !message) {
    return null;
  }

  const styles = variantStyles[variant];
  const displayIcon = icon ?? defaultIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2 text-sm font-medium",
        styles.container,
        className
      )}
    >
      <span className={cn("flex-shrink-0", styles.icon)}>{displayIcon}</span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// =====================================================
// Preset Feedback Components
// =====================================================

interface PresetFeedbackProps {
  /** The message to display */
  message: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the feedback */
  show?: boolean;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
}

/**
 * Success message component - green text with check icon.
 * Use for successful form submissions, save confirmations, etc.
 *
 * @example
 * ```tsx
 * <SuccessMessage message="Profile updated successfully" show={isSuccess} />
 * ```
 */
function SuccessMessage({ message, className, show = true, onDismiss }: PresetFeedbackProps) {
  return (
    <InlineFeedback
      variant="success"
      message={message}
      className={className}
      show={show}
      onDismiss={onDismiss}
    />
  );
}

/**
 * Error message component - red text with error icon.
 * Use for form validation errors, API errors, etc.
 *
 * @example
 * ```tsx
 * <ErrorMessage message="Failed to save changes" show={!!error} />
 * ```
 */
function ErrorMessage({ message, className, show = true, onDismiss }: PresetFeedbackProps) {
  return (
    <InlineFeedback
      variant="error"
      message={message}
      className={className}
      show={show}
      onDismiss={onDismiss}
    />
  );
}

/**
 * Warning message component - yellow/amber text with warning icon.
 * Use for non-blocking warnings, deprecation notices, etc.
 *
 * @example
 * ```tsx
 * <WarningMessage message="Session expires in 5 minutes" show={isSessionExpiring} />
 * ```
 */
function WarningMessage({ message, className, show = true, onDismiss }: PresetFeedbackProps) {
  return (
    <InlineFeedback
      variant="warning"
      message={message}
      className={className}
      show={show}
      onDismiss={onDismiss}
    />
  );
}

/**
 * Info message component - blue text with info icon.
 * Use for helpful hints, tips, or neutral information.
 *
 * @example
 * ```tsx
 * <InfoMessage message="Tip: You can drag and drop files here" />
 * ```
 */
function InfoMessage({ message, className, show = true, onDismiss }: PresetFeedbackProps) {
  return (
    <InlineFeedback
      variant="info"
      message={message}
      className={className}
      show={show}
      onDismiss={onDismiss}
    />
  );
}

// =====================================================
// Exports
// =====================================================

export {
  InlineFeedback,
  SuccessMessage,
  ErrorMessage,
  WarningMessage,
  InfoMessage,
};

export type { InlineFeedbackProps, PresetFeedbackProps, FeedbackVariant };
