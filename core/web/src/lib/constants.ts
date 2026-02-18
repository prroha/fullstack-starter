// =====================================================
// Application Constants
// =====================================================
// Centralized constants for the web application.
// Import from @/lib/constants to use these values.
// =====================================================

// =====================================================
// API Configuration
// =====================================================

export const API_CONFIG = {
  /** Base URL for API requests (includes version) */
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",

  /** API version prefix (for reference) */
  VERSION: "v1",

  /** Request timeout in milliseconds (30 seconds) */
  TIMEOUT: 30000,

  /** Number of retry attempts for failed requests */
  RETRIES: 3,

  /** Initial retry delay in milliseconds (1 second) */
  RETRY_DELAY: 1000,

  /** Multiplier for exponential backoff */
  RETRY_BACKOFF_MULTIPLIER: 2,

  /** Request ID header name for correlation */
  REQUEST_ID_HEADER: "x-request-id",
} as const;

// =====================================================
// Pagination
// =====================================================

export const PAGINATION = {
  /** Default page size for lists */
  DEFAULT_PAGE_SIZE: 10,

  /** Page size for notifications list */
  NOTIFICATIONS_PAGE_SIZE: 20,

  /** Page size for admin users list */
  ADMIN_USERS_PAGE_SIZE: 10,

  /** Page size for admin messages list */
  ADMIN_MESSAGES_PAGE_SIZE: 10,

  /** Page size for audit logs */
  AUDIT_LOGS_PAGE_SIZE: 20,

  /** Limit for search results in dropdown */
  SEARCH_DROPDOWN_LIMIT: 5,

  /** Limit for notification dropdown preview */
  NOTIFICATION_DROPDOWN_LIMIT: 10,
} as const;

// =====================================================
// Timeouts & Durations
// =====================================================

export const DURATIONS = {
  /** Default toast duration in milliseconds */
  TOAST_DEFAULT: 4000,

  /** Error toast duration in milliseconds */
  TOAST_ERROR: 6000,

  /** Success indicator display time */
  SUCCESS_INDICATOR: 2000,

  /** Debounce delay for search input in milliseconds */
  SEARCH_DEBOUNCE: 300,

  /** Logger flush interval in milliseconds */
  LOGGER_FLUSH_INTERVAL: 5000,

  /** Redirect delay after form submission */
  REDIRECT_DELAY: 2000,
} as const;

// =====================================================
// Validation Rules
// =====================================================

export const VALIDATION = {
  /** Minimum password length */
  PASSWORD_MIN_LENGTH: 8,

  /** Maximum password length */
  PASSWORD_MAX_LENGTH: 128,

  /** Minimum name length */
  NAME_MIN_LENGTH: 2,

  /** Maximum name length */
  NAME_MAX_LENGTH: 100,

  /** Maximum bio length */
  BIO_MAX_LENGTH: 500,

  /** Email regex pattern */
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /** Password complexity pattern (at least one uppercase, lowercase, and number) */
  PASSWORD_COMPLEXITY_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,

  /** Name allowed characters pattern */
  NAME_PATTERN: /^[a-zA-Z\s'-]+$/,

  /** Phone number pattern */
  PHONE_PATTERN: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
} as const;

// =====================================================
// File Upload
// =====================================================

export const FILE_UPLOAD = {
  /** Maximum avatar file size in bytes (5 MB) */
  MAX_AVATAR_SIZE: 5 * 1024 * 1024,

  /** Maximum general file size in bytes (10 MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Allowed image types for avatars */
  ALLOWED_AVATAR_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],

  /** Allowed image extensions */
  ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
} as const;

// =====================================================
// HTTP Status Codes
// =====================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// =====================================================
// Error Codes
// =====================================================

export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // Auth errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  CONTACT_RATE_LIMIT_EXCEEDED: "CONTACT_RATE_LIMIT_EXCEEDED",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",

  // Server errors
  SERVER_ERROR: "SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

// =====================================================
// Error Messages
// =====================================================

