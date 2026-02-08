import rateLimit, { RateLimitRequestHandler, Options } from "express-rate-limit";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { config } from "../config";
import { AppRequest } from "../types";

// ============================================================================
// Types & Interfaces
// ============================================================================

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
 * Sliding window entry for tracking requests
 */
interface SlidingWindowEntry {
  timestamps: number[];
  points: number;
}

/**
 * Plan-based rate limit configuration
 */
interface PlanLimitConfig {
  requests: number;
  window: string; // e.g., '1m', '1h', '1d'
}

/**
 * User plan type
 */
type UserPlan = "free" | "basic" | "pro" | "enterprise";

/**
 * Rate limit info for headers
 */
interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
}

/**
 * Store interface for rate limiting
 */
interface RateLimitStore {
  get(key: string): Promise<SlidingWindowEntry | null>;
  set(key: string, entry: SlidingWindowEntry, windowMs: number): Promise<void>;
  increment(key: string, points: number, windowMs: number): Promise<SlidingWindowEntry>;
  close(): Promise<void>;
}

// ============================================================================
// Plan Limits Configuration
// ============================================================================

/**
 * Rate limits by subscription plan
 */
export const PLAN_LIMITS: Record<UserPlan, PlanLimitConfig> = {
  free: { requests: 100, window: "1m" },
  basic: { requests: 500, window: "1m" },
  pro: { requests: 2000, window: "1m" },
  enterprise: { requests: 10000, window: "1m" },
};

/**
 * Default endpoint costs for cost-based limiting
 */
