import rateLimit, { RateLimitRequestHandler, Options } from "express-rate-limit";
import { Request, Response } from "express";
import { config } from "../config";
import { AppRequest } from "../types";

/**
 * Rate limit error response format
 */
interface RateLimitErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}

/**
 * Create the rate limit error response
 */
function createRateLimitResponse(retryAfterMs: number): RateLimitErrorResponse {
  return {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later",
      retryAfter: Math.ceil(retryAfterMs / 1000),
    },
  };
}

/**
 * Custom key generator that uses user ID for authenticated requests
 * Falls back to IP address for unauthenticated requests
 */
function getUserBasedKeyGenerator(req: Request): string {
  const appReq = req as AppRequest;

  // Use user ID if authenticated
  if (appReq.user?.userId) {
    return `user:${appReq.user.userId}`;
  }

  // Fall back to IP address
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  return `ip:${ip}`;
}

/**
 * Custom key generator that uses only IP address
 */
function getIpBasedKeyGenerator(req: Request): string {
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  return `ip:${ip}`;
}

/**
 * General rate limiter for all API endpoints
 * Uses the configured limits from environment
 */
export const generalRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: createRateLimitResponse(config.rateLimit.windowMs),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getIpBasedKeyGenerator,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(createRateLimitResponse(config.rateLimit.windowMs));
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: createRateLimitResponse(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getIpBasedKeyGenerator,
  skipSuccessfulRequests: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        message: "Too many authentication attempts, please try again in 15 minutes",
        retryAfter: 15 * 60,
      },
    });
  },
});

/**
 * User-based rate limiter for authenticated routes
 * Limits requests per user rather than per IP
 */
export const userRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per user
  message: createRateLimitResponse(60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserBasedKeyGenerator,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: "USER_RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please slow down",
        retryAfter: 60,
      },
    });
  },
});

/**
 * Sensitive operations rate limiter
 * For operations like password change, account deletion, etc.
 */
export const sensitiveRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: createRateLimitResponse(60 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserBasedKeyGenerator,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: "SENSITIVE_RATE_LIMIT_EXCEEDED",
        message: "Too many attempts for this sensitive operation, please try again later",
        retryAfter: 60 * 60,
      },
    });
  },
});

/**
 * API key rate limiter (if using API keys)
 * Higher limits for programmatic access
 */
export const apiKeyRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: createRateLimitResponse(60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const apiKey = req.headers["x-api-key"];
    if (typeof apiKey === "string" && apiKey.length > 0) {
      return `apikey:${apiKey}`;
    }
    return getIpBasedKeyGenerator(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: "API_RATE_LIMIT_EXCEEDED",
        message: "API rate limit exceeded",
        retryAfter: 60,
      },
    });
  },
});

/**
 * Create a custom rate limiter with specific options
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: "ip" | "user" | ((req: Request) => string);
  errorCode?: string;
  errorMessage?: string;
}): RateLimitRequestHandler {
  const {
    windowMs,
    maxRequests,
    keyGenerator = "ip",
    errorCode = "RATE_LIMIT_EXCEEDED",
    errorMessage = "Too many requests, please try again later",
  } = options;

  let keyGen: (req: Request) => string;
  if (keyGenerator === "ip") {
    keyGen = getIpBasedKeyGenerator;
  } else if (keyGenerator === "user") {
    keyGen = getUserBasedKeyGenerator;
  } else {
    keyGen = keyGenerator;
  }

  const rateLimitOptions: Partial<Options> = {
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        retryAfter: Math.ceil(windowMs / 1000),
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGen,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    },
  };

  return rateLimit(rateLimitOptions);
}

/**
 * Skip rate limiting for certain conditions
 * Can be used to whitelist certain IPs or API keys
 */
export function createSkipCondition(options: {
  whitelistedIps?: string[];
  whitelistedApiKeys?: string[];
}): (req: Request) => boolean {
  const { whitelistedIps = [], whitelistedApiKeys = [] } = options;

  return (req: Request): boolean => {
    // Skip for whitelisted IPs
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      "";
    if (whitelistedIps.includes(ip)) {
      return true;
    }

    // Skip for whitelisted API keys
    const apiKey = req.headers["x-api-key"];
    if (typeof apiKey === "string" && whitelistedApiKeys.includes(apiKey)) {
      return true;
    }

    return false;
  };
}
