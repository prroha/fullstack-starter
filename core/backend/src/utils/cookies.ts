/**
 * Cookie Configuration Utilities
 *
 * Centralized cookie settings and helper functions.
 * Ensures consistent cookie configuration across the application.
 */

import { CookieOptions, Response } from "express";

// ============================================================================
// Cookie Durations (in milliseconds)
// ============================================================================

export const COOKIE_DURATIONS = {
  /** Access token: 7 days */
  ACCESS_TOKEN: 7 * 24 * 60 * 60 * 1000,
  /** Refresh token: 30 days */
  REFRESH_TOKEN: 30 * 24 * 60 * 60 * 1000,
  /** CSRF token: 7 days (same as access token) */
  CSRF_TOKEN: 7 * 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// Cookie Names
// ============================================================================

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  CSRF_TOKEN: "csrfToken",
} as const;

// ============================================================================
// Base Cookie Options
// ============================================================================

const isProduction = process.env.NODE_ENV === "production";

/**
 * Base options for HTTP-only cookies (access and refresh tokens)
 */
export const httpOnlyCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
};

/**
 * Options for access token cookie
 */
export const accessTokenCookieOptions: CookieOptions = {
  ...httpOnlyCookieOptions,
  maxAge: COOKIE_DURATIONS.ACCESS_TOKEN,
};

/**
 * Options for refresh token cookie
 */
export const refreshTokenCookieOptions: CookieOptions = {
  ...httpOnlyCookieOptions,
  maxAge: COOKIE_DURATIONS.REFRESH_TOKEN,
};

/**
 * Options for CSRF token cookie (readable by JavaScript)
 */
export const csrfTokenCookieOptions: CookieOptions = {
  httpOnly: false, // Must be readable by JS to send in header
  secure: isProduction,
  sameSite: "strict",
  maxAge: COOKIE_DURATIONS.CSRF_TOKEN,
};

// ============================================================================
// Cookie Helper Functions
// ============================================================================

/**
 * Auth tokens that can be set on response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken?: string;
}

/**
 * Set all authentication cookies on response
 */
export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, accessTokenCookieOptions);
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, refreshTokenCookieOptions);

  if (tokens.csrfToken) {
    res.cookie(COOKIE_NAMES.CSRF_TOKEN, tokens.csrfToken, csrfTokenCookieOptions);
  }
}

/**
 * Clear all authentication cookies
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN);
  res.clearCookie(COOKIE_NAMES.CSRF_TOKEN);
}

/**
 * Extract refresh token from request (cookie or body)
 */
export function extractRefreshToken(req: {
  cookies?: { refreshToken?: string };
  body?: { refreshToken?: string };
}): string | undefined {
  return req.cookies?.refreshToken || req.body?.refreshToken;
}
