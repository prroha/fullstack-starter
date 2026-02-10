/**
 * Customer-related types for the Studio platform.
 * Customers are users who purchase templates and features.
 */

import type { OrderStatus } from "./order";

/**
 * A customer (platform user) who can purchase products.
 */
export interface Customer {
  /** Unique customer identifier (CUID) */
  id: string;
  /** Customer's email address */
  email: string;
  /** Customer's display name */
  name: string | null;
  /** URL to customer's avatar image */
  avatarUrl: string | null;
  /** Whether email has been verified */
  emailVerified: boolean;
  /** Whether customer account is blocked */
  isBlocked: boolean;
  /** Account creation timestamp */
  createdAt: string;
  /** Last login timestamp */
  lastLoginAt: string | null;
  /** Total number of orders placed */
  orderCount: number;
  /** Total amount spent (in cents) */
  totalSpent: number;
  /** List of customer's orders */
  orders?: CustomerOrder[];
}

/**
 * Order summary for customer detail views.
 */
export interface CustomerOrder {
  id: string;
  orderNumber: string;
  tier: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  template: { name: string } | null;
  license: { status: string; downloadCount: number } | null;
}

/**
 * Parameters for querying customers with filtering and pagination.
 */
export interface GetCustomersParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Search by email or name */
  search?: string;
  /** Filter by blocked status */
  isBlocked?: boolean;
  /** Sort field */
  sortBy?: CustomerSortField;
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Fields available for sorting customers.
 */
export type CustomerSortField =
  | "createdAt"
  | "lastLoginAt"
  | "email"
  | "name"
  | "orderCount"
  | "totalSpent";

/**
 * Customer statistics for dashboard.
 */
export interface CustomerStats {
  /** Total number of customers */
  total: number;
  /** New customers today */
  newToday: number;
  /** New customers this week */
  newThisWeek: number;
  /** New customers this month */
  newThisMonth: number;
  /** Number of blocked customers */
  blocked: number;
  /** Number of verified customers */
  verified: number;
}

/**
 * Data for blocking a customer.
 */
export interface BlockCustomerData {
  /** Whether to block or unblock */
  isBlocked: boolean;
  /** Reason for blocking (required when blocking) */
  reason?: string;
}

/**
 * Customer session information.
 */
export interface CustomerSession {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  createdAt: string;
}

/**
 * Data for creating a new customer.
 */
export interface CreateCustomerData {
  email: string;
  password?: string;
  name?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
}

/**
 * Data for updating an existing customer.
 */
export interface UpdateCustomerData {
  name?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  isBlocked?: boolean;
}
