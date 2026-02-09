import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * Send a successful response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  } satisfies ApiResponse<T>);
}

/**
 * Send a paginated response
 */
export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: PaginationInfo,
  message?: string
): Response {
  return res.status(200).json({
    success: true,
    data: {
      items,
      pagination,
    },
    message,
  } satisfies ApiResponse<PaginatedData<T>>);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code = "ERROR",
  details?: unknown
): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  } satisfies ApiResponse);
}

/**
 * Create pagination info from query params
 */
export function createPaginationInfo(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

/**
 * Parse pagination params from query
 */
export function parsePaginationParams(query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "10", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
