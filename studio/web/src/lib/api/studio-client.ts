"use client";

/**
 * Studio Public API Client
 *
 * A typed API client for the studio backend public endpoints.
 * Used by the frontend configurator and pricing pages.
 */

import { API_CONFIG, HTTP_STATUS } from "../constants";
import type {
  Feature,
  Module,
  Template,
  PricingTier,
  PriceCalculation,
  PaginationInfo,
  ApiResponse,
} from "@studio/shared";

// =====================================================
// Type Definitions
// =====================================================

/**
 * Error class for API requests
 */
export class StudioApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly isRetryable: boolean;

  constructor(
    message: string,
    status: number,
    code?: string,
    requestId?: string
  ) {
    super(message);
    this.name = "StudioApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.isRetryable = status >= 500 || status === 429;
  }

  static fromResponse(
    status: number,
    data: Record<string, unknown>,
    requestId?: string
  ): StudioApiError {
    const message =
      (data.error as { message?: string })?.message ||
      data.message ||
      "An unexpected error occurred";
    const code = (data.error as { code?: string })?.code;
    return new StudioApiError(String(message), status, code, requestId);
  }

  static networkError(message: string, requestId?: string): StudioApiError {
    return new StudioApiError(message, 0, "NETWORK_ERROR", requestId);
  }

  static timeoutError(requestId?: string): StudioApiError {
    return new StudioApiError(
      "Request timed out",
      408,
      "TIMEOUT",
      requestId
    );
  }
}

/**
 * Features list response
 */
export interface FeaturesResponse {
  items: Feature[];
  modules: Module[];
  pagination: PaginationInfo;
}

/**
 * Feature detail response with module info
 */
export interface FeatureDetailResponse extends Feature {
  module?: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description?: string;
    iconName?: string;
  };
}

/**
 * Templates list response
 */
export interface TemplatesResponse {
  items: Template[];
  pagination: PaginationInfo;
}

/**
 * Template detail response with features and tier info
 */
export interface TemplateDetailResponse extends Template {
  features: Feature[];
  baseTierInfo?: {
    id: string;
    slug: string;
    name: string;
    price: number;
    includedFeatures: string[];
  };
}

/**
 * Pricing tiers response
 */
export interface PricingTiersResponse {
  items: PricingTier[];
}

/**
 * Pricing tier detail response with features
 */
export interface PricingTierDetailResponse extends PricingTier {
  features: Feature[];
}

/**
 * Price calculation request
 */
export interface PriceCalculationRequest {
  tier: string;
  templateId?: string;
  selectedFeatures: string[];
  couponCode?: string;
}

/**
 * Price calculation response with breakdown
 */
export interface PriceCalculationResponse extends PriceCalculation {
  breakdown: {
    tier: {
      slug: string;
      name: string;
      price: number;
      includedCount: number;
    };
    addOnFeatures: Array<{
      slug: string;
      name: string;
      price: number;
    }>;
    addOnCount: number;
  };
}

/**
 * Preview session create request
 */
export interface CreatePreviewSessionRequest {
  tier: string;
  features: string[];
  templateId?: string;
  referrer?: string;
  userAgent?: string;
}

/**
 * Preview session create response
 */
export interface CreatePreviewSessionResponse {
  sessionId: string;
  createdAt: string;
}

/**
 * Preview session update request
 */
export interface UpdatePreviewSessionRequest {
  duration?: number;
  interactionCount?: number;
  convertedToCheckout?: boolean;
}

/**
 * Preview session update response
 */
export interface UpdatePreviewSessionResponse {
  sessionId: string;
  duration: number | null;
}

/**
 * Preview config response
 */
export interface PreviewConfigResponse {
  tier: string;
  tierName?: string;
  features: Array<{
    slug: string;
    name: string;
    category?: string;
  }>;
  byCategory: Record<
    string,
    Array<{
      slug: string;
      name: string;
      iconName?: string;
      module?: {
        category: string;
        name: string;
      };
    }>
  >;
}

/**
 * Features query parameters
 */
export interface GetFeaturesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tier?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Templates query parameters
 */
