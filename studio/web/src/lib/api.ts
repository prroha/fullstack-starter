"use client";

// Re-export core API client for core components that depend on it
export { api } from "@core/lib/api";
// Re-export and import ApiError from core for both internal use and external re-export
import { ApiError } from "@core/lib/api";
export { ApiError };

import { API_CONFIG, HTTP_STATUS } from "./constants";

// =====================================================
// Type Definitions
// =====================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// =====================================================
// Dashboard Types
// =====================================================

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
  recentOrders: RecentOrder[];
  topTemplates: TopTemplate[];
}

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

export interface TopTemplate {
  templateId: string | null;
  _count: { id: number };
  _sum: { total: number | null };
}

export interface RevenueChartData {
  date: string;
  revenue: number;
}

export interface ConversionFunnel {
  funnel: Array<{ stage: string; count: number }>;
  conversionRate: string;
}

// =====================================================
// Order Types
// =====================================================

export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerEmail: string;
  customerName: string | null;
  tier: string;
  total: number;
  discount: number;
  status: OrderStatus;
  selectedFeatures: string[];
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  stripePaymentIntentId?: string | null;
  template: { name: string; slug: string } | null;
  coupon: { code: string } | null;
  license: { id: string; status: string; downloadCount: number } | null;
  user?: { id: string; email: string; name: string | null; createdAt: string };
}

export interface OrderStats {
  total: number;
  completed: number;
  pending: number;
  refunded: number;
  revenue: number;
  averageOrderValue: number;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  tier?: string;
  search?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ExportOrdersParams {
  status?: OrderStatus;
  tier?: string;
  from?: string;
  to?: string;
}

// =====================================================
// Template Types
// =====================================================

export interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  tier: string;
  includedFeatures: string[];
  previewImageUrl?: string;
  previewUrl?: string;
  iconName?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  orderCount?: number;
  stats?: {
    totalOrders: number;
    totalRevenue: number;
  };
}

export interface CreateTemplateData {
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  tier: string;
  includedFeatures: string[];
  previewImageUrl?: string;
  previewUrl?: string;
  iconName?: string;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

export interface GetTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

// =====================================================
// Module Types
// =====================================================

export interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  iconName?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  features?: FeatureSummary[];
}

export interface FeatureSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  isActive: boolean;
}

export interface CreateModuleData {
  slug: string;
  name: string;
  description: string;
  category: string;
  iconName?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateModuleData extends Partial<CreateModuleData> {}

export interface GetModulesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

// =====================================================
// Feature Types
// =====================================================

export interface Feature {
  id: string;
  slug: string;
  name: string;
  description: string;
  moduleId: string;
  price: number;
  tier: string | null;
  requires: string[];
  conflicts: string[];
  fileMappings?: unknown;
  schemaMappings?: unknown;
  envVars?: unknown;
  npmPackages?: unknown;
  iconName?: string;
  displayOrder: number;
  isActive: boolean;
  isNew: boolean;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
  module?: {
    id: string;
    name: string;
    slug: string;
    category: string;
  };
}

export interface CreateFeatureData {
  slug: string;
  name: string;
  description: string;
  moduleId: string;
  price?: number;
  tier?: string | null;
  requires?: string[];
  conflicts?: string[];
  fileMappings?: unknown;
  schemaMappings?: unknown;
  envVars?: unknown;
  npmPackages?: unknown;
  iconName?: string;
  displayOrder?: number;
  isActive?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
}

export interface UpdateFeatureData extends Partial<CreateFeatureData> {}

export interface GetFeaturesParams {
  page?: number;
  limit?: number;
  search?: string;
  moduleId?: string;
  tier?: string;
  isActive?: boolean;
}

export interface BulkUpdatePriceItem {
  id: string;
  price: number;
}

// =====================================================
// Customer Types
// =====================================================

export interface Customer {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: number;
  totalSpent: number;
  orders?: CustomerOrder[];
}

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

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  isBlocked?: boolean;
}

// =====================================================
// License Types
// =====================================================

