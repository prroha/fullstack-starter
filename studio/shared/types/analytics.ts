/**
 * Analytics-related types for the Studio platform.
 * These types represent tracking events and aggregated analytics data.
 */

/**
 * Time period options for analytics queries.
 */
export type AnalyticsPeriod = "7d" | "30d" | "90d" | "1y" | "all";

/**
 * Revenue analytics broken down by various dimensions.
 */
export interface RevenueAnalytics {
  /** Revenue breakdown by pricing tier */
  byTier: TierRevenue[];
  /** Revenue breakdown by template */
  byTemplate: TemplateRevenue[];
  /** Daily revenue over the period */
  daily: DailyRevenue[];
  /** Total revenue for the period */
  totalRevenue?: number;
  /** Comparison to previous period */
  previousPeriod?: PeriodComparison;
}

/**
 * Revenue data for a single tier.
 */
export interface TierRevenue {
  tier: string;
  revenue: number;
  orderCount: number;
  averageOrderValue?: number;
}

/**
 * Revenue data for a single template.
 */
export interface TemplateRevenue {
  templateId: string | null;
  templateName: string;
  revenue: number;
  orderCount: number;
  averageOrderValue?: number;
}

/**
 * Revenue data for a single day.
 */
export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Comparison to a previous period.
 */
export interface PeriodComparison {
  revenue: number;
  revenueChange: number;
  revenueChangePercent: number;
  orders: number;
  ordersChange: number;
  ordersChangePercent: number;
}

/**
 * Conversion funnel analytics.
 */
export interface FunnelAnalytics {
  /** Funnel stages with counts */
  funnel: FunnelStage[];
  /** Overall conversion rate (string percentage) */
  conversionRate: string;
  /** Preview to checkout conversion rate */
  previewToCheckout: string;
  /** Checkout to purchase conversion rate */
  checkoutToPurchase: string;
}

/**
 * A single stage in the conversion funnel.
 */
export interface FunnelStage {
  /** Stage name (e.g., "page_view", "preview_start", "checkout_start", "purchase") */
  stage: string;
  /** Number of users at this stage */
  count: number;
  /** Percentage of users from previous stage */
  percentage: number;
}

/**
 * Detailed template performance statistics.
 */
export interface TemplateAnalytics {
  id: string;
  name: string;
  slug: string;
  price: number;
  revenue: number;
  orderCount: number;
  previewCount: number;
  conversionRate: string;
  averageOrderValue?: number;
}

/**
 * Revenue chart data point.
 */
export interface RevenueChartData {
  date: string;
  revenue: number;
  orders?: number;
}

/**
 * Simplified conversion funnel for dashboard.
 */
export interface ConversionFunnel {
  funnel: Array<{ stage: string; count: number }>;
  conversionRate: string;
}

/**
 * Raw analytics event stored in the database.
 */
export interface AnalyticsEvent {
  id: string;
  /** Event type (page_view, feature_toggle, preview_start, checkout_start, purchase, etc.) */
  event: string;
  /** Event category (navigation, configuration, conversion) */
  category: string | null;
  /** Session ID for grouping events */
  sessionId: string | null;
  /** User ID if logged in */
  userId: string | null;
  /** Event-specific data payload */
  data: Record<string, unknown> | null;
  /** Client IP address */
  ipAddress: string | null;
  /** Client user agent */
  userAgent: string | null;
  /** Referrer URL */
  referrer: string | null;
  /** Event timestamp */
  createdAt: string;
}

/**
 * Data for tracking a new analytics event.
 */
export interface TrackEventData {
  event: string;
  category?: string;
  sessionId?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

/**
 * Parameters for querying analytics events.
 */
export interface GetAnalyticsParams {
  /** Start date for the query */
  from?: string;
  /** End date for the query */
  to?: string;
  /** Filter by event type */
  event?: string;
  /** Filter by category */
  category?: string;
  /** Filter by session ID */
  sessionId?: string;
  /** Filter by user ID */
  userId?: string;
  /** Page number */
  page?: number;
  /** Items per page */
  limit?: number;
}

/**
 * Preview session tracking data.
 */
export interface PreviewSession {
  id: string;
  sessionId: string;
  tier: string | null;
  templateId: string | null;
  selectedFeatures: string[];
  userId: string | null;
  pageViews: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

/**
 * Dashboard statistics overview.
 */
export interface DashboardStats {
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    today: number;
    pending: number;
  };
  customers: {
    total: number;
    newToday: number;
  };
  templates: {
    active: number;
  };
  previews: {
    total: number;
    today: number;
  };
  recentOrders: import("./order").RecentOrder[];
  topTemplates: import("./template").TopTemplate[];
}

/**
 * Aggregate feature statistics.
 */
export interface FeatureAnalytics {
  /** Feature slug */
  slug: string;
  /** Feature name */
  name: string;
  /** Feature price */
  price: number;
  /** Number of times purchased */
  purchaseCount: number;
  /** Percentage of orders including this feature */
  percentage: number;
  /** Revenue generated */
  revenue?: number;
}
