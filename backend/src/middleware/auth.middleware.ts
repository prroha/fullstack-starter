import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { db } from "../lib/db";
import { User, UserRole } from "@prisma/client";
import { logger } from "../lib/logger";

/**
 * Extended request type with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  dbUser: User;
}

/**
 * Error codes for authentication failures
 */
export const AuthErrorCodes = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_AUTH_FORMAT: "INVALID_AUTH_FORMAT",
  TOKEN_MISSING: "TOKEN_MISSING",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  ADMIN_REQUIRED: "ADMIN_REQUIRED",
} as const;

interface AuthErrorResponse {
  error: string;
  code: keyof typeof AuthErrorCodes;
}

function sendAuthError(
  res: Response,
  status: number,
  message: string,
  code: keyof typeof AuthErrorCodes
): void {
  const response: AuthErrorResponse = { error: message, code };
  res.status(status).json(response);
}

/**
 * Extract bearer token from authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (scheme.toLowerCase() !== "bearer") return null;

  return token || null;
}

/**
 * Extract access token from request (cookie or header)
 */
function extractAccessToken(req: Request): string | null {
  // First, try httpOnly cookie
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) return cookieToken;

  // Fallback to Authorization header
  return extractBearerToken(req.headers.authorization);
}

/**
 * Authentication middleware - requires valid JWT token
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractAccessToken(req);

    if (!token || token.trim() === "") {
      sendAuthError(res, 401, "Authentication required", "AUTH_REQUIRED");
      return;
    }

    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid token";

      if (message.includes("expired")) {
        sendAuthError(res, 401, "Token expired", "TOKEN_EXPIRED");
      } else {
        sendAuthError(res, 401, "Invalid token", "INVALID_TOKEN");
      }
      return;
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      sendAuthError(res, 401, "User not found", "USER_NOT_FOUND");
      return;
    }

    if (!user.isActive) {
      sendAuthError(
        res,
        403,
        "Your account has been deactivated. Please contact support.",
        "USER_DEACTIVATED"
      );
      return;
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = payload;
    (req as AuthenticatedRequest).dbUser = user;

    next();
  } catch (error) {
    logger.error("Auth middleware error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    sendAuthError(res, 401, "Authentication failed", "INVALID_TOKEN");
  }
}

/**
 * Admin middleware - requires ADMIN role
 * Must be used AFTER authMiddleware
 */
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user || !authReq.dbUser) {
    sendAuthError(res, 401, "Authentication required", "AUTH_REQUIRED");
    return;
  }

  if (authReq.dbUser.role !== UserRole.ADMIN) {
    sendAuthError(res, 403, "Admin access required", "ADMIN_REQUIRED");
    return;
  }

  next();
}

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      next();
      return;
    }

    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      next();
      return;
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      next();
      return;
    }

    (req as AuthenticatedRequest).user = payload;
    (req as AuthenticatedRequest).dbUser = user;

    next();
  } catch {
    next();
  }
}

/**
 * Helper to check if request is authenticated
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  const authReq = req as AuthenticatedRequest;
  return !!authReq.user && !!authReq.dbUser;
}

/**
 * Helper to get authenticated user from request
 */
export function getAuthenticatedUser(req: Request): {
  payload: JwtPayload;
  user: User;
} {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user || !authReq.dbUser) {
    throw new Error("User not authenticated");
  }

  return {
    payload: authReq.user,
    user: authReq.dbUser,
  };
}