export type LicenseStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export interface License {
  id: string;
  orderId: string;
  licenseKey: string;
  downloadToken: string | null;
  downloadCount: number;
  maxDownloads: number | null;
  status: LicenseStatus;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
  order?: {
    orderNumber: string;
    customerEmail: string;
    customerName: string | null;
    tier: string;
    template: { name: string } | null;
    user?: { id: string; email: string; name: string | null };
  };
}

export interface GetLicensesParams {
  page?: number;
  limit?: number;
  status?: LicenseStatus;
  search?: string;
}

// =====================================================
// Coupon Types
// =====================================================

export type CouponType = "PERCENTAGE" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  maxUses: number | null;
  usedCount: number;
  minPurchase: number | null;
  applicableTiers: string[];
  applicableTemplates: string[];
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orders?: CouponOrder[];
  totalDiscountGiven?: number;
}

export interface CouponOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  total: number;
  discount: number;
  createdAt: string;
}

export interface CreateCouponData {
  code: string;
  type: CouponType;
  value: number;
  maxUses?: number | null;
  minPurchase?: number | null;
  applicableTiers?: string[];
  applicableTemplates?: string[];
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {}

export interface GetCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: CouponType;
  isActive?: boolean;
}

// =====================================================
// Analytics Types
// =====================================================

export interface RevenueAnalytics {
  byTier: Array<{
    tier: string;
    revenue: number;
    orderCount: number;
  }>;
  byTemplate: Array<{
    templateId: string | null;
    templateName: string;
    revenue: number;
    orderCount: number;
  }>;
  daily: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface FeatureStats {
  slug: string;
  name: string;
  price: number;
  purchaseCount: number;
  percentage: number;
}

export interface FunnelAnalytics {
  funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  conversionRate: string;
  previewToCheckout: string;
  checkoutToPurchase: string;
}

export interface TemplateStats {
  id: string;
  name: string;
  slug: string;
  price: number;
  revenue: number;
  orderCount: number;
  previewCount: number;
  conversionRate: string;
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "1y";

// =====================================================
// Settings Types
// =====================================================

export type SettingType = "string" | "number" | "boolean" | "json";

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingData {
  key: string;
  value: string;
  type?: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSettingData extends Partial<CreateSettingData> {}

export interface GetSettingsParams {
  page?: number;
  limit?: number;
  search?: string;
  isPublic?: boolean;
}

// =====================================================
// Pricing Types
// =====================================================

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface PricingTier {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  includedFeatures: string[];
  isPopular: boolean;
  displayOrder: number;
  color: string | null;
  isActive: boolean;
  stats?: {
    totalOrders: number;
    totalRevenue: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePricingTierData {
  name?: string;
  description?: string;
  price?: number;
  includedFeatures?: string[];
  isPopular?: boolean;
  color?: string | null;
  isActive?: boolean;
}

export interface BundleDiscount {
  id: string;
  name: string;
  description: string | null;
  type: DiscountType;
  value: number;
  minItems: number;
  applicableTiers: string[];
  applicableFeatures: string[];
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBundleDiscountData {
  name: string;
  description?: string | null;
  type: DiscountType;
  value: number;
  minItems: number;
  applicableTiers?: string[];
  applicableFeatures?: string[];
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export interface UpdateBundleDiscountData extends Partial<CreateBundleDiscountData> {}

// Note: ApiError is re-exported from @core/lib/api at the top of this file

// =====================================================
// Helper Functions
// =====================================================

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, baseDelay: number, multiplier: number): number {
  return baseDelay * Math.pow(multiplier, attempt);
}

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(ApiError.timeoutError());
    }, timeout);

    fetch(url, {
      ...options,
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          reject(ApiError.timeoutError());
        } else {
          reject(error);
        }
      });
  });
}

function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

// =====================================================
// API Client Configuration
// =====================================================

interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  retryBackoffMultiplier: number;
}

const defaultConfig: ApiClientConfig = {
  baseUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  retries: API_CONFIG.RETRIES,
  retryDelay: API_CONFIG.RETRY_DELAY,
  retryBackoffMultiplier: API_CONFIG.RETRY_BACKOFF_MULTIPLIER,
};