export const ERROR_MESSAGES = {
  // Network
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
  NETWORK_ERROR_GENERIC: "Network error occurred. Please check your connection and try again.",
  CORS_ERROR: "Cross-origin request blocked. Please contact support.",
  REQUEST_TIMEOUT: "Request timed out",
  REQUEST_CANCELLED: "Request was cancelled.",
  UNEXPECTED_NETWORK_ERROR: "An unexpected network error occurred.",

  // Auth
  LOGIN_FAILED: "Login failed: Invalid credentials",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",

  // Form validation
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters",
  PASSWORD_COMPLEXITY: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  PASSWORD_MISMATCH: "Passwords do not match",
  PASSWORD_SAME_AS_CURRENT: "New password must be different from current password",
  NAME_REQUIRED: "Name is required",
  NAME_MIN_LENGTH: "Name must be at least 2 characters",
  NAME_MAX_LENGTH: "Name must be less than 100 characters",
  NAME_INVALID_CHARS: "Name can only contain letters, spaces, hyphens, and apostrophes",
  CONFIRM_PASSWORD_REQUIRED: "Please confirm your password",
  CURRENT_PASSWORD_REQUIRED: "Current password is required",
  CONFIRM_NEW_PASSWORD_REQUIRED: "Please confirm your new password",

  // Generic
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again.",
  TRY_AGAIN_LATER: "Please try again later.",
  SERVER_ERROR: "Server error occurred. Please try again later.",
} as const;

// =====================================================
// Success Messages
// =====================================================

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  AVATAR_UPLOADED: "Avatar uploaded successfully",
  AVATAR_DELETED: "Avatar removed successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  EMAIL_SENT: "Email sent successfully",
  EMAIL_VERIFIED: "Email verified successfully",
  NOTIFICATION_MARKED_READ: "Notification marked as read",
  ALL_NOTIFICATIONS_READ: "All notifications marked as read",
  NOTIFICATION_DELETED: "Notification deleted",
  ALL_NOTIFICATIONS_DELETED: "All notifications deleted",
  SESSION_REVOKED: "Session revoked successfully",
  SESSIONS_REVOKED: "All other sessions revoked",
} as const;

// =====================================================
// Route Paths (Web)
// =====================================================

export const ROUTES = {
  // Public
  HOME: "/",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  CONTACT: "/contact",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",

  // Protected
  PROFILE: "/profile",
  NOTIFICATIONS: "/notifications",
  SEARCH: "/search",

  // Settings
  SETTINGS: "/settings",
  CHANGE_PASSWORD: "/settings/change-password",
  SESSIONS: "/settings/sessions",

  // Admin
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",
  ADMIN_MESSAGES: "/admin/messages",

  // Dashboard
  DASHBOARD: "/dashboard",
  DASHBOARD_PROFILE: "/dashboard/profile",
  DASHBOARD_SETTINGS: "/dashboard/settings",
  DASHBOARD_NOTIFICATIONS: "/dashboard/notifications",
} as const;

// =====================================================
// User Roles - Derived from API types (single source of truth)
// =====================================================

// To modify roles, update the OpenAPI schema in backend/src/swagger.ts
// Then run: npm run types:sync

// Re-export helpers from api types
export { hasAdminAccess, isSuperAdmin } from "@/types/api";

// Object form for backward compatibility (used for type derivation)
export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

// =====================================================
// Notification Types
// =====================================================

export const NOTIFICATION_TYPES = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  ERROR: "ERROR",
  SYSTEM: "SYSTEM",
} as const;

// =====================================================
// Audit Actions
// =====================================================

export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET: "PASSWORD_RESET",
  EMAIL_VERIFY: "EMAIL_VERIFY",
  ADMIN_ACTION: "ADMIN_ACTION",
} as const;

// =====================================================
// Contact Message Status
// =====================================================

export const CONTACT_MESSAGE_STATUS = {
  PENDING: "PENDING",
  READ: "READ",
  REPLIED: "REPLIED",
} as const;
