"use client";

import { logger } from "./logger";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Request ID header for correlation
const REQUEST_ID_HEADER = "x-request-id";

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

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  retryBackoffMultiplier: number;
}

const defaultConfig: ApiConfig = {
  baseUrl: API_BASE_URL,
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  retryBackoffMultiplier: 2,
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
      status >= 500 || status === 429,
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
// User types
// =====================================================

export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

// =====================================================
// API Response types
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

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
  private config: ApiConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: Partial<ApiConfig> = {}) {
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
        [REQUEST_ID_HEADER]: correlationId,
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
    }>("/v1/auth/login", { email, password });
  }

  async register(email: string, password: string, name?: string) {
    return this.post<{ user: User }>("/v1/auth/register", { email, password, name });
  }

  async logout() {
    return this.post("/v1/auth/logout");
  }

  async getMe() {
    return this.get<{ user: User }>("/v1/auth/me");
  }

  async refresh() {
    return this.post<{
      accessToken: string;
      refreshToken: string;
    }>("/v1/auth/refresh");
  }

  // =====================================================
  // ADD YOUR API METHODS HERE
  // =====================================================

  // Example:
  // async getPosts(page = 1, limit = 10) {
  //   return this.get<PaginatedResponse<Post>>(`/v1/posts?page=${page}&limit=${limit}`);
  // }
}

// =====================================================
// Singleton Export
// =====================================================

export const api = new ApiClient();

// Export class for custom instances
export { ApiClient };
