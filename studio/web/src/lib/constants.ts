// =====================================================
// Studio Constants
// Re-export core constants + studio-specific constants
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

// Re-export role helpers from types
export { hasAdminAccess, isSuperAdmin } from "@core/types/api";

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
