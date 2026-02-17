// =====================================================
// Studio Constants
// =====================================================
//
// This file contains all constants used in the Studio web app.
// It re-exports core constants and adds studio-specific constants.
//
// Usage:
//   import { API_CONFIG, PAGINATION, ORDER_STATUS } from "@/lib/constants";
// =====================================================

// Re-export all core constants for core components that depend on them
export {
  HTTP_STATUS,
  DURATIONS,
  PAGINATION as CORE_PAGINATION,
  VALIDATION,
  FILE_UPLOAD,
  ERROR_CODES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  API_ENDPOINTS,
  USER_ROLES,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
  CONTACT_MESSAGE_STATUS,
} from "@core/lib/constants";

// =====================================================
// Studio-Specific Constants
// =====================================================

/**
 * API Configuration for the Studio Admin Panel
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  TIMEOUT: 30000,
  RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_BACKOFF_MULTIPLIER: 2,
  REQUEST_ID_HEADER: "x-request-id",
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Order status values
 */
export const ORDER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;

/**
 * License status values
 */
export const LICENSE_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;

/**
 * Coupon types
 */
export const COUPON_TYPE = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
} as const;

/**
 * Setting types
 */
export const SETTING_TYPE = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  JSON: "json",
} as const;

/**
 * Analytics periods
 */
export const ANALYTICS_PERIOD = {
  SEVEN_DAYS: "7d",
  THIRTY_DAYS: "30d",
  NINETY_DAYS: "90d",
  ONE_YEAR: "1y",
} as const;

/**
 * Preview feature list for displaying in the preview panel
 * This should match the features available in the feature registry
 */
export const PREVIEW_FEATURES = [
  { slug: "auth.basic", name: "Basic Auth", category: "auth" },
  { slug: "auth.social", name: "Social Login", category: "auth" },
  { slug: "auth.mfa", name: "Two-Factor Auth", category: "auth" },
  { slug: "security.csrf", name: "CSRF Protection", category: "security" },
  { slug: "security.rateLimit", name: "Rate Limiting", category: "security" },
  { slug: "payments.oneTime", name: "One-Time Payments", category: "payments" },
  { slug: "payments.subscription", name: "Subscriptions", category: "payments" },
  { slug: "storage.upload", name: "File Uploads", category: "storage" },
  { slug: "storage.images", name: "Image Processing", category: "storage" },
  { slug: "comms.email", name: "Email", category: "comms" },
  { slug: "comms.push", name: "Push Notifications", category: "comms" },
  { slug: "ui.components", name: "UI Components", category: "ui" },
  { slug: "ui.dashboard", name: "Dashboard Layout", category: "ui" },
  { slug: "ui.admin", name: "Admin Panel", category: "ui" },
  { slug: "analytics.basic", name: "Basic Analytics", category: "analytics" },
  { slug: "analytics.dashboard", name: "Analytics Dashboard", category: "analytics" },
  { slug: "mobile.flutter", name: "Flutter App", category: "mobile" },
] as const;

export type PreviewFeature = (typeof PREVIEW_FEATURES)[number];

// =====================================================
// Filter Options for Admin Pages
// =====================================================

/**
 * Order status filter options for dropdowns
 */
export const ORDER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELLED", label: "Cancelled" },
];

/**
 * Tier filter options for dropdowns
 */
export const TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Tiers" },
  { value: "Starter", label: "Starter" },
  { value: "Pro", label: "Pro" },
  { value: "Business", label: "Business" },
  { value: "Enterprise", label: "Enterprise" },
];