// =====================================================
// Studio Admin API Client
// =====================================================

class StudioAdminApi {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // =====================================================
  // Core HTTP Methods
  // =====================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 0,
    requestId?: string
  ): Promise<T> {
    const correlationId = requestId || generateRequestId();
    const url = `${this.config.baseUrl}${endpoint}`;

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        [API_CONFIG.REQUEST_ID_HEADER]: correlationId,
        ...options.headers,
      },
      credentials: "include",
    };

    try {
      const response = await fetchWithTimeout(url, requestOptions, this.config.timeout);

      let data: unknown;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const apiError = ApiError.fromResponse(
          response.status,
          typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {},
          correlationId
        );

        // Retry on retryable errors
        if (apiError.isRetryable && attempt < this.config.retries) {
          const delay = calculateBackoff(
            attempt,
            this.config.retryDelay,
            this.config.retryBackoffMultiplier
          );
          await sleep(delay);
          return this.request<T>(endpoint, options, attempt + 1, correlationId);
        }

        throw apiError;
      }

      // Extract data from response wrapper if present
      const responseData = data as ApiResponse<T>;
      return (responseData.data !== undefined ? responseData.data : data) as T;
    } catch (error) {
      if (!(error instanceof ApiError)) {
        const networkError = ApiError.networkError(
          "Unable to connect to the server. Please check your internet connection.",
          error instanceof Error ? error : undefined,
          correlationId
        );

        // Retry on network errors
        if (attempt < this.config.retries) {
          const delay = calculateBackoff(
            attempt,
            this.config.retryDelay,
            this.config.retryBackoffMultiplier
          );
          await sleep(delay);
          return this.request<T>(endpoint, options, attempt + 1, correlationId);
        }

        throw networkError;
      }

      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // =====================================================
  // Dashboard API
  // =====================================================

  async getStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>("/admin/dashboard/stats");
  }

  async getRevenueChart(days: number = 30): Promise<RevenueChartData[]> {
    return this.get<RevenueChartData[]>(`/admin/dashboard/revenue-chart?days=${days}`);
  }

  async getConversionFunnel(): Promise<ConversionFunnel> {
    return this.get<ConversionFunnel>("/admin/dashboard/conversion-funnel");
  }

  // =====================================================
  // Orders API
  // =====================================================

  async getOrders(params: GetOrdersParams = {}): Promise<PaginatedResponse<Order>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<Order>>(`/admin/orders${query}`);
  }

  async getOrder(id: string): Promise<Order> {
    return this.get<Order>(`/admin/orders/${id}`);
  }

  async getOrderStats(): Promise<OrderStats> {
    return this.get<OrderStats>("/admin/orders/stats");
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.patch<Order>(`/admin/orders/${id}/status`, { status });
  }

  async refundOrder(id: string): Promise<Order> {
    return this.post<Order>(`/admin/orders/${id}/refund`);
  }

  async regenerateDownload(id: string): Promise<{ downloadToken: string }> {
    return this.post<{ downloadToken: string }>(`/admin/orders/${id}/regenerate-download`);
  }

  getExportOrdersUrl(params: ExportOrdersParams = {}): string {
    const query = buildQueryString(params);
    return `${this.config.baseUrl}/admin/orders/export/csv${query}`;
  }

  // =====================================================
  // Templates API
  // =====================================================

  async getTemplates(params: GetTemplatesParams = {}): Promise<PaginatedResponse<Template>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<Template>>(`/admin/templates${query}`);
  }

  async getTemplate(id: string): Promise<Template> {
    return this.get<Template>(`/admin/templates/${id}`);
  }

  async createTemplate(data: CreateTemplateData): Promise<Template> {
    return this.post<Template>("/admin/templates", data);
  }

  async updateTemplate(id: string, data: UpdateTemplateData): Promise<Template> {
    return this.put<Template>(`/admin/templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.delete<void>(`/admin/templates/${id}`);
  }

  async toggleTemplate(id: string): Promise<Template> {
    return this.patch<Template>(`/admin/templates/${id}/toggle`);
  }

  async reorderTemplates(orders: Array<{ id: string; displayOrder: number }>): Promise<void> {
    return this.put<void>("/admin/templates/reorder", { orders });
  }

  // =====================================================
  // Modules API
  // =====================================================

  async getModules(params: GetModulesParams = {}): Promise<PaginatedResponse<Module>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<Module>>(`/admin/modules${query}`);
  }

  async getModule(id: string): Promise<Module> {
    return this.get<Module>(`/admin/modules/${id}`);
  }

  async getModuleCategories(): Promise<string[]> {
    return this.get<string[]>("/admin/modules/categories");
  }

  async createModule(data: CreateModuleData): Promise<Module> {
    return this.post<Module>("/admin/modules", data);
  }

  async updateModule(id: string, data: UpdateModuleData): Promise<Module> {
    return this.put<Module>(`/admin/modules/${id}`, data);
  }

  async deleteModule(id: string): Promise<void> {
    return this.delete<void>(`/admin/modules/${id}`);
  }

  // =====================================================
  // Features API
  // =====================================================

  async getFeatures(params: GetFeaturesParams = {}): Promise<PaginatedResponse<Feature>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<Feature>>(`/admin/features${query}`);
  }

  async getFeature(id: string): Promise<Feature> {
    return this.get<Feature>(`/admin/features/${id}`);
  }

  async createFeature(data: CreateFeatureData): Promise<Feature> {
    return this.post<Feature>("/admin/features", data);
  }

  async updateFeature(id: string, data: UpdateFeatureData): Promise<Feature> {
    return this.put<Feature>(`/admin/features/${id}`, data);
  }

  async deleteFeature(id: string): Promise<void> {
    return this.delete<void>(`/admin/features/${id}`);
  }

  async toggleFeature(id: string): Promise<Feature> {
    return this.patch<Feature>(`/admin/features/${id}/toggle`);
  }

  async bulkUpdatePrices(updates: BulkUpdatePriceItem[]): Promise<void> {
    return this.post<void>("/admin/features/bulk-update-price", { updates });
  }

  // =====================================================
  // Customers API
  // =====================================================

  async getCustomers(params: GetCustomersParams = {}): Promise<PaginatedResponse<Customer>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<Customer>>(`/admin/customers${query}`);
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.get<Customer>(`/admin/customers/${id}`);
  }

  async getCustomerOrders(id: string, params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<CustomerOrder>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<CustomerOrder>>(`/admin/customers/${id}/orders${query}`);
  }

  async blockCustomer(id: string, reason?: string): Promise<Customer> {
    return this.patch<Customer>(`/admin/customers/${id}/block`, { isBlocked: true, reason });
  }

  async unblockCustomer(id: string): Promise<Customer> {
    return this.patch<Customer>(`/admin/customers/${id}/block`, { isBlocked: false });
  }

  getExportCustomersUrl(): string {
    return `${this.config.baseUrl}/admin/customers/export/csv`;
  }

  // =====================================================
  // Licenses API
  // =====================================================

  async getLicenses(params: GetLicensesParams = {}): Promise<PaginatedResponse<License>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<License>>(`/admin/licenses${query}`);
  }

  async getLicense(id: string): Promise<License> {
    return this.get<License>(`/admin/licenses/${id}`);
  }

  async extendLicense(id: string, days: number): Promise<License> {
    return this.patch<License>(`/admin/licenses/${id}/extend`, { days });
  }

  async revokeLicense(id: string, reason: string): Promise<License> {
    return this.patch<License>(`/admin/licenses/${id}/revoke`, { reason });
  }

  async regenerateToken(id: string): Promise<{ downloadToken: string }> {
    return this.post<{ downloadToken: string }>(`/admin/licenses/${id}/regenerate`);
  }

  // =====================================================
  // Coupons API
  // =====================================================

  async getCoupons(params: GetCouponsParams = {}): Promise<PaginatedResponse<Coupon>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<Coupon>>(`/admin/coupons${query}`);
  }

  async getCoupon(id: string): Promise<Coupon> {
    return this.get<Coupon>(`/admin/coupons/${id}`);
  }

  async createCoupon(data: CreateCouponData): Promise<Coupon> {
    return this.post<Coupon>("/admin/coupons", data);
  }

  async updateCoupon(id: string, data: UpdateCouponData): Promise<Coupon> {
    return this.put<Coupon>(`/admin/coupons/${id}`, data);
  }

  async deleteCoupon(id: string): Promise<void> {
    return this.delete<void>(`/admin/coupons/${id}`);
  }

  async toggleCoupon(id: string): Promise<Coupon> {
    return this.patch<Coupon>(`/admin/coupons/${id}/toggle`);
  }

  // =====================================================
  // Analytics API
  // =====================================================

  async getRevenue(period: AnalyticsPeriod = "30d"): Promise<RevenueAnalytics> {
    return this.get<RevenueAnalytics>(`/admin/analytics/revenue?period=${period}`);
  }

  async getFeatureStats(): Promise<FeatureStats[]> {
    return this.get<FeatureStats[]>("/admin/analytics/features");
  }

  async getFunnel(period: AnalyticsPeriod = "30d"): Promise<FunnelAnalytics> {
    return this.get<FunnelAnalytics>(`/admin/analytics/funnel?period=${period}`);
  }

  async getTemplateStats(): Promise<TemplateStats[]> {
    return this.get<TemplateStats[]>("/admin/analytics/templates");
  }

  getAnalyticsPdfExportUrl(type: "revenue" | "funnel" | "features" | "templates", period: AnalyticsPeriod): string {
    return `${this.config.baseUrl}/admin/analytics/export/pdf?type=${type}&period=${period}`;
  }

  // =====================================================
  // Settings API
  // =====================================================

  async getSettings(params: GetSettingsParams = {}): Promise<PaginatedResponse<Setting>> {
    const query = buildQueryString(params);
    return this.get<PaginatedResponse<Setting>>(`/admin/settings${query}`);
  }

  async getSetting(key: string): Promise<Setting> {
    return this.get<Setting>(`/admin/settings/${key}`);
  }

  async createSetting(data: CreateSettingData): Promise<Setting> {
    return this.post<Setting>("/admin/settings", data);
  }

  async updateSetting(key: string, data: UpdateSettingData): Promise<Setting> {
    return this.put<Setting>(`/admin/settings/${key}`, data);
  }

  async deleteSetting(key: string): Promise<void> {
    return this.delete<void>(`/admin/settings/${key}`);
  }

  getExportSettingsUrl(): string {
    return `${this.config.baseUrl}/admin/settings/export/json`;
  }

  // =====================================================
  // Pricing API
  // =====================================================

  async getPricingTiers(): Promise<PricingTier[]> {
    return this.get<PricingTier[]>("/admin/pricing/tiers");
  }

  async updatePricingTier(slug: string, data: UpdatePricingTierData): Promise<PricingTier> {
    return this.put<PricingTier>(`/admin/pricing/tiers/${slug}`, data);
  }

  async getBundleDiscounts(): Promise<PaginatedResponse<BundleDiscount>> {
    return this.get<PaginatedResponse<BundleDiscount>>("/admin/pricing/bundles");
  }

  async createBundleDiscount(data: CreateBundleDiscountData): Promise<BundleDiscount> {
    return this.post<BundleDiscount>("/admin/pricing/bundles", data);
  }

  async updateBundleDiscount(id: string, data: UpdateBundleDiscountData): Promise<BundleDiscount> {
    return this.put<BundleDiscount>(`/admin/pricing/bundles/${id}`, data);
  }

  async toggleBundleDiscount(id: string): Promise<BundleDiscount> {
    return this.patch<BundleDiscount>(`/admin/pricing/bundles/${id}/toggle`);
  }

  async deleteBundleDiscount(id: string): Promise<void> {
    return this.delete<void>(`/admin/pricing/bundles/${id}`);
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const adminApi = new StudioAdminApi();

// Export class for custom instances
export { StudioAdminApi };
