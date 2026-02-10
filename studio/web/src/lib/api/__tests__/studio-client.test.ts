/**
 * Integration tests for Studio Public API Client
 *
 * These tests verify that the API client correctly communicates
 * with the backend API endpoints using mocked responses.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  StudioPublicApi,
  StudioApiError,
  studioApi,
  type FeaturesResponse,
  type FeatureDetailResponse,
  type TemplatesResponse,
  type TemplateDetailResponse,
  type PricingTiersResponse,
  type PricingTierDetailResponse,
  type PriceCalculationResponse,
  type CreatePreviewSessionResponse,
  type UpdatePreviewSessionResponse,
  type PreviewConfigResponse,
} from "../studio-client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create successful JSON response
function createJsonResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve({ success: true, data }),
  } as unknown as Response;
}

// Helper to create error response
function createErrorResponse(
  status: number,
  message: string,
  code?: string
): Response {
  return {
    ok: false,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: () =>
      Promise.resolve({
        success: false,
        error: { message, code },
      }),
  } as unknown as Response;
}

describe("StudioPublicApi", () => {
  let api: StudioPublicApi;

  beforeEach(() => {
    mockFetch.mockReset();
    api = new StudioPublicApi({
      baseUrl: "http://localhost:3001/api",
      timeout: 5000,
      retries: 0, // Disable retries for testing
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =====================================================
  // Features API Tests
  // =====================================================

  describe("Features API", () => {
    const mockFeaturesResponse: FeaturesResponse = {
      items: [
        {
          id: "feat-1",
          slug: "auth-email",
          name: "Email Authentication",
          description: "Email/password authentication",
          moduleId: "mod-1",
          price: 0,
          tier: null,
          requires: [],
          conflicts: [],
          displayOrder: 1,
          isActive: true,
          isNew: false,
          isPopular: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          module: {
            id: "mod-1",
            name: "Authentication",
            slug: "auth",
            category: "auth",
          },
        },
        {
          id: "feat-2",
          slug: "auth-oauth",
          name: "OAuth Providers",
          description: "Social login with OAuth",
          moduleId: "mod-1",
          price: 2900,
          tier: null,
          requires: ["auth-email"],
          conflicts: [],
          displayOrder: 2,
          isActive: true,
          isNew: true,
          isPopular: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          module: {
            id: "mod-1",
            name: "Authentication",
            slug: "auth",
            category: "auth",
          },
        },
      ],
      modules: [
        {
          id: "mod-1",
          slug: "auth",
          name: "Authentication",
          description: "User authentication features",
          category: "auth",
          displayOrder: 1,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      },
    };

    it("should fetch all features", async () => {
      mockFetch.mockResolvedValueOnce(createJsonResponse(mockFeaturesResponse));

      const result = await api.getFeatures();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/features",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result.items).toHaveLength(2);
      expect(result.modules).toHaveLength(1);
      expect(result.items[0].slug).toBe("auth-email");
    });

    it("should fetch features with query parameters", async () => {
      mockFetch.mockResolvedValueOnce(createJsonResponse(mockFeaturesResponse));

      await api.getFeatures({
        page: 2,
        limit: 10,
        search: "auth",
        category: "auth",
        tier: "pro",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=auth"),
        expect.any(Object)
      );
    });

    it("should fetch a single feature by slug", async () => {
      const mockFeatureDetail: FeatureDetailResponse = {
        ...mockFeaturesResponse.items[0],
        module: {
          id: "mod-1",
          name: "Authentication",
          slug: "auth",
          category: "auth",
          description: "User authentication features",
          iconName: "lock",
        },
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockFeatureDetail));

      const result = await api.getFeature("auth-email");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/features/auth-email",
        expect.any(Object)
      );
      expect(result.slug).toBe("auth-email");
      expect(result.module?.description).toBe("User authentication features");
    });

    it("should throw StudioApiError for 404 on feature not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createErrorResponse(404, "Feature not found", "NOT_FOUND")
      );

      await expect(api.getFeature("non-existent")).rejects.toThrow(
        StudioApiError
      );
      await expect(api.getFeature("non-existent")).rejects.toMatchObject({
        status: 404,
        code: "NOT_FOUND",
      });
    });
  });

  // =====================================================
  // Templates API Tests
  // =====================================================

  describe("Templates API", () => {
    const mockTemplatesResponse: TemplatesResponse = {
      items: [
        {
          id: "tmpl-1",
          slug: "saas-starter",
          name: "SaaS Starter",
          description: "Complete SaaS boilerplate",
          price: 9900,
          tier: "starter",
          includedFeatures: ["auth-email", "auth-oauth"],
          displayOrder: 1,
          isActive: true,
          isFeatured: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    };

    it("should fetch all templates", async () => {
      mockFetch.mockResolvedValueOnce(createJsonResponse(mockTemplatesResponse));

      const result = await api.getTemplates();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/templates",
        expect.any(Object)
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].slug).toBe("saas-starter");
    });

    it("should fetch templates with search parameter", async () => {
      mockFetch.mockResolvedValueOnce(createJsonResponse(mockTemplatesResponse));

      await api.getTemplates({ search: "saas" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=saas"),
        expect.any(Object)
      );
    });

    it("should fetch a single template by slug with details", async () => {
      const mockTemplateDetail: TemplateDetailResponse = {
        ...mockTemplatesResponse.items[0],
        features: [
          {
            id: "feat-1",
            slug: "auth-email",
            name: "Email Authentication",
            description: "Email/password authentication",
            moduleId: "mod-1",
            price: 0,
            tier: null,
            requires: [],
            conflicts: [],
            displayOrder: 1,
            isActive: true,
            isNew: false,
            isPopular: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
        baseTierInfo: {
          id: "tier-1",
          slug: "starter",
          name: "Starter",
          price: 4900,
          includedFeatures: ["auth-email"],
        },
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockTemplateDetail));

      const result = await api.getTemplate("saas-starter");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/templates/saas-starter",
        expect.any(Object)
      );
      expect(result.slug).toBe("saas-starter");
      expect(result.features).toHaveLength(1);
      expect(result.baseTierInfo?.slug).toBe("starter");
    });
  });

  // =====================================================
  // Pricing API Tests
  // =====================================================

  describe("Pricing API", () => {
    const mockTiersResponse: PricingTiersResponse = {
      items: [
        {
          id: "tier-1",
          slug: "starter",
          name: "Starter",
          description: "For small projects",
          price: 4900,
          includedFeatures: ["auth-email"],
          isPopular: false,
          displayOrder: 1,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "tier-2",
          slug: "pro",
          name: "Pro",
          description: "For growing businesses",
          price: 9900,
          includedFeatures: ["auth-email", "auth-oauth"],
          isPopular: true,
          displayOrder: 2,
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
    };

    it("should fetch all pricing tiers", async () => {
      mockFetch.mockResolvedValueOnce(createJsonResponse(mockTiersResponse));

      const result = await api.getPricingTiers();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/pricing/tiers",
        expect.any(Object)
      );
      expect(result.items).toHaveLength(2);
      expect(result.items[1].isPopular).toBe(true);
    });

    it("should fetch a single pricing tier by slug with features", async () => {
      const mockTierDetail: PricingTierDetailResponse = {
        ...mockTiersResponse.items[1],
        features: [
          {
            id: "feat-1",
            slug: "auth-email",
            name: "Email Authentication",
            description: "Email/password authentication",
            moduleId: "mod-1",
            price: 0,
            tier: null,
            requires: [],
            conflicts: [],
            displayOrder: 1,
            isActive: true,
            isNew: false,
            isPopular: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockTierDetail));

      const result = await api.getPricingTier("pro");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/pricing/tiers/pro",
        expect.any(Object)
      );
      expect(result.slug).toBe("pro");
      expect(result.features).toHaveLength(1);
    });

    it("should calculate price for a configuration", async () => {
      const mockPriceCalculation: PriceCalculationResponse = {
        tierPrice: 9900,
        featuresPrice: 2900,
        subtotal: 12800,
        bundleDiscounts: [],
        totalDiscount: 0,
        tax: 0,
        total: 12800,
        currency: "USD",
        breakdown: {
          tier: {
            slug: "pro",
            name: "Pro",
            price: 9900,
            includedCount: 2,
          },
          addOnFeatures: [
            { slug: "stripe-payments", name: "Stripe Payments", price: 2900 },
          ],
          addOnCount: 1,
        },
      };

      mockFetch.mockResolvedValueOnce(
        createJsonResponse(mockPriceCalculation)
      );

      const result = await api.calculatePrice({
        tier: "pro",
        selectedFeatures: ["auth-email", "auth-oauth", "stripe-payments"],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/pricing/calculate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            tier: "pro",
            selectedFeatures: ["auth-email", "auth-oauth", "stripe-payments"],
          }),
        })
      );
      expect(result.total).toBe(12800);
      expect(result.breakdown.addOnCount).toBe(1);
    });

    it("should calculate price with coupon code", async () => {
      const mockPriceWithCoupon: PriceCalculationResponse = {
        tierPrice: 9900,
        featuresPrice: 0,
        subtotal: 9900,
        bundleDiscounts: [],
        couponDiscount: {
          id: "coupon-1",
          name: "SAVE20",
          type: "percentage",
          value: 20,
          amount: 1980,
        },
        totalDiscount: 1980,
        tax: 0,
        total: 7920,
        currency: "USD",
        breakdown: {
          tier: {
            slug: "pro",
            name: "Pro",
            price: 9900,
            includedCount: 2,
          },
          addOnFeatures: [],
          addOnCount: 0,
        },
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockPriceWithCoupon));

      const result = await api.calculatePrice({
        tier: "pro",
        selectedFeatures: ["auth-email", "auth-oauth"],
        couponCode: "SAVE20",
      });

      expect(result.totalDiscount).toBe(1980);
      expect(result.couponDiscount?.code).toBeUndefined(); // code is in 'name'
      expect(result.total).toBe(7920);
    });
  });

  // =====================================================
  // Preview API Tests
  // =====================================================

  describe("Preview API", () => {
    it("should create a preview session", async () => {
      const mockSession: CreatePreviewSessionResponse = {
        sessionId: "session-123",
        createdAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockSession, 201));

      const result = await api.createPreviewSession({
        tier: "pro",
        features: ["auth-email", "auth-oauth"],
        templateId: "tmpl-1",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/preview/session",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            tier: "pro",
            features: ["auth-email", "auth-oauth"],
            templateId: "tmpl-1",
          }),
        })
      );
      expect(result.sessionId).toBe("session-123");
    });

    it("should update a preview session", async () => {
      const mockUpdate: UpdatePreviewSessionResponse = {
        sessionId: "session-123",
        duration: 300000,
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockUpdate));

      const result = await api.updatePreviewSession("session-123", {
        duration: 300000,
        interactionCount: 15,
        convertedToCheckout: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/preview/session/session-123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            duration: 300000,
            interactionCount: 15,
            convertedToCheckout: true,
          }),
        })
      );
      expect(result.sessionId).toBe("session-123");
      expect(result.duration).toBe(300000);
    });

    it("should get preview config for a tier", async () => {
      const mockConfig: PreviewConfigResponse = {
        tier: "pro",
        tierName: "Pro",
        features: [
          { slug: "auth-email", name: "Email Authentication", category: "auth" },
          { slug: "auth-oauth", name: "OAuth Providers", category: "auth" },
        ],
        byCategory: {
          auth: [
            {
              slug: "auth-email",
              name: "Email Authentication",
              module: { category: "auth", name: "Authentication" },
            },
            {
              slug: "auth-oauth",
              name: "OAuth Providers",
              module: { category: "auth", name: "Authentication" },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockConfig));

      const result = await api.getPreviewConfig("pro");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/preview/config/pro",
        expect.any(Object)
      );
      expect(result.tier).toBe("pro");
      expect(result.features).toHaveLength(2);
      expect(result.byCategory.auth).toHaveLength(2);
    });
  });

  // =====================================================
  // Error Handling Tests
  // =====================================================

  describe("Error Handling", () => {
    it("should handle 400 Bad Request", async () => {
      mockFetch.mockResolvedValueOnce(
        createErrorResponse(400, "Invalid request", "VALIDATION_ERROR")
      );

      await expect(api.getFeatures()).rejects.toThrow(StudioApiError);
      await expect(api.getFeatures()).rejects.toMatchObject({
        status: 400,
        code: "VALIDATION_ERROR",
      });
    });

    it("should handle 401 Unauthorized", async () => {
      mockFetch.mockResolvedValueOnce(
        createErrorResponse(401, "Authentication required", "UNAUTHORIZED")
      );

      await expect(api.getFeatures()).rejects.toThrow(StudioApiError);
    });

    it("should handle 500 Internal Server Error", async () => {
      mockFetch.mockResolvedValueOnce(
        createErrorResponse(500, "Internal server error", "SERVER_ERROR")
      );

      await expect(api.getFeatures()).rejects.toThrow(StudioApiError);
      await expect(api.getFeatures()).rejects.toMatchObject({
        status: 500,
        isRetryable: true,
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failed"));

      await expect(api.getFeatures()).rejects.toThrow(StudioApiError);
      await expect(api.getFeatures()).rejects.toMatchObject({
        code: "NETWORK_ERROR",
      });
    });
  });

  // =====================================================
  // Retry Logic Tests
  // =====================================================

  describe("Retry Logic", () => {
    it("should retry on 500 errors when retries are enabled", async () => {
      const apiWithRetries = new StudioPublicApi({
        baseUrl: "http://localhost:3001/api",
        timeout: 5000,
        retries: 2,
        retryDelay: 10, // Short delay for testing
      });

      mockFetch
        .mockResolvedValueOnce(
          createErrorResponse(500, "Server error", "SERVER_ERROR")
        )
        .mockResolvedValueOnce(
          createErrorResponse(500, "Server error", "SERVER_ERROR")
        )
        .mockResolvedValueOnce(
          createJsonResponse<FeaturesResponse>({
            items: [],
            modules: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasMore: false,
            },
          })
        );

      const result = await apiWithRetries.getFeatures();

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.items).toHaveLength(0);
    });

    it("should not retry on 400 errors", async () => {
      const apiWithRetries = new StudioPublicApi({
        baseUrl: "http://localhost:3001/api",
        timeout: 5000,
        retries: 2,
      });

      mockFetch.mockResolvedValueOnce(
        createErrorResponse(400, "Bad request", "BAD_REQUEST")
      );

      await expect(apiWithRetries.getFeatures()).rejects.toThrow(StudioApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // =====================================================
  // Singleton Export Tests
  // =====================================================

  describe("Singleton Export", () => {
    it("should export a singleton instance", () => {
      expect(studioApi).toBeInstanceOf(StudioPublicApi);
    });

    it("should have all public API methods", () => {
      expect(typeof studioApi.getFeatures).toBe("function");
      expect(typeof studioApi.getFeature).toBe("function");
      expect(typeof studioApi.getTemplates).toBe("function");
      expect(typeof studioApi.getTemplate).toBe("function");
      expect(typeof studioApi.getPricingTiers).toBe("function");
      expect(typeof studioApi.getPricingTier).toBe("function");
      expect(typeof studioApi.calculatePrice).toBe("function");
      expect(typeof studioApi.createPreviewSession).toBe("function");
      expect(typeof studioApi.updatePreviewSession).toBe("function");
      expect(typeof studioApi.getPreviewConfig).toBe("function");
    });
  });
});

// =====================================================
// Integration Contract Tests
// =====================================================

describe("API Contract Tests", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("Request Headers", () => {
    it("should include Content-Type header", async () => {
      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ items: [], modules: [], pagination: {} })
      );

      const api = new StudioPublicApi({
        baseUrl: "http://localhost:3001/api",
        retries: 0,
      });
      await api.getFeatures();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should include x-request-id header", async () => {
      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ items: [], modules: [], pagination: {} })
      );

      const api = new StudioPublicApi({
        baseUrl: "http://localhost:3001/api",
        retries: 0,
      });
      await api.getFeatures();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-request-id": expect.any(String),
          }),
        })
      );
    });
  });

  describe("Endpoint Paths", () => {
    const api = new StudioPublicApi({
      baseUrl: "http://localhost:3001/api",
      retries: 0,
    });

    const endpointTests = [
      {
        name: "GET /features",
        call: () => api.getFeatures(),
        expectedUrl: "http://localhost:3001/api/features",
        expectedMethod: "GET",
      },
      {
        name: "GET /features/:slug",
        call: () => api.getFeature("test-feature"),
        expectedUrl: "http://localhost:3001/api/features/test-feature",
        expectedMethod: "GET",
      },
      {
        name: "GET /templates",
        call: () => api.getTemplates(),
        expectedUrl: "http://localhost:3001/api/templates",
        expectedMethod: "GET",
      },
      {
        name: "GET /templates/:slug",
        call: () => api.getTemplate("test-template"),
        expectedUrl: "http://localhost:3001/api/templates/test-template",
        expectedMethod: "GET",
      },
      {
        name: "GET /pricing/tiers",
        call: () => api.getPricingTiers(),
        expectedUrl: "http://localhost:3001/api/pricing/tiers",
        expectedMethod: "GET",
      },
      {
        name: "GET /pricing/tiers/:slug",
        call: () => api.getPricingTier("pro"),
        expectedUrl: "http://localhost:3001/api/pricing/tiers/pro",
        expectedMethod: "GET",
      },
      {
        name: "POST /pricing/calculate",
        call: () =>
          api.calculatePrice({ tier: "pro", selectedFeatures: [] }),
        expectedUrl: "http://localhost:3001/api/pricing/calculate",
        expectedMethod: "POST",
      },
      {
        name: "POST /preview/session",
        call: () =>
          api.createPreviewSession({ tier: "pro", features: [] }),
        expectedUrl: "http://localhost:3001/api/preview/session",
        expectedMethod: "POST",
      },
      {
        name: "PATCH /preview/session/:id",
        call: () => api.updatePreviewSession("session-1", { duration: 100 }),
        expectedUrl: "http://localhost:3001/api/preview/session/session-1",
        expectedMethod: "PATCH",
      },
      {
        name: "GET /preview/config/:tier",
        call: () => api.getPreviewConfig("pro"),
        expectedUrl: "http://localhost:3001/api/preview/config/pro",
        expectedMethod: "GET",
      },
    ];

    endpointTests.forEach(({ name, call, expectedUrl, expectedMethod }) => {
      it(`should call ${name} correctly`, async () => {
        mockFetch.mockResolvedValueOnce(createJsonResponse({}));

        await call().catch(() => {});

        expect(mockFetch).toHaveBeenCalledWith(
          expectedUrl,
          expect.objectContaining({
            method: expectedMethod,
          })
        );
      });
    });
  });
});
