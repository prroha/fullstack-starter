/**
 * Studio Shared Types
 *
 * This module exports all shared TypeScript types used across
 * the Studio web frontend and backend services.
 *
 * Usage:
 *   import { Order, OrderStatus, Customer } from '@studio/shared';
 *   // or
 *   import type { Order } from '@studio/shared/order';
 */

// =====================================================
// Common Types
// =====================================================

/**
 * Standard pagination information returned with list responses.
 */
export interface PaginationInfo {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Success message (optional) */
  message?: string;
  /** Error details (present on failure) */
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Paginated response containing a list of items.
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Pagination metadata */
  pagination: PaginationInfo;
}

/**
 * Sort direction for list queries.
 */
export type SortOrder = "asc" | "desc";

/**
 * Base entity with common timestamp fields.
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Order Types
// =====================================================

export type {
  OrderStatus,
  Order,
  RecentOrder,
  OrderStats,
  GetOrdersParams,
  ExportOrdersParams,
  CreateOrderData,
  UpdateOrderData,
} from "./order";

// =====================================================
// Template Types
// =====================================================

export type {
  Template,
  TemplateStats,
  TopTemplate,
  CreateTemplateData,
  UpdateTemplateData,
  GetTemplatesParams,
  ReorderTemplateItem,
} from "./template";

// =====================================================
// Feature & Module Types
// =====================================================

export type {
  Module,
  FeatureSummary,
  Feature,
  FileMappingConfig,
  SchemaMappingConfig,
  EnvVarConfig,
  NpmPackageConfig,
  CreateModuleData,
  UpdateModuleData,
  GetModulesParams,
  CreateFeatureData,
  UpdateFeatureData,
  GetFeaturesParams,
  BulkUpdatePriceItem,
  FeatureStats,
  ModuleCategory,
} from "./feature";

// =====================================================
// Customer Types
// =====================================================

export type {
  Customer,
  CustomerOrder,
  GetCustomersParams,
  CustomerSortField,
  CustomerStats,
  BlockCustomerData,
  CustomerSession,
  CreateCustomerData,
  UpdateCustomerData,
} from "./customer";

// =====================================================
// License Types
// =====================================================

export type {
  LicenseStatus,
  License,
  LicenseOrderInfo,
  GetLicensesParams,
  LicenseSortField,
  LicenseStats,
  ExtendLicenseData,
  RevokeLicenseData,
  CreateLicenseData,
  RegenerateTokenResponse,
  DownloadVerification,
} from "./license";

// =====================================================
// Coupon Types
// =====================================================

export type {
  CouponType,
  Coupon,
  CouponOrder,
  CreateCouponData,
  UpdateCouponData,
  GetCouponsParams,
  CouponValidity,
  CouponSortField,
  CouponStats,
  CouponValidation,
  ValidateCouponInput,
} from "./coupon";

// =====================================================
// Analytics Types
// =====================================================

export type {
  AnalyticsPeriod,
  RevenueAnalytics,
  TierRevenue,
  TemplateRevenue,
  DailyRevenue,
  PeriodComparison,
  FunnelAnalytics,
  FunnelStage,
  TemplateAnalytics,
  RevenueChartData,
  ConversionFunnel,
  AnalyticsEvent,
  TrackEventData,
  GetAnalyticsParams,
  PreviewSession,
  DashboardStats,
  FeatureAnalytics,
} from "./analytics";

// =====================================================
// Settings Types
// =====================================================

export type {
  SettingType,
  Setting,
  ParsedSetting,
  CreateSettingData,
  UpdateSettingData,
  GetSettingsParams,
  SettingSortField,
  BulkSettingUpdate,
  CommonSettingKey,
  SettingValue,
  SettingAuditEntry,
} from "./settings";

// =====================================================
// Pricing Types
// =====================================================

export type {
  PricingTierSlug,
  PricingTier,
  TierConfig,
  CreatePricingTierData,
  UpdatePricingTierData,
  GetPricingTiersParams,
  BundleDiscount,
  PriceCalculation,
  AppliedDiscount,
  PriceCalculationInput,
  TierComparison,
  TierFeatureStatus,
  VolumeDiscount,
  PricingSummary,
} from "./pricing";
