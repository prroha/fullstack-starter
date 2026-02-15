/**
 * Controller Helper Utilities
 *
 * Reusable utilities for controller operations to reduce code duplication.
 * Provides common patterns for validation, pagination, exports, and error handling.
 */

import { Response } from "express";
import { z, ZodSchema, ZodError } from "zod";
import { AppRequest, AuthenticatedRequest } from "../types/index.js";
import { errorResponse, ErrorCodes } from "./response.js";
import { exportService, CsvColumn } from "../services/export.service.js";

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Result of a safe validation operation
 */
export interface SafeValidationResult<T> {
  success: boolean;
  data?: T;
  error?: ZodError;
}

/**
 * Safely validate request body with a Zod schema
 * Returns a result object instead of throwing
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): SafeValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate and send error response if validation fails
 * Returns the validated data or null if validation failed (response already sent)
 */
export function validateOrRespond<T>(
  schema: ZodSchema<T>,
  data: unknown,
  res: Response
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    res.status(400).json(
      errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "Invalid input",
        result.error.flatten()
      )
    );
    return null;
  }
  return result.data;
}

// ============================================================================
// Common Parameter Validation Schemas
// ============================================================================

/**
 * Common pagination query schema with sensible defaults
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Common sort query schema
 */
export function createSortSchema<T extends readonly string[]>(
  sortByOptions: T,
  defaultSortBy: T[number] = "createdAt"
) {
  return z.object({
    sortBy: z.enum(sortByOptions as unknown as [string, ...string[]]).optional().default(defaultSortBy),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  });
}

// ============================================================================
// Pagination Helpers
// ============================================================================

/**
 * Pagination parameters for database queries
 */
export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

/**
 * Calculate pagination parameters from page and limit
 */
export function calculatePagination(page: number, limit: number): PaginationParams {
  const sanitizedPage = Math.max(1, page);
  const sanitizedLimit = Math.min(100, Math.max(1, limit));
  return {
    skip: (sanitizedPage - 1) * sanitizedLimit,
    take: sanitizedLimit,
    page: sanitizedPage,
    limit: sanitizedLimit,
  };
}

/**
 * Parse and calculate pagination from request query
 */
export function getPaginationFromQuery(query: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  const page = typeof query.page === "string" ? parseInt(query.page, 10) : (query.page ?? 1);
  const limit = typeof query.limit === "string" ? parseInt(query.limit, 10) : (query.limit ?? 20);
  return calculatePagination(page, limit);
}

// ============================================================================
// Resource Existence Helpers
// ============================================================================

/**
 * Send a 404 Not Found response with consistent formatting
 */
export function sendNotFound(res: Response, resourceName: string): void {
  res.status(404).json(
    errorResponse(ErrorCodes.NOT_FOUND, `${resourceName} not found`)
  );
}

/**
 * Send a 400 Bad Request response for missing required parameter
 */
export function sendMissingParam(res: Response, paramName: string): void {
  res.status(400).json(
    errorResponse(ErrorCodes.VALIDATION_ERROR, `${paramName} is required`)
  );
}

/**
 * Send a 409 Conflict response for duplicate resources
 */
export function sendConflict(res: Response, message: string): void {
  res.status(409).json(errorResponse(ErrorCodes.CONFLICT, message));
}

/**
 * Check if resource exists and send 404 if not
 * Returns true if resource exists, false if 404 was sent
 */
export function ensureExists<T>(
  resource: T | null | undefined,
  res: Response,
  resourceName: string
): resource is T {
  if (!resource) {
    sendNotFound(res, resourceName);
    return false;
  }
  return true;
}

/**
 * Check if required parameter exists and send 400 if not
 * Returns true if parameter exists, false if 400 was sent
 */
export function ensureParam(
  param: string | undefined | null,
  res: Response,
  paramName: string
): param is string {
  if (!param) {
    sendMissingParam(res, paramName);
    return false;
  }
  return true;
}

// ============================================================================
// CSV Export Helpers
// ============================================================================

/**
 * Options for CSV export response
 */
export interface CsvExportOptions {
  /** Filename prefix (without extension or timestamp) */
  filenamePrefix: string;
  /** Optional: include timestamp in filename (default: true) */
  includeTimestamp?: boolean;
}

/**
 * Send CSV export response with proper headers
 */
export function sendCsvExport<T>(
  res: Response,
  data: T[],
  columns: CsvColumn<T>[],
  options: CsvExportOptions
): void {
  const timestamp = options.includeTimestamp !== false
    ? `-${new Date().toISOString().split("T")[0]}`
    : "";
  const filename = `${options.filenamePrefix}${timestamp}.csv`;

  const csv = exportService.exportToCsv(data, columns);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

// ============================================================================
// Request Context Helpers
// ============================================================================

/**
 * Get authenticated user from request or throw
 */
export function getAuthUser(req: AppRequest): AuthenticatedRequest["dbUser"] {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.dbUser) {
    throw new Error("User not authenticated");
  }
  return authReq.dbUser;
}

/**
 * Get authenticated user ID from request or throw
 */
export function getAuthUserId(req: AppRequest): string {
  return getAuthUser(req).id;
}

/**
 * Get user ID from JWT payload or return null
 */
export function getUserIdFromToken(req: AppRequest): string | undefined {
  return (req as AuthenticatedRequest).user?.userId;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if request is authenticated
 */
export function isAuthenticatedRequest(req: AppRequest): req is AuthenticatedRequest {
  return !!(req as AuthenticatedRequest).user && !!(req as AuthenticatedRequest).dbUser;
}