export const DEFAULT_ENDPOINT_COSTS: Record<string, number> = {
  default: 1,
  "file-upload": 5,
  search: 3,
  "heavy-query": 3,
  export: 5,
  import: 5,
  "bulk-operation": 10,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse window string (e.g., '1m', '15m', '1h', '1d') to milliseconds
 */
export function parseWindowString(window: string): number {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid window format: ${window}. Use format like '1m', '15m', '1h', '1d'`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
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
 * Get user plan from request
 */
function getUserPlan(req: Request): UserPlan {
  const appReq = req as AppRequest & { user?: { plan?: string } };
  const plan = appReq.user?.plan;

  if (plan && plan in PLAN_LIMITS) {
    return plan as UserPlan;
  }

  return "free";
}

/**
 * Set rate limit headers on response
 */
function setRateLimitHeaders(res: Response, info: RateLimitInfo): void {
  res.setHeader("X-RateLimit-Limit", info.limit);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, info.remaining));
  res.setHeader("X-RateLimit-Reset", info.resetTime);
}

/**
 * Set Retry-After header for 429 responses
 */
function setRetryAfterHeader(res: Response, retryAfterSeconds: number): void {
  res.setHeader("Retry-After", retryAfterSeconds);
}

// ============================================================================
// In-Memory Store Implementation
// ============================================================================

/**
 * In-memory store for sliding window rate limiting
 */
class MemoryStore implements RateLimitStore {
  private store: Map<string, SlidingWindowEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get(key: string): Promise<SlidingWindowEntry | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, entry: SlidingWindowEntry, _windowMs: number): Promise<void> {
    this.store.set(key, entry);
  }

  async increment(key: string, points: number, windowMs: number): Promise<SlidingWindowEntry> {
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = this.store.get(key);

    if (!entry) {
      entry = { timestamps: [], points: 0 };
    }

    // Filter out timestamps outside the window (sliding window)
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    // Add new timestamp and points
    entry.timestamps.push(now);
    entry.points = entry.timestamps.length * points;

    // Recalculate total points based on remaining timestamps
    // For cost-based, we need to track points separately
    // Here we store cumulative points for the window

    this.store.set(key, entry);
    return entry;
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const maxWindowMs = 24 * 60 * 60 * 1000; // 24 hours max

    for (const [key, entry] of this.store.entries()) {
      // Remove entries with no recent timestamps
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - maxWindowMs) {
        this.store.delete(key);
      }
    }
  }
}

// ============================================================================
// Redis Store Implementation (Optional)
// ============================================================================

/**
 * Redis store for sliding window rate limiting
 * Uses sorted sets for efficient sliding window implementation
 */
class RedisStore implements RateLimitStore {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(private redisUrl: string) {}

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.initConnection();
    return this.connectionPromise;
  }

  private async initConnection(): Promise<void> {
    try {
      // Dynamic import to avoid requiring redis if not used
      const redis = await import("redis");
      this.client = redis.createClient({ url: this.redisUrl }) as unknown as RedisClientType;

      this.client.on("error", (err: unknown) => {
        const error = err as Error;
        console.error("[rate-limit] Redis client error:", error.message);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        // Use warn level for informational startup messages (allowed by linter)
        console.warn("[rate-limit] Redis connected");
        this.isConnected = true;
      });

      this.client.on("disconnect", () => {
        console.warn("[rate-limit] Redis disconnected");
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error("[rate-limit] Failed to connect to Redis:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async get(key: string): Promise<SlidingWindowEntry | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.zRangeWithScores(key, 0, -1);

      if (!data || data.length === 0) {
        return null;
      }

      const timestamps = data.map((item: { score: number }) => item.score);
      const points = data.reduce((sum: number, item: { value: string }) => sum + parseInt(item.value, 10), 0);

      return { timestamps, points };
    } catch (error) {
      console.error("[rate-limit] Redis get error:", error);
      return null;
    }
  }

  async set(key: string, entry: SlidingWindowEntry, windowMs: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const pipeline = this.client.multi();

      // Clear existing data
      pipeline.del(key);

      // Add all timestamps with their points as scores
      for (const ts of entry.timestamps) {
        pipeline.zAdd(key, { score: ts, value: "1" });
      }

      // Set expiry
      pipeline.expire(key, Math.ceil(windowMs / 1000) + 60);

      await pipeline.exec();
    } catch (error) {
      console.error("[rate-limit] Redis set error:", error);
    }
  }

  async increment(key: string, points: number, windowMs: number): Promise<SlidingWindowEntry> {
    if (!this.isConnected || !this.client) {
      return { timestamps: [], points: 0 };
    }

    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      const pipeline = this.client.multi();

      // Remove old entries outside the window
      pipeline.zRemRangeByScore(key, 0, windowStart);

      // Add new entry with points as the value
      pipeline.zAdd(key, { score: now, value: String(points) });

      // Get all entries in window
      pipeline.zRangeWithScores(key, 0, -1);

      // Set expiry
      pipeline.expire(key, Math.ceil(windowMs / 1000) + 60);

      const results = await pipeline.exec();

      // Parse results - the zRangeWithScores result is at index 2
      const rangeResult = results[2] as Array<{ score: number; value: string }> | null;

      if (!rangeResult) {
        return { timestamps: [now], points };
      }

      const timestamps = rangeResult.map((item) => item.score);
      const totalPoints = rangeResult.reduce((sum, item) => sum + parseInt(item.value, 10), 0);

      return { timestamps, points: totalPoints };
    } catch (error) {
      console.error("[rate-limit] Redis increment error:", error);
      return { timestamps: [], points: 0 };
    }
  }

  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Type for Redis client (minimal interface)
interface RedisClientType {
  connect(): Promise<void>;
  quit(): Promise<void>;
  on(event: string, callback: (arg?: unknown) => void): void;
  zRangeWithScores(key: string, start: number, end: number): Promise<Array<{ score: number; value: string }>>;
  zRemRangeByScore(key: string, min: number, max: number): Promise<number>;
  zAdd(key: string, member: { score: number; value: string }): Promise<number>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  multi(): RedisMultiType;
}

interface RedisMultiType {
  del(key: string): RedisMultiType;
  zAdd(key: string, member: { score: number; value: string }): RedisMultiType;
  zRemRangeByScore(key: string, min: number, max: number): RedisMultiType;
  zRangeWithScores(key: string, start: number, end: number): RedisMultiType;
  expire(key: string, seconds: number): RedisMultiType;
  exec(): Promise<unknown[]>;
}

// ============================================================================
// Store Factory
// ============================================================================

let sharedStore: RateLimitStore | null = null;

/**
 * Get or create the rate limit store
 * Uses Redis if REDIS_URL is set, otherwise falls back to memory
 */
export async function getStore(): Promise<RateLimitStore> {
  if (sharedStore) {
    return sharedStore;
  }

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const redisStore = new RedisStore(redisUrl);
      await redisStore.connect();
      sharedStore = redisStore;
      // Use warn level for informational startup messages (allowed by linter)
      console.warn("[rate-limit] Using Redis store");
      return sharedStore;
    } catch (error) {
      console.warn("[rate-limit] Redis connection failed, falling back to memory store:", error);
    }
  }

  sharedStore = new MemoryStore();
  // Use warn level for informational startup messages (allowed by linter)
  console.warn("[rate-limit] Using in-memory store");
  return sharedStore;
}

/**
 * Create a store synchronously (for immediate use)
 * Prefers memory store for synchronous creation
 */
function createSyncStore(): MemoryStore {
  return new MemoryStore();
}

// ============================================================================
// Sliding Window Rate Limiter
// ============================================================================

/**
 * Create a sliding window rate limiter
 * More accurate than fixed window as it considers the actual time window
 */
export function createSlidingWindowLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: "ip" | "user" | ((req: Request) => string);
  errorCode?: string;
  errorMessage?: string;
  store?: RateLimitStore;
}): RequestHandler {
  const {
    windowMs,
    maxRequests,
    keyGenerator = "ip",
    errorCode = "RATE_LIMIT_EXCEEDED",
    errorMessage = "Too many requests, please try again later",
  } = options;

  // Use sync store if not provided
  const store = options.store || createSyncStore();

  let keyGen: (req: Request) => string;
  if (keyGenerator === "ip") {
    keyGen = getIpBasedKeyGenerator;
  } else if (keyGenerator === "user") {
    keyGen = getUserBasedKeyGenerator;
  } else {
    keyGen = keyGenerator;
  }

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `ratelimit:sliding:${keyGen(req)}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Increment with 1 point (standard request)
      const entry = await store.increment(key, 1, windowMs);

      // Count requests in the current window
      const requestCount = entry.timestamps.filter((ts) => ts > windowStart).length;

      // Calculate reset time
      const resetTime = Math.ceil((now + windowMs) / 1000);

      // Set rate limit headers
      const rateLimitInfo: RateLimitInfo = {
        limit: maxRequests,
        remaining: maxRequests - requestCount,
        resetTime,
      };
      setRateLimitHeaders(res, rateLimitInfo);

      if (requestCount > maxRequests) {
        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        setRetryAfterHeader(res, retryAfterSeconds);

        res.status(429).json({
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            retryAfter: retryAfterSeconds,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // Graceful degradation: log error but allow request
      console.error("[rate-limit] Sliding window error (allowing request):", error);
      next();
    }
  };
}

// ============================================================================
// Cost-Based Rate Limiter
// ============================================================================

/**
 * Sliding window entry with cost tracking
 */
interface CostTrackingEntry {
  requests: Array<{ timestamp: number; cost: number }>;
  totalCost: number;
}

/**
 * In-memory store for cost-based rate limiting
 */
class CostBasedMemoryStore {
  private store: Map<string, CostTrackingEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  increment(key: string, cost: number, windowMs: number): CostTrackingEntry {
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = this.store.get(key);

    if (!entry) {
      entry = { requests: [], totalCost: 0 };
    }

    // Filter out requests outside the window (sliding window)
    entry.requests = entry.requests.filter((r) => r.timestamp > windowStart);

    // Add new request
    entry.requests.push({ timestamp: now, cost });

    // Recalculate total cost
    entry.totalCost = entry.requests.reduce((sum, r) => sum + r.cost, 0);

    this.store.set(key, entry);
    return entry;
  }

  get(key: string): CostTrackingEntry | null {
    return this.store.get(key) || null;
  }

  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const maxWindowMs = 24 * 60 * 60 * 1000;

    for (const [key, entry] of this.store.entries()) {
      if (entry.requests.length === 0 || entry.requests[entry.requests.length - 1].timestamp < now - maxWindowMs) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Create a cost-based rate limiter
 * Different endpoints can have different costs
 */
export function createCostBasedLimiter(
  costs: Record<string, number>,
  options?: {
    windowMs?: number;
    maxPoints?: number;
    keyGenerator?: "ip" | "user" | ((req: Request) => string);
    getCostKey?: (req: Request) => string;
    errorCode?: string;
    errorMessage?: string;
  }
): RequestHandler {
  const {
    windowMs = 60000, // 1 minute default
    maxPoints = 100, // 100 points default
    keyGenerator = "user",
    getCostKey = (req: Request) => {
      // Default: use route path or a header to determine cost
      const costHeader = req.headers["x-request-cost-key"];
      if (typeof costHeader === "string") {
        return costHeader;
      }
      return "default";
    },
    errorCode = "RATE_LIMIT_EXCEEDED",
    errorMessage = "Rate limit exceeded. Some operations cost more points.",
  } = options || {};

  const store = new CostBasedMemoryStore();

  let keyGen: (req: Request) => string;
  if (keyGenerator === "ip") {
    keyGen = getIpBasedKeyGenerator;
  } else if (keyGenerator === "user") {
    keyGen = getUserBasedKeyGenerator;
  } else {
    keyGen = keyGenerator;
  }

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `ratelimit:cost:${keyGen(req)}`;
      const costKey = getCostKey(req);
      const cost = costs[costKey] ?? costs.default ?? 1;

      const now = Date.now();

      // Increment with the request cost
      const entry = store.increment(key, cost, windowMs);

      // Calculate reset time
      const resetTime = Math.ceil((now + windowMs) / 1000);

      // Set rate limit headers (in terms of points)
      const rateLimitInfo: RateLimitInfo = {
        limit: maxPoints,
        remaining: maxPoints - entry.totalCost,
        resetTime,
      };
      setRateLimitHeaders(res, rateLimitInfo);

      // Also add custom header for point cost
      res.setHeader("X-RateLimit-Cost", cost);

      if (entry.totalCost > maxPoints) {
        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        setRetryAfterHeader(res, retryAfterSeconds);

        res.status(429).json({
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            retryAfter: retryAfterSeconds,
            pointsUsed: entry.totalCost,
            pointsLimit: maxPoints,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // Graceful degradation: log error but allow request
      console.error("[rate-limit] Cost-based limiter error (allowing request):", error);
      next();
    }
  };
}

// ============================================================================
// Plan-Based Rate Limiter
// ============================================================================

/**
 * Create a plan-based rate limiter
 * Different limits based on user subscription tier
 */
export function createPlanBasedLimiter(options?: {
  planLimits?: Record<UserPlan, PlanLimitConfig>;
  keyGenerator?: "ip" | "user" | ((req: Request) => string);
  getPlan?: (req: Request) => UserPlan;
  errorCode?: string;
  errorMessage?: string;
}): RequestHandler {
  const {
    planLimits = PLAN_LIMITS,
    keyGenerator = "user",
    getPlan = getUserPlan,
    errorCode = "RATE_LIMIT_EXCEEDED",
    errorMessage = "Rate limit exceeded for your plan",
  } = options || {};

  const store = new CostBasedMemoryStore();

  let keyGen: (req: Request) => string;
  if (keyGenerator === "ip") {
    keyGen = getIpBasedKeyGenerator;
  } else if (keyGenerator === "user") {
    keyGen = getUserBasedKeyGenerator;
  } else {
    keyGen = keyGenerator;
  }

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = getPlan(req);
      const limits = planLimits[plan] || planLimits.free;
      const windowMs = parseWindowString(limits.window);
      const maxRequests = limits.requests;

      const key = `ratelimit:plan:${plan}:${keyGen(req)}`;
      const now = Date.now();

      // Increment with 1 point
      const entry = store.increment(key, 1, windowMs);
      const requestCount = entry.requests.length;

      // Calculate reset time
      const resetTime = Math.ceil((now + windowMs) / 1000);

      // Set rate limit headers
      const rateLimitInfo: RateLimitInfo = {
        limit: maxRequests,
        remaining: maxRequests - requestCount,
        resetTime,
      };
      setRateLimitHeaders(res, rateLimitInfo);

      // Add plan-specific header
      res.setHeader("X-RateLimit-Plan", plan);

      if (requestCount > maxRequests) {
        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        setRetryAfterHeader(res, retryAfterSeconds);

        res.status(429).json({
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            retryAfter: retryAfterSeconds,
            plan,
            limit: maxRequests,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // Graceful degradation: log error but allow request
      console.error("[rate-limit] Plan-based limiter error (allowing request):", error);
      next();
    }
  };
}

// ============================================================================
// Legacy Fixed Window Limiters (Backward Compatibility)
// ============================================================================

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

// ============================================================================
// Enhanced Rate Limiter with Headers (wrapper for existing limiters)
// ============================================================================

/**
 * Wrap any rate limiter to add standard rate limit headers
 */
export function withRateLimitHeaders(
  limiter: RequestHandler,
  options: { limit: number; windowMs: number }
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const resetTime = Math.ceil((now + options.windowMs) / 1000);

    // Set default headers (will be overwritten if limiter provides more accurate info)
    res.setHeader("X-RateLimit-Limit", options.limit);
    res.setHeader("X-RateLimit-Reset", resetTime);

    // Call original limiter
    limiter(req, res, next);
  };
}

// ============================================================================
// Graceful Degradation Wrapper
// ============================================================================

/**
 * Wrap a rate limiter with graceful degradation
 * If the limiter fails, log the error and allow the request
 */
export function withGracefulDegradation(
  limiter: RequestHandler,
  options?: { onError?: (error: Error, req: Request) => void }
): RequestHandler {
  const { onError } = options || {};

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await new Promise<void>((resolve, reject) => {
        limiter(req, res, (err?: unknown) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[rate-limit] Rate limiter failed (allowing request):", err.message);

      if (onError) {
        onError(err, req);
      }

      // Allow the request to proceed
      next();
    }
  };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Cleanup rate limit stores (call on app shutdown)
 */
export async function cleanupRateLimitStores(): Promise<void> {
  if (sharedStore) {
    await sharedStore.close();
    sharedStore = null;
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

export {
  getUserBasedKeyGenerator,
  getIpBasedKeyGenerator,
  getUserPlan,
  setRateLimitHeaders,
  setRetryAfterHeader,
};

export type {
  RateLimitErrorResponse,
  RateLimitInfo,
  RateLimitStore,
  PlanLimitConfig,
  UserPlan,
  SlidingWindowEntry,
  CostTrackingEntry,
};
