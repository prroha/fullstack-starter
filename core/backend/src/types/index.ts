import { Request } from "express";
import { User } from "@prisma/client";

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
 * User type for authenticated requests (subset of Prisma User)
 */
export type AuthUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "isActive" | "createdAt" | "updatedAt"
>;

/**
 * Base application request interface extending Express Request
 * Used for type-safe request handling across middleware
 */
export interface AppRequest extends Request {
  /**
   * JWT payload (set by auth middleware after token verification)
   */
  user?: JwtPayload;
  /**
   * Full database user object (set by auth middleware after user lookup)
   */
  dbUser?: User;
  /**
   * CSRF token for this request (set by CSRF middleware)
   */
  csrfToken?: string;
}

/**
 * Authenticated request with guaranteed user info
 * Use this type after authMiddleware has run
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  dbUser: User;
  csrfToken?: string;
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
