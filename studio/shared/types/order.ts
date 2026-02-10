/**
 * Order-related types for the Studio platform.
 * These types represent customer purchases and order management.
 */

/**
 * Status of an order in the system.
 */
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

/**
 * A complete order record including all relationships.
 */
export interface Order {
  /** Unique order identifier (CUID) */
  id: string;
  /** Human-readable order number (e.g., ORD-2024-001) */
  orderNumber: string;
  /** User ID of the customer (optional for guest checkouts) */
  userId: string | null;
  /** Customer's email address */
  customerEmail: string;
  /** Customer's display name */
  customerName: string | null;
  /** Pricing tier selected (basic, starter, pro, business, enterprise) */
  tier: string;
  /** Template ID if a pre-configured bundle was selected */
  templateId?: string | null;
  /** Array of feature IDs/slugs selected */
  selectedFeatures: string[];
  /** Subtotal before discounts and tax (in cents) */
  subtotal?: number;
  /** Discount amount applied (in cents) */
  discount: number;
  /** Tax amount (in cents) */
  tax?: number;
  /** Final total amount (in cents) */
  total: number;
  /** Currency code (e.g., "usd") */
  currency?: string;
  /** Coupon ID if one was applied */
  couponId?: string | null;
  /** Coupon code string if one was applied */
  couponCode?: string | null;
  /** Current order status */
  status: OrderStatus;
  /** Payment provider used (stripe, razorpay, etc.) */
  paymentMethod?: string | null;
  /** External payment ID from provider */
  paymentId?: string | null;
  /** Timestamp when payment was received */
  paidAt: string | null;
  /** Order creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Associated template info */
  template: { name: string; slug: string } | null;
  /** Associated coupon info */
  coupon: { code: string } | null;
  /** Associated license info */
  license: { id: string; status: string; downloadCount: number } | null;
  /** Associated user info */
  user?: { id: string; email: string; name: string | null; createdAt: string };
}

/**
 * Summary of a recent order for dashboard display.
 */
export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  tier: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  template: { name: string } | null;
}

/**
 * Aggregate statistics about orders.
 */
export interface OrderStats {
  /** Total number of orders */
  total: number;
  /** Number of completed orders */
  completed: number;
  /** Number of pending orders */
  pending: number;
  /** Number of refunded orders */
  refunded: number;
  /** Total revenue from orders (in cents) */
  revenue: number;
  /** Average order value (in cents) */
  averageOrderValue: number;
}

/**
 * Parameters for querying orders with filtering and pagination.
 */
export interface GetOrdersParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Filter by order status */
  status?: OrderStatus;
  /** Filter by pricing tier */
  tier?: string;
  /** Search by order number, email, or name */
  search?: string;
  /** Filter orders created after this date */
  from?: string;
  /** Filter orders created before this date */
  to?: string;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Parameters for exporting orders to CSV.
 */
export interface ExportOrdersParams {
  status?: OrderStatus;
  tier?: string;
  from?: string;
  to?: string;
}

/**
 * Data required to create a new order.
 */
export interface CreateOrderData {
  /** User ID of the customer */
  userId?: string;
  /** Customer email */
  customerEmail: string;
  /** Customer name */
  customerName?: string;
  /** Selected pricing tier */
  tier: string;
  /** Template ID if using a pre-configured bundle */
  templateId?: string;
  /** Array of selected feature IDs */
  selectedFeatures: string[];
  /** Coupon code to apply */
  couponCode?: string;
  /** Payment method */
  paymentMethod?: string;
}

/**
 * Data for updating an existing order.
 */
export interface UpdateOrderData {
  status?: OrderStatus;
  paymentId?: string;
  paidAt?: string;
}
