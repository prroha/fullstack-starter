"use client";

import { logger } from "./logger";
import { API_CONFIG, HTTP_STATUS } from "./constants";
import type {
  User,
  AdminUser,
  ApiResponse,
  PaginatedResponse,
  AdminStats,
  Notification,
  AuditLog,
  AuditAction,
  ContactMessage,
  PaginationInfo,
} from "@/types/api";

// =====================================================
// Admin Resource Types
// =====================================================

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  description: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateSettingData {
  key: string;
  value: string;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSettingData {
  value?: string;
  type?: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  description?: string | null;
  isPublic?: boolean;
}

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDesc: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentPageData {
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDesc?: string | null;
  isPublished?: boolean;
}

export interface UpdateContentPageData extends Partial<CreateContentPageData> {}

export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}

export interface Faq {
  id: string;
  categoryId: string | null;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  category?: { id: string; name: string; slug: string } | null;
}

export interface CreateFaqData {
  question: string;
  answer: string;
  categoryId?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface UpdateFaqData extends Partial<CreateFaqData> {}

export interface CreateFaqCategoryData {
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateFaqCategoryData extends Partial<CreateFaqCategoryData> {}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "PROMO";
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "PROMO";
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  isPinned?: boolean;
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {}

export interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCouponData {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase?: number | null;
  maxUses?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive?: boolean;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {}

// =====================================================
// Orders Types
// =====================================================

export type OrderStatus = "PENDING" | "COMPLETED" | "REFUNDED" | "FAILED";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderApiResponse {
  id: string;
  orderNumber: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  recentOrders: number;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Generate a UUID v4 for request correlation
 */
function generateRequestId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =====================================================
// Configuration
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
// API Error class
// =====================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
    public isRetryable: boolean = false,
    public requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromResponse(status: number, data: Record<string, unknown>, requestId?: string): ApiError {
    const error = data.error as Record<string, unknown> | undefined;
    return new ApiError(
      status,
      (error?.message as string) || "Request failed",
      error?.code as string | undefined,
      error?.details,
      status >= HTTP_STATUS.INTERNAL_SERVER_ERROR || status === HTTP_STATUS.TOO_MANY_REQUESTS,
      requestId || (error?.requestId as string | undefined)
    );
  }

  static networkError(message: string, originalError?: Error, requestId?: string): ApiError {
    const error = new ApiError(0, message, "NETWORK_ERROR", undefined, true, requestId);
    if (originalError) {
      error.cause = originalError;
    }
    return error;
  }

  static timeoutError(requestId?: string): ApiError {
    return new ApiError(0, "Request timed out", "TIMEOUT_ERROR", undefined, true, requestId);
  }
}

// =====================================================
// Re-export types from @/types for backward compatibility
// =====================================================

export type { UserRole } from "@/types/user";
export type {
  User,
  AdminUser,
  Notification,
  NotificationType,
  AuditAction,
  AuditLog,
  ContactMessageStatus,
  ContactMessage,
  ApiResponse,
  PaginatedResponse,
} from "@/types/api";

// =====================================================
// Interceptor Types
// =====================================================

type RequestInterceptor = (
  url: string,
  options: RequestInit
) => Promise<{ url: string; options: RequestInit }> | { url: string; options: RequestInit };

type ResponseInterceptor = (
  response: Response,
  data: unknown
) => Promise<unknown> | unknown;

type ErrorInterceptor = (error: ApiError) => Promise<ApiError> | ApiError;

// =====================================================
// Retry Logic Helper
// =====================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, baseDelay: number, multiplier: number): number {
  return baseDelay * Math.pow(multiplier, attempt);
}

// =====================================================
// Timeout Helper
// =====================================================

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

// =====================================================
// API Client
// =====================================================

class ApiClient {
  private config: ApiClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // =====================================================
  // Interceptor Management
  // =====================================================

  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.errorInterceptors.splice(index, 1);
      }
    };
  }

  // =====================================================
  // Request Execution
  // =====================================================

  private async executeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 0,
    requestId?: string
  ): Promise<ApiResponse<T>> {
    // Generate request ID on first attempt for correlation
    const correlationId = requestId || generateRequestId();

    let url = `${this.config.baseUrl}${endpoint}`;
    let requestOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        [API_CONFIG.REQUEST_ID_HEADER]: correlationId,
        ...options.headers,
      },
      credentials: "include",
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(url, requestOptions);
      url = result.url;
      requestOptions = result.options;
    }

    const startTime = Date.now();

    try {
      const response = await fetchWithTimeout(url, requestOptions, this.config.timeout);
      const duration = Date.now() - startTime;

      let data: unknown;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Log successful request with correlation ID
      logger.debug("API", `${options.method || "GET"} ${endpoint}`, {
        status: response.status,
        duration: `${duration}ms`,
        requestId: correlationId,
      });

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
          logger.warn("API", `Retrying request (attempt ${attempt + 1}/${this.config.retries})`, {
            endpoint,
            delay: `${delay}ms`,
            requestId: correlationId,
          });
          await sleep(delay);
          return this.executeRequest<T>(endpoint, options, attempt + 1, correlationId);
        }

        throw apiError;
      }

      // Run response interceptors
      let processedData = data;
      for (const interceptor of this.responseInterceptors) {
        processedData = await interceptor(response, processedData);
      }

      return processedData as ApiResponse<T>;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Handle network errors
      if (!(error instanceof ApiError)) {
        const networkError = ApiError.networkError(
          this.getNetworkErrorMessage(error),
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
          logger.warn("API", `Network error, retrying (attempt ${attempt + 1}/${this.config.retries})`, {
            endpoint,
            error: networkError.message,
            delay: `${delay}ms`,
            requestId: correlationId,
          });
          await sleep(delay);
          return this.executeRequest<T>(endpoint, options, attempt + 1, correlationId);
        }

        logger.error("API", `Request failed: ${endpoint}`, networkError, {
          duration: `${duration}ms`,
          attempts: attempt + 1,
          requestId: correlationId,
        });

        // Run error interceptors
        let processedError = networkError;
        for (const interceptor of this.errorInterceptors) {
          processedError = await interceptor(processedError);
        }

        throw processedError;
      }

      // Log API error with correlation ID
      logger.error("API", `Request failed: ${endpoint}`, error, {
        status: error.status,
        code: error.code,
        duration: `${duration}ms`,
        attempts: attempt + 1,
        requestId: correlationId,
      });

      // Run error interceptors
      let processedError = error;
      for (const interceptor of this.errorInterceptors) {
        processedError = await interceptor(processedError);
      }

      throw processedError;
    }
  }

  private getNetworkErrorMessage(error: unknown): string {
    if (error instanceof TypeError) {
      if (error.message.includes("Failed to fetch")) {
        return "Unable to connect to the server. Please check your internet connection.";
      }
      if (error.message.includes("NetworkError")) {
        return "Network error occurred. Please check your connection and try again.";
      }
      if (error.message.includes("CORS")) {
        return "Cross-origin request blocked. Please contact support.";
      }
    }

    if (error instanceof DOMException) {
      if (error.name === "AbortError") {
        return "Request was cancelled.";
      }
    }

    if (error instanceof Error) {
      return `Network error: ${error.message}`;
    }

    return "An unexpected network error occurred.";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>(endpoint, options);
  }

  // =====================================================
  // HTTP Method Helpers
  // =====================================================

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  // =====================================================
  // AUTH
  // =====================================================

  async login(email: string, password: string) {
    return this.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", { email, password });
  }

  async register(email: string, password: string, name?: string) {
    return this.post<{ user: User }>("/auth/register", { email, password, name });
  }

  async logout() {
    return this.post("/auth/logout");
  }

  async getMe() {
    return this.get<{ user: User }>("/auth/me");
  }

  async refresh() {
    return this.post<{
      accessToken: string;
      refreshToken: string;
    }>("/auth/refresh");
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.post("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  async forgotPassword(email: string) {
    return this.post<null>("/auth/forgot-password", { email });
  }

  async verifyResetToken(token: string) {
    return this.get<{ valid: boolean; email?: string }>(`/auth/verify-reset-token/${token}`);
  }

  async resetPassword(token: string, password: string, confirmPassword: string) {
    return this.post<null>("/auth/reset-password", { token, password, confirmPassword });
  }

  async verifyEmail(token: string) {
    return this.get<{ verified: boolean; email: string }>(`/auth/verify-email/${token}`);
  }

  async sendVerificationEmail() {
    return this.post<null>("/auth/send-verification");
  }

  // =====================================================
  // SESSIONS
  // =====================================================

  async getSessions() {
    return this.get<{
      sessions: Array<{
        id: string;
        deviceName: string | null;
        browser: string | null;
        os: string | null;
        ipAddress: string | null;
        lastActiveAt: string;
        createdAt: string;
        isCurrent: boolean;
      }>;
    }>("/auth/sessions");
  }

  async revokeSession(sessionId: string) {
    return this.delete<null>(`/auth/sessions/${sessionId}`);
  }

  async revokeAllOtherSessions() {
    return this.delete<{ revokedCount: number }>("/auth/sessions");
  }

  // =====================================================
  // USER PROFILE
  // =====================================================

  async getProfile() {
    return this.get<{
      profile: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    }>("/users/me");
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.patch<{
      profile: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    }>("/users/me", data);
  }

  async getAvatar() {
    return this.get<{
      avatar: {
        url: string | null;
        initials: string;
      };
    }>("/users/me/avatar");
  }

  async uploadAvatar(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ avatar: { url: string } }>> {
    const formData = new FormData();
    formData.append("avatar", file);

    const requestId = this.generateRequestId();

    // Get CSRF token from cookie for multipart form uploads
    const csrfToken = this.getCsrfTokenFromCookie();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${this.config.baseUrl}/v1/users/me/avatar`);
      xhr.withCredentials = true;
      xhr.setRequestHeader("x-request-id", requestId);

      // Include CSRF token for file uploads
      if (csrfToken) {
        xhr.setRequestHeader("x-csrf-token", csrfToken);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(ApiError.fromResponse(xhr.status, data, requestId));
          }
        } catch {
          reject(new ApiError(xhr.status, "Failed to parse response", undefined, undefined, false, requestId));
        }
      };

      xhr.onerror = () => {
        reject(ApiError.networkError("Failed to upload avatar", undefined, requestId));
      };

      xhr.send(formData);
    });
  }

  async deleteAvatar() {
    return this.delete<null>("/users/me/avatar");
  }

  private generateRequestId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get CSRF token from cookie for requests that need manual CSRF handling
   * (e.g., file uploads using XMLHttpRequest)
   */
  private getCsrfTokenFromCookie(): string | undefined {
    if (typeof document === "undefined") {
      return undefined;
    }
    const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  // =====================================================
  // ADMIN
  // =====================================================

  async getAdminStats() {
    return this.get<AdminStats>("/admin/stats");
  }

  async getAdminUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: "USER" | "ADMIN" | "SUPER_ADMIN";
    isActive?: boolean;
    sortBy?: "createdAt" | "email" | "name";
    sortOrder?: "asc" | "desc";
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.role) searchParams.set("role", params.role);
    if (params?.isActive !== undefined)
      searchParams.set("isActive", params.isActive.toString());
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const query = searchParams.toString();
    return this.get<PaginatedResponse<AdminUser>>(
      `/admin/users${query ? `?${query}` : ""}`
    );
  }

  async getAdminUser(id: string) {
    return this.get<{ user: AdminUser }>(`/admin/users/${id}`);
  }

  async updateAdminUser(
    id: string,
    data: { role?: "USER" | "ADMIN" | "SUPER_ADMIN"; isActive?: boolean; name?: string }
  ) {
    return this.patch<{ user: AdminUser }>(`/admin/users/${id}`, data);
  }

  async deleteAdminUser(id: string) {
    return this.delete(`/admin/users/${id}`);
  }

  // =====================================================
  // AUDIT LOGS (Admin)
  // =====================================================

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: AuditAction;
    entity?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.userId) searchParams.set("userId", params.userId);
    if (params?.action) searchParams.set("action", params.action);
    if (params?.entity) searchParams.set("entity", params.entity);
    if (params?.entityId) searchParams.set("entityId", params.entityId);
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    return this.get<PaginatedResponse<AuditLog>>(
      `/admin/audit-logs${query ? `?${query}` : ""}`
    );
  }

  async getAuditLog(id: string) {
    return this.get<{ log: AuditLog }>(`/admin/audit-logs/${id}`);
  }

  async getAuditLogEntityTypes() {
    return this.get<{ entityTypes: string[] }>("/admin/audit-logs/entity-types");
  }

  async getAuditLogActionTypes() {
    return this.get<{ actionTypes: AuditAction[] }>("/admin/audit-logs/action-types");
  }

  // =====================================================
  // SEARCH
  // =====================================================

  async search(params: {
    q: string;
    type?: "all" | "users";
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.set("q", params.q);
    if (params.type) searchParams.set("type", params.type);
    if (params.limit) searchParams.set("limit", params.limit.toString());

    return this.get<{
      results: {
        users?: Array<{
          id: string;
          email: string;
          name: string | null;
          role: "USER" | "ADMIN" | "SUPER_ADMIN";
          isActive: boolean;
          createdAt: string;
        }>;
        query: string;
        totalResults: number;
      };
    }>(`/search?${searchParams.toString()}`);
  }

  // =====================================================
  // CONTACT
  // =====================================================

  async submitContact(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return this.post<{ id: string; createdAt: string }>("/contact", data);
  }

  async getContactMessages(params?: {
    page?: number;
    limit?: number;
    status?: "PENDING" | "READ" | "REPLIED";
    search?: string;
    sortBy?: "createdAt" | "status";
    sortOrder?: "asc" | "desc";
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const query = searchParams.toString();
    return this.get<PaginatedResponse<ContactMessage>>(
      `/admin/contact-messages${query ? `?${query}` : ""}`
    );
  }

  async getContactMessage(id: string) {
    return this.get<{ message: ContactMessage }>(
      `/admin/contact-messages/${id}`
    );
  }

  async updateContactMessage(
    id: string,
    data: { status?: "PENDING" | "READ" | "REPLIED" }
  ) {
    return this.patch<{ message: ContactMessage }>(
      `/admin/contact-messages/${id}`,
      data
    );
  }

  async deleteContactMessage(id: string) {
    return this.delete(`/admin/contact-messages/${id}`);
  }

  async getContactUnreadCount() {
    return this.get<{ count: number }>("/admin/contact-messages/unread-count");
  }

  getContactMessagesExportUrl() {
    return `${this.config.baseUrl}/admin/contact-messages/export`;
  }

  // =====================================================
  // DATA EXPORT
  // =====================================================

  /**
   * Get export URL for user's own data (GDPR)
   * Note: Use downloadFile from lib/export.ts to download
   */
  getMyDataExportUrl(format: "json" | "csv" = "json"): string {
    return `${this.config.baseUrl}/v1/users/me/export?format=${format}`;
  }

  /**
   * Get export URL for all users (admin only)
   * Note: Use downloadFile from lib/export.ts to download
   */
  getAdminUsersExportUrl(stream: boolean = false): string {
    return `${this.config.baseUrl}/v1/admin/users/export${stream ? "?stream=true" : ""}`;
  }

  /**
   * Get export URL for audit logs (admin only)
   * Note: Use downloadFile from lib/export.ts to download
   */
  getAdminAuditLogsExportUrl(params?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    userId?: string;
  }): string {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.action) searchParams.set("action", params.action);
    if (params?.userId) searchParams.set("userId", params.userId);

    const query = searchParams.toString();
    return `${this.config.baseUrl}/v1/admin/audit-logs/export${query ? `?${query}` : ""}`;
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  async getNotifications(params?: {
    page?: number;
    limit?: number;
    read?: boolean;
    type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM";
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.read !== undefined) searchParams.set("read", params.read.toString());
    if (params?.type) searchParams.set("type", params.type);

    const query = searchParams.toString();
    return this.get<PaginatedResponse<Notification>>(
      `/notifications${query ? `?${query}` : ""}`
    );
  }

  async getNotification(id: string) {
    return this.get<{ notification: Notification }>(`/notifications/${id}`);
  }

  async getUnreadNotificationCount() {
    return this.get<{ count: number }>("/notifications/unread-count");
  }

  async markNotificationAsRead(id: string) {
    return this.patch<{ notification: Notification }>(`/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.patch<{ count: number }>("/notifications/read-all");
  }

  async deleteNotification(id: string) {
    return this.delete<null>(`/notifications/${id}`);
  }

  async deleteAllNotifications() {
    return this.delete<{ count: number }>("/notifications");
  }

  // =====================================================
  // Settings API
  // =====================================================

  async getSettings() {
    return this.get<{ settings: Setting[] }>("/settings");
  }

  async getSetting(key: string) {
    return this.get<{ setting: Setting }>(`/settings/${key}`);
  }

  async createSetting(data: CreateSettingData) {
    return this.post<{ setting: Setting }>("/settings", data);
  }

  async updateSetting(key: string, data: UpdateSettingData) {
    return this.patch<{ setting: Setting }>(`/settings/${key}`, data);
  }

  async deleteSetting(key: string) {
    return this.delete<null>(`/settings/${key}`);
  }

  getSettingsExportUrl() {
    return `${this.config.baseUrl}/settings/export`;
  }

  // =====================================================
  // Content Pages API
  // =====================================================

  async getContentPages(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.isPublished) searchParams.set("isPublished", params.isPublished);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    const query = searchParams.toString();
    return this.get<PaginatedResponse<ContentPage>>(`/content${query ? `?${query}` : ""}`);
  }

  async createContentPage(data: CreateContentPageData) {
    return this.post<{ page: ContentPage }>("/content", data);
  }

  async updateContentPage(id: string, data: UpdateContentPageData) {
    return this.patch<{ page: ContentPage }>(`/content/${id}`, data);
  }

  async deleteContentPage(id: string) {
    return this.delete<null>(`/content/${id}`);
  }

  getContentExportUrl() {
    return `${this.config.baseUrl}/content/export`;
  }

  // =====================================================
  // FAQs API
  // =====================================================

  async getFaqs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    const query = searchParams.toString();
    return this.get<{ faqs: Faq[]; pagination: PaginationInfo }>(`/faqs${query ? `?${query}` : ""}`);
  }

  async getFaqCategories() {
    return this.get<{ categories: FaqCategory[] }>("/faqs/categories");
  }

  async createFaq(data: CreateFaqData) {
    return this.post<{ faq: Faq }>("/faqs", data);
  }

  async updateFaq(id: string, data: UpdateFaqData) {
    return this.patch<{ faq: Faq }>(`/faqs/${id}`, data);
  }

  async deleteFaq(id: string) {
    return this.delete<null>(`/faqs/${id}`);
  }

  async createFaqCategory(data: CreateFaqCategoryData) {
    return this.post<{ category: FaqCategory }>("/faqs/categories", data);
  }

  async updateFaqCategory(id: string, data: UpdateFaqCategoryData) {
    return this.patch<{ category: FaqCategory }>(`/faqs/categories/${id}`, data);
  }

  async deleteFaqCategory(id: string) {
    return this.delete<null>(`/faqs/categories/${id}`);
  }

  getFaqsExportUrl() {
    return `${this.config.baseUrl}/faqs/export`;
  }

  // =====================================================
  // Announcements API
  // =====================================================

  async getAnnouncements(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.type) searchParams.set("type", params.type);
    if (params?.isActive) searchParams.set("isActive", params.isActive);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    const query = searchParams.toString();
    return this.get<PaginatedResponse<Announcement>>(`/announcements${query ? `?${query}` : ""}`);
  }

  async createAnnouncement(data: CreateAnnouncementData) {
    return this.post<{ announcement: Announcement }>("/announcements", data);
  }

  async updateAnnouncement(id: string, data: UpdateAnnouncementData) {
    return this.patch<{ announcement: Announcement }>(`/announcements/${id}`, data);
  }

  async deleteAnnouncement(id: string) {
    return this.delete<null>(`/announcements/${id}`);
  }

  getAnnouncementsExportUrl() {
    return `${this.config.baseUrl}/announcements/export`;
  }

  // =====================================================
  // Coupons API
  // =====================================================

  async getCoupons(params?: {
    page?: number;
    limit?: number;
    search?: string;
    discountType?: string;
    isActive?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.discountType) searchParams.set("discountType", params.discountType);
    if (params?.isActive) searchParams.set("isActive", params.isActive);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    const query = searchParams.toString();
    return this.get<PaginatedResponse<Coupon>>(`/coupons${query ? `?${query}` : ""}`);
  }

  async createCoupon(data: CreateCouponData) {
    return this.post<{ coupon: Coupon }>("/coupons", data);
  }

  async updateCoupon(id: string, data: UpdateCouponData) {
    return this.patch<{ coupon: Coupon }>(`/coupons/${id}`, data);
  }

  async deleteCoupon(id: string) {
    return this.delete<null>(`/coupons/${id}`);
  }

  getCouponsExportUrl() {
    return `${this.config.baseUrl}/coupons/export`;
  }

  // =====================================================
  // Orders API
  // =====================================================

  async getOrders(params?: GetOrdersParams) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);
    if (params?.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    const response = await this.get<PaginatedResponse<OrderApiResponse>>(
      `/admin/orders${query ? `?${query}` : ""}`
    );

    // Transform API response to frontend Order type
    const items = (response.data?.items || []).map((apiOrder) => ({
      id: apiOrder.id,
      orderNumber: apiOrder.orderNumber,
      customer: {
        id: apiOrder.user.id,
        name: apiOrder.user.name || apiOrder.user.email.split("@")[0],
        email: apiOrder.user.email,
      },
      items: apiOrder.items,
      total: apiOrder.total,
      status: apiOrder.status,
      paymentMethod: apiOrder.paymentMethod,
      paymentId: apiOrder.paymentId,
      createdAt: apiOrder.createdAt,
      updatedAt: apiOrder.updatedAt,
    }));

    return {
      ...response,
      data: response.data
        ? {
            items,
            pagination: response.data.pagination,
          }
        : undefined,
    };
  }

  async getOrderStats() {
    const response = await this.get<{ data: {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      recentOrders: number;
    } }>("/admin/orders/stats");

    return {
      ...response,
      data: response.data?.data
        ? {
            totalRevenue: response.data.data.totalRevenue,
            totalOrders: response.data.data.totalOrders,
            avgOrderValue: response.data.data.averageOrderValue,
            recentOrders: response.data.data.recentOrders,
          }
        : undefined,
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const response = await this.patch<{ data: { order: OrderApiResponse } }>(
      `/admin/orders/${orderId}/status`,
      { status }
    );

    if (!response.data?.data?.order) {
      throw new ApiError(500, "Failed to update order status");
    }

    const apiOrder = response.data.data.order;
    return {
      ...response,
      data: {
        order: {
          id: apiOrder.id,
          orderNumber: apiOrder.orderNumber,
          customer: {
            id: apiOrder.user.id,
            name: apiOrder.user.name || apiOrder.user.email.split("@")[0],
            email: apiOrder.user.email,
          },
          items: apiOrder.items,
          total: apiOrder.total,
          status: apiOrder.status,
          paymentMethod: apiOrder.paymentMethod,
          paymentId: apiOrder.paymentId,
          createdAt: apiOrder.createdAt,
          updatedAt: apiOrder.updatedAt,
        } as Order,
      },
    };
  }

  getOrdersExportUrl() {
    return `${this.config.baseUrl}/admin/orders/export`;
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const api = new ApiClient();

// Export class for custom instances
export { ApiClient };
