import { Response, NextFunction } from "express";
import crypto from "crypto";
import { AppRequest } from "../types";
import { logger } from "../lib/logger";
import { config } from "../config";

/**
 * CSRF Error Codes
 */
export const CsrfErrorCodes = {
  CSRF_TOKEN_MISSING: "CSRF_TOKEN_MISSING",
  CSRF_TOKEN_INVALID: "CSRF_TOKEN_INVALID",
} as const;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Methods that require CSRF protection (state-changing operations)
 */
const PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Paths that are exempt from CSRF validation
 * (e.g., public auth endpoints, webhooks)
 */
const CSRF_EXEMPT_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/health",
  "/api/v1/webhooks", // Common webhook path
];

/**
 * Check if the request path is exempt from CSRF validation
 */
function isExemptPath(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some((exemptPath) => {
    // Exact match or starts with (for webhook paths)
    return path === exemptPath || path.startsWith(`${exemptPath}/`);
  });
}

/**
 * Extract CSRF token from request
 * Checks header first (x-csrf-token or x-xsrf-token), then body
 */
function extractCsrfToken(req: AppRequest): string | undefined {
  // Check headers first (preferred method)
  const headerToken =
    req.headers["x-csrf-token"] ||
    req.headers["x-xsrf-token"] ||
    req.headers["csrf-token"];

  if (typeof headerToken === "string" && headerToken.length > 0) {
    return headerToken;
  }

  // Check body as fallback
  if (req.body && typeof req.body._csrf === "string") {
    return req.body._csrf;
  }

  return undefined;
}

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(req: AppRequest): string | undefined {
  return req.cookies?.csrfToken;
}

/**
 * CSRF Protection Middleware
 *
 * Validates CSRF tokens on state-changing requests (POST, PUT, PATCH, DELETE).
 * The token must match the one stored in the user's session cookie.
 *
 * Token flow:
 * 1. Server generates CSRF token on login and sets it as a non-httpOnly cookie
 * 2. Client reads the cookie and includes the token in the x-csrf-token header
 * 3. Server validates that the header token matches the cookie token
 */
export function csrfProtection(
  req: AppRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
  if (!PROTECTED_METHODS.includes(req.method)) {
    return next();
  }

  // Skip CSRF check for exempt paths
  if (isExemptPath(req.path)) {
    return next();
  }

  // Skip CSRF check in development if configured
  if (config.isDevelopment() && process.env.SKIP_CSRF === "true") {
    logger.warn("CSRF protection skipped in development mode");
    return next();
  }

  // Get the token from the cookie (set during login)
  const cookieToken = getCsrfTokenFromCookie(req);

  // Get the token from the request (header or body)
  const requestToken = extractCsrfToken(req);

  // Validate tokens exist
  if (!cookieToken || !requestToken) {
    logger.warn("CSRF token missing", {
      path: req.path,
      method: req.method,
      hasCookieToken: !!cookieToken,
      hasRequestToken: !!requestToken,
    });

    res.status(403).json({
      success: false,
      error: {
        code: CsrfErrorCodes.CSRF_TOKEN_MISSING,
        message: "CSRF token is required",
      },
    });
    return;
  }

  // Use timing-safe comparison to prevent timing attacks
  const cookieTokenBuffer = Buffer.from(cookieToken);
  const requestTokenBuffer = Buffer.from(requestToken);

  // Validate tokens match (timing-safe comparison)
  if (
    cookieTokenBuffer.length !== requestTokenBuffer.length ||
    !crypto.timingSafeEqual(cookieTokenBuffer, requestTokenBuffer)
  ) {
    logger.warn("CSRF token mismatch", {
      path: req.path,
      method: req.method,
    });

    res.status(403).json({
      success: false,
      error: {
        code: CsrfErrorCodes.CSRF_TOKEN_INVALID,
        message: "Invalid CSRF token",
      },
    });
    return;
  }

  // Store token on request for potential use
  req.csrfToken = cookieToken;

  next();
}

/**
 * Middleware to attach CSRF token to response locals
 * Useful for server-rendered pages
 */
export function attachCsrfToken(
  req: AppRequest,
  res: Response,
  next: NextFunction
): void {
  const token = getCsrfTokenFromCookie(req) || generateCsrfToken();

  // Set the token in cookie if not present
  if (!req.cookies?.csrfToken) {
    res.cookie("csrfToken", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  // Make available in response locals for templates
  res.locals.csrfToken = token;

  next();
}
