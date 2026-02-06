import { Request } from "express";

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated request with user info
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Pagination result
 */
export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
