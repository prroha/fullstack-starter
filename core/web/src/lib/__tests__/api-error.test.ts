import { describe, it, expect } from "vitest";

// We need to mock the logger and constants before importing ApiError
vi.mock("../logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("../constants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../constants")>();
  return {
    ...actual,
  };
});

import { vi } from "vitest";
import { ApiError } from "../api";

describe("ApiError", () => {
  describe("constructor", () => {
    it("should create an error with status, message, and code", () => {
      const err = new ApiError(404, "Not found", "NOT_FOUND");
      expect(err.status).toBe(404);
      expect(err.message).toBe("Not found");
      expect(err.code).toBe("NOT_FOUND");
      expect(err.name).toBe("ApiError");
      expect(err).toBeInstanceOf(Error);
    });

    it("should default isRetryable to false", () => {
      const err = new ApiError(400, "Bad request");
      expect(err.isRetryable).toBe(false);
    });

    it("should store details and requestId", () => {
      const details = { field: "email" };
      const err = new ApiError(422, "Validation", "VALIDATION", details, false, "req-123");
      expect(err.details).toEqual(details);
      expect(err.requestId).toBe("req-123");
    });
  });

  describe("fromResponse", () => {
    it("should create error from API response data", () => {
      const err = ApiError.fromResponse(400, {
        error: { message: "Invalid email", code: "VALIDATION_ERROR", details: { field: "email" } },
      });
      expect(err.status).toBe(400);
      expect(err.message).toBe("Invalid email");
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.isRetryable).toBe(false);
    });

    it("should mark 5xx errors as retryable", () => {
      const err = ApiError.fromResponse(500, {
        error: { message: "Server error" },
      });
      expect(err.isRetryable).toBe(true);
    });

    it("should mark 429 as retryable", () => {
      const err = ApiError.fromResponse(429, {
        error: { message: "Too many requests" },
      });
      expect(err.isRetryable).toBe(true);
    });

    it("should use fallback message when error data is missing", () => {
      const err = ApiError.fromResponse(400, {});
      expect(err.message).toBe("Request failed");
    });
  });

  describe("networkError", () => {
    it("should create a network error with status 0 and retryable", () => {
      const err = ApiError.networkError("Connection failed");
      expect(err.status).toBe(0);
      expect(err.code).toBe("NETWORK_ERROR");
      expect(err.isRetryable).toBe(true);
    });

    it("should attach original error as cause", () => {
      const original = new TypeError("fetch failed");
      const err = ApiError.networkError("Connection failed", original);
      expect(err.cause).toBe(original);
    });
  });

  describe("timeoutError", () => {
    it("should create a timeout error with status 0 and retryable", () => {
      const err = ApiError.timeoutError("req-456");
      expect(err.status).toBe(0);
      expect(err.code).toBe("TIMEOUT_ERROR");
      expect(err.message).toBe("Request timed out");
      expect(err.isRetryable).toBe(true);
      expect(err.requestId).toBe("req-456");
    });
  });
});
