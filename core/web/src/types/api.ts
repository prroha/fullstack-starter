/**
 * API Types - Re-exports from generated OpenAPI types
 *
 * This file provides convenient access to API types generated from the OpenAPI spec.
 * When adding new API endpoints or models, run `npm run types:sync` to regenerate.
 *
 * Usage:
 *   import { UserRole, User, AdminUser } from '@/types/api';
 */

import type { components, paths } from "./api-generated";

// =====================================================
// SCHEMA TYPES - Generated from OpenAPI spec
// =====================================================

// Enums - Single source of truth
export type UserRole = components["schemas"]["UserRole"];
export type ContactMessageStatus = components["schemas"]["ContactMessageStatus"];
export type NotificationType = components["schemas"]["NotificationType"];
export type AnnouncementType = components["schemas"]["AnnouncementType"];
export type DiscountType = components["schemas"]["DiscountType"];
export type OrderStatus = components["schemas"]["OrderStatus"];
export type PaymentMethod = components["schemas"]["PaymentMethod"];
export type AuditAction = components["schemas"]["AuditAction"];
export type SettingType = components["schemas"]["SettingType"];

// Models - Generated from OpenAPI schemas
export type User = components["schemas"]["User"];
export type AdminUser = components["schemas"]["AdminUser"];
export type Session = components["schemas"]["Session"];
export type ContactMessage = components["schemas"]["ContactMessage"];
export type Notification = components["schemas"]["Notification"];
export type FaqCategory = components["schemas"]["FaqCategory"];
export type Faq = components["schemas"]["Faq"];
export type Announcement = components["schemas"]["Announcement"];
export type ContentPage = components["schemas"]["ContentPage"];
export type Setting = components["schemas"]["Setting"];
export type Coupon = components["schemas"]["Coupon"];
export type OrderItem = components["schemas"]["OrderItem"];
export type Order = components["schemas"]["Order"];
export type AuditLog = components["schemas"]["AuditLog"];

// Common response types from OpenAPI
export type PaginationInfo = components["schemas"]["PaginationInfo"];
export type ApiError = components["schemas"]["Error"];
export type SuccessResponse = components["schemas"]["SuccessResponse"];
export type AuthResponseData = components["schemas"]["AuthResponse"];
export type AdminStats = components["schemas"]["AdminStats"];

// =====================================================
// ENUM VALUE ARRAYS - For dropdowns, validation, etc.
// =====================================================

export const USER_ROLES: readonly UserRole[] = ["USER", "ADMIN", "SUPER_ADMIN"] as const;
export const CONTACT_MESSAGE_STATUSES: readonly ContactMessageStatus[] = ["PENDING", "READ", "REPLIED"] as const;
export const NOTIFICATION_TYPES: readonly NotificationType[] = ["INFO", "SUCCESS", "WARNING", "ERROR", "SYSTEM"] as const;
export const ANNOUNCEMENT_TYPES: readonly AnnouncementType[] = ["INFO", "WARNING", "SUCCESS", "PROMO"] as const;
export const DISCOUNT_TYPES: readonly DiscountType[] = ["PERCENTAGE", "FIXED"] as const;
export const ORDER_STATUSES: readonly OrderStatus[] = ["PENDING", "COMPLETED", "REFUNDED", "FAILED"] as const;
export const PAYMENT_METHODS: readonly PaymentMethod[] = ["STRIPE", "PAYPAL", "MANUAL"] as const;
export const AUDIT_ACTIONS: readonly AuditAction[] = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "PASSWORD_CHANGE",
  "PASSWORD_RESET",
  "EMAIL_VERIFY",
  "ADMIN_ACTION",
] as const;
export const SETTING_TYPES: readonly SettingType[] = ["STRING", "NUMBER", "BOOLEAN", "JSON"] as const;

// =====================================================
// ROLE HELPERS
// =====================================================

/**
 * Check if a role has admin access (ADMIN or SUPER_ADMIN)
 */
export function hasAdminAccess(role: UserRole | string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Check if a role is super admin
 */
export function isSuperAdmin(role: UserRole | string | null | undefined): boolean {
  return role === "SUPER_ADMIN";
}

// =====================================================
// CUSTOM TYPES - Extended from generated types
// =====================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sort query parameters
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Search query parameters
 */
export interface SearchParams {
  search?: string;
  q?: string;
}

/**
 * Date range filter parameters
 */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Combined list query parameters
 */
export interface ListQueryParams extends PaginationParams, SortParams, SearchParams {}

/**
 * Auth response with tokens (for login/register)
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Verify reset token response
 */
export interface VerifyResetTokenResponse {
  valid: boolean;
  email?: string;
}

/**
 * Verify email response
 */
export interface VerifyEmailResponse {
  verified: boolean;
  email: string;
}

/**
 * Search response type
 */
export interface SearchResponse {
  results: {
    users?: Array<{
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      isActive: boolean;
      createdAt: string;
    }>;
    query: string;
    totalResults: number;
  };
}

/**
 * Export format options
 */
export type ExportFormat = "json" | "csv";

// =====================================================
// PATH TYPES (for advanced type-safe API calls)
// =====================================================

export type { paths, components };
