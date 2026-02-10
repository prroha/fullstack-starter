/**
 * Coupon-related types for the Studio platform.
 * Coupons provide discounts on purchases.
 */

/**
 * Type of discount a coupon provides.
 */
export type CouponType = "PERCENTAGE" | "FIXED";

/**
 * A coupon that can be applied to orders for discounts.
 */
export interface Coupon {
  /** Unique coupon identifier (CUID) */
  id: string;
  /** Unique coupon code (e.g., "SAVE20") */
  code: string;
  /** Type of discount */
  type: CouponType;
  /** Discount value (percentage 0-100 or fixed amount in cents) */
  value: number;
  /** Maximum number of uses (null = unlimited) */
  maxUses: number | null;
  /** Number of times this coupon has been used */
  usedCount: number;
  /** Minimum purchase amount required (in cents, null = no minimum) */
  minPurchase: number | null;
  /** Tiers this coupon applies to (empty = all tiers) */
  applicableTiers: string[];
  /** Templates this coupon applies to (empty = all templates) */
  applicableTemplates: string[];
  /** Start date for coupon validity */
  startsAt: string | null;
  /** Expiration date for coupon */
  expiresAt: string | null;
  /** Whether coupon is currently active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Orders that used this coupon */
  orders?: CouponOrder[];
  /** Total discount amount given by this coupon (computed) */
  totalDiscountGiven?: number;
}

/**
 * Order summary for coupon detail views.
 */
export interface CouponOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  total: number;
  discount: number;
  createdAt: string;
}

/**
 * Data required to create a new coupon.
 */
export interface CreateCouponData {
  /** Unique coupon code */
  code: string;
  /** Type of discount */
  type: CouponType;
  /** Discount value */
  value: number;
  /** Maximum uses (null = unlimited) */
  maxUses?: number | null;
  /** Minimum purchase amount (null = no minimum) */
  minPurchase?: number | null;
  /** Applicable tiers (empty = all) */
  applicableTiers?: string[];
  /** Applicable templates (empty = all) */
  applicableTemplates?: string[];
  /** Start date */
  startsAt?: string | null;
  /** Expiration date */
  expiresAt?: string | null;
  /** Whether coupon is active */
  isActive?: boolean;
}

/**
 * Data for updating an existing coupon.
 */
export interface UpdateCouponData extends Partial<CreateCouponData> {}

/**
 * Parameters for querying coupons with filtering and pagination.
 */
export interface GetCouponsParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Search by coupon code */
  search?: string;
  /** Filter by coupon type */
  type?: CouponType;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by validity (valid, expired, upcoming) */
  validity?: CouponValidity;
  /** Sort field */
  sortBy?: CouponSortField;
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Validity states for filtering coupons.
 */
export type CouponValidity = "valid" | "expired" | "upcoming" | "exhausted";

/**
 * Fields available for sorting coupons.
 */
export type CouponSortField =
  | "createdAt"
  | "code"
  | "usedCount"
  | "expiresAt"
  | "value";

/**
 * Coupon statistics for dashboard.
 */
export interface CouponStats {
  /** Total number of coupons */
  total: number;
  /** Number of active coupons */
  active: number;
  /** Number of expired coupons */
  expired: number;
  /** Total discount amount given (in cents) */
  totalDiscountGiven: number;
  /** Total number of uses across all coupons */
  totalUses: number;
}

/**
 * Result of validating a coupon code.
 */
export interface CouponValidation {
  /** Whether the coupon is valid */
  valid: boolean;
  /** Coupon details if valid */
  coupon?: Coupon;
  /** Error message if invalid */
  error?: string;
  /** Calculated discount amount (in cents) */
  discountAmount?: number;
}

/**
 * Input for validating a coupon.
 */
export interface ValidateCouponInput {
  /** Coupon code to validate */
  code: string;
  /** Order subtotal (in cents) */
  subtotal: number;
  /** Selected tier */
  tier: string;
  /** Selected template ID (optional) */
  templateId?: string;
}