export interface GetTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

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

function calculateBackoff(
  attempt: number,
  baseDelay: number,
  multiplier: number
): number {
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
      reject(StudioApiError.timeoutError());
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
          reject(StudioApiError.timeoutError());
        } else {
          reject(error);
        }
      });
  });
}

function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
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

interface StudioClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  retryBackoffMultiplier: number;
}

const defaultConfig: StudioClientConfig = {
  baseUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  retries: API_CONFIG.RETRIES,
  retryDelay: API_CONFIG.RETRY_DELAY,
  retryBackoffMultiplier: API_CONFIG.RETRY_BACKOFF_MULTIPLIER,
};

// =====================================================
// Studio Public API Client
// =====================================================

class StudioPublicApi {
  private config: StudioClientConfig;

  constructor(config: Partial<StudioClientConfig> = {}) {
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
    };

    try {
      const response = await fetchWithTimeout(
        url,
        requestOptions,
        this.config.timeout
      );

      let data: unknown;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const apiError = StudioApiError.fromResponse(
          response.status,
          typeof data === "object" && data !== null
            ? (data as Record<string, unknown>)
            : {},
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
      if (!(error instanceof StudioApiError)) {
        const networkError = StudioApiError.networkError(
          "Unable to connect to the server. Please check your internet connection.",
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

  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  private async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // =====================================================
  // Features API
  // =====================================================

  /**
   * Get all active features with their modules
   */
  async getFeatures(params: GetFeaturesParams = {}): Promise<FeaturesResponse> {
    const query = buildQueryString(params);
    return this.get<FeaturesResponse>(`/features${query}`);
  }

  /**
   * Get a single feature by slug
   */
  async getFeature(slug: string): Promise<FeatureDetailResponse> {
    return this.get<FeatureDetailResponse>(`/features/${slug}`);
  }

  // =====================================================
  // Templates API
  // =====================================================

  /**
   * Get all active templates
   */
  async getTemplates(
    params: GetTemplatesParams = {}
  ): Promise<TemplatesResponse> {
    const query = buildQueryString(params);
    return this.get<TemplatesResponse>(`/templates${query}`);
  }

  /**
   * Get a single template by slug with feature details
   */
  async getTemplate(slug: string): Promise<TemplateDetailResponse> {
    return this.get<TemplateDetailResponse>(`/templates/${slug}`);
  }

  // =====================================================
  // Pricing API
  // =====================================================

  /**
   * Get all active pricing tiers
   */
  async getPricingTiers(): Promise<PricingTiersResponse> {
    return this.get<PricingTiersResponse>("/pricing/tiers");
  }

  /**
   * Get a single pricing tier by slug with feature details
   */
  async getPricingTier(slug: string): Promise<PricingTierDetailResponse> {
    return this.get<PricingTierDetailResponse>(`/pricing/tiers/${slug}`);
  }

  /**
   * Calculate price for a configuration
   */
  async calculatePrice(
    request: PriceCalculationRequest
  ): Promise<PriceCalculationResponse> {
    return this.post<PriceCalculationResponse>("/pricing/calculate", request);
  }

  // =====================================================
  // Preview API
  // =====================================================

  /**
   * Create a new preview session
   */
  async createPreviewSession(
    request: CreatePreviewSessionRequest
  ): Promise<CreatePreviewSessionResponse> {
    return this.post<CreatePreviewSessionResponse>("/preview/session", request);
  }

  /**
   * Update an existing preview session
   */
  async updatePreviewSession(
    id: string,
    request: UpdatePreviewSessionRequest
  ): Promise<UpdatePreviewSessionResponse> {
    return this.patch<UpdatePreviewSessionResponse>(
      `/preview/session/${id}`,
      request
    );
  }

  /**
   * Get preview configuration for a tier
   */
  async getPreviewConfig(tier: string): Promise<PreviewConfigResponse> {
    return this.get<PreviewConfigResponse>(`/preview/config/${tier}`);
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const studioApi = new StudioPublicApi();

// Export class for custom instances
export { StudioPublicApi };
