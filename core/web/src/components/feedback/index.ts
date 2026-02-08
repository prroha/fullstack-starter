// =====================================================
// Feedback Components (Molecules)
// =====================================================
//
// This module exports all feedback-related components:
// - Toast: Notification system (Sonner-based)
// - Alert: Block-level alert messages
// - Loading: Various loading state components
// - InlineFeedback: Lightweight inline status messages
// - LoadingWrapper: Async content loading wrapper
//
// Usage:
//   import { Alert, toast, Loading } from "@/components/feedback";
//   import { ErrorMessage, SuccessMessage } from "@/components/feedback";
//   import { LoadingWrapper, AsyncContent } from "@/components/feedback";
// =====================================================

// Toast (Sonner wrapper) - Container component
export { Toaster } from "./toast";
export type { ToasterProps } from "./toast";

// Toast utility functions (re-exported from lib/toast for convenience)
export { toast, showToast } from "@/lib/toast";
export type { ToastOptions, ToastVariant } from "@/lib/toast";

// Alert - Block-level feedback component
export { Alert } from "./alert";
export type { AlertProps } from "./alert";

// Loading components - Various loading state indicators
export {
  Loading,
  LoadingOverlay,
  LoadingCard,
  LoadingPage,
  LoadingButtonContent,
} from "./loading";
export type {
  LoadingProps,
  LoadingOverlayProps,
  LoadingCardProps,
  LoadingPageProps,
  LoadingButtonContentProps,
} from "./loading";

// Inline feedback - Lightweight status messages
export {
  InlineFeedback,
  SuccessMessage,
  ErrorMessage,
  WarningMessage,
  InfoMessage,
} from "./inline-feedback";
export type {
  InlineFeedbackProps,
  PresetFeedbackProps,
  FeedbackVariant,
} from "./inline-feedback";

// Loading wrapper - Async content loading pattern
export { LoadingWrapper, AsyncContent } from "./loading-wrapper";
export type { LoadingWrapperProps, AsyncContentProps } from "./loading-wrapper";
