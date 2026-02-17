import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAuditService, AuditLevel, AuditCategory } from '../services/audit.service.js';

// =============================================================================
// Types
// =============================================================================

interface AuditMiddlewareOptions {
  /** Extract user ID from request */
  getUserId?: (req: FastifyRequest) => string | undefined;
  /** Extract user email from request */
  getUserEmail?: (req: FastifyRequest) => string | undefined;
  /** Determine the action name from the request */
  getAction?: (req: FastifyRequest) => string;
  /** Determine the category from the request */
  getCategory?: (req: FastifyRequest) => AuditCategory;
  /** Determine the log level based on response */
  getLevel?: (req: FastifyRequest, reply: FastifyReply) => AuditLevel;
  /** Skip logging for certain requests */
  skip?: (req: FastifyRequest) => boolean;
  /** Additional metadata to include */
  getMetadata?: (req: FastifyRequest, reply: FastifyReply) => Record<string, unknown>;
}

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

// =============================================================================
// Register Audit Hooks
// =============================================================================

/**
 * Register audit logging hooks on a Fastify instance
 */
export function registerAuditHooks(fastify: FastifyInstance, options: AuditMiddlewareOptions = {}) {
  const audit = getAuditService();

  const {
    getUserId = defaultGetUserId,
    getUserEmail = defaultGetUserEmail,
    getAction = defaultGetAction,
    getCategory = defaultGetCategory,
    getLevel = defaultGetLevel,
    skip = defaultSkip,
    getMetadata = defaultGetMetadata,
  } = options;

  fastify.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    // Check if should skip logging
    if (skip(req) || audit.shouldExcludePath(req.url)) {
      return;
    }

    // Calculate duration from request start
    const duration = reply.elapsedTime;

    // Log asynchronously
    audit
      .log({
        level: getLevel(req, reply),
        action: getAction(req),
        category: getCategory(req),
        userId: getUserId(req),
        userEmail: getUserEmail(req),
        method: req.method,
        path: req.url,
        statusCode: reply.statusCode,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
        duration,
        metadata: getMetadata(req, reply),
        error: reply.statusCode >= 400 ? undefined : undefined,
      })
      .catch((err) => {
        console.error('[AuditMiddleware] Logging error:', err);
      });
  });
}

// =============================================================================
// Default Extractors
// =============================================================================

function defaultGetUserId(req: FastifyRequest): string | undefined {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.id;
}

function defaultGetUserEmail(req: FastifyRequest): string | undefined {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.email;
}

function defaultGetAction(req: FastifyRequest): string {
  // Convert path to action name
  // e.g., POST /api/v1/users -> api.users.create
  //       GET /api/v1/users/123 -> api.users.read
  //       PUT /api/v1/users/123 -> api.users.update
  //       DELETE /api/v1/users/123 -> api.users.delete

  const method = req.method.toLowerCase();
  const pathParts = req.url
    .replace(/^\/api\/v\d+\/?/, '') // Remove /api/v1
    .split('/')
    .filter((p) => p && !p.match(/^[0-9a-f-]+$/i)); // Remove UUIDs/IDs

  const resource = pathParts.join('.') || 'root';

  const methodMap: Record<string, string> = {
    get: 'read',
    post: 'create',
    put: 'update',
    patch: 'update',
    delete: 'delete',
    options: 'options',
    head: 'head',
  };

  const action = methodMap[method] || method;
  return `api.${resource}.${action}`;
}

function defaultGetCategory(req: FastifyRequest): AuditCategory {
  const path = req.url.toLowerCase();

  if (path.includes('/auth')) return 'auth';
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/user')) return 'user';
  if (path.includes('/payment') || path.includes('/subscription')) return 'payment';
  if (path.includes('/upload') || path.includes('/file')) return 'system';

  return 'api';
}

function defaultGetLevel(req: FastifyRequest, reply: FastifyReply): AuditLevel {
  const statusCode = reply.statusCode;
  const path = req.url.toLowerCase();

  // Security-related paths
  if (
    path.includes('/auth') ||
    path.includes('/login') ||
    path.includes('/password') ||
    path.includes('/token')
  ) {
    if (statusCode >= 400) return 'security';
  }

  // Admin actions
  if (path.includes('/admin') && req.method !== 'GET') {
    return 'warning';
  }

  // Error responses
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warning';

  return 'info';
}

function defaultSkip(req: FastifyRequest): boolean {
  // Skip OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') return true;

  // Skip static files
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/)) {
    return true;
  }

  return false;
}

function defaultGetMetadata(req: FastifyRequest, _reply: FastifyReply): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  // Add query parameters (filtered)
  if (req.query && Object.keys(req.query as Record<string, unknown>).length > 0) {
    metadata.query = filterSensitiveData(req.query as Record<string, unknown>);
  }

  // Add route params if present
  if (req.params && Object.keys(req.params as Record<string, unknown>).length > 0) {
    metadata.params = req.params;
  }

  // Add request ID if present
  const requestId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  if (requestId) {
    metadata.requestId = requestId;
  }

  return metadata;
}

// =============================================================================
// Helpers
// =============================================================================

function getClientIp(req: FastifyRequest): string {
  // Handle proxied requests
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedStr.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return req.ip || 'unknown';
}

function filterSensitiveData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      filtered[key] = '[REDACTED]';
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

// =============================================================================
// Action-Specific Hooks
// =============================================================================

/**
 * Log a specific action with custom details (use as preHandler)
 */
export function logAction(
  action: string,
  options: {
    category?: AuditCategory;
    level?: AuditLevel;
    getTargetId?: (req: FastifyRequest) => string | undefined;
    getTargetType?: (req: FastifyRequest) => string | undefined;
    getMetadata?: (req: FastifyRequest) => Record<string, unknown>;
  } = {}
) {
  const audit = getAuditService();

  return async (req: FastifyRequest, _reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    await audit.log({
      action,
      category: options.category || 'api',
      level: options.level || 'info',
      userId: authReq.user?.id,
      userEmail: authReq.user?.email,
      targetId: options.getTargetId?.(req),
      targetType: options.getTargetType?.(req),
      method: req.method,
      path: req.url,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      metadata: options.getMetadata?.(req),
    });
  };
}

/**
 * Log security events
 */
export function logSecurityEvent(
  action: string,
  getMetadata?: (req: FastifyRequest) => Record<string, unknown>
) {
  return logAction(action, {
    category: 'security',
    level: 'security',
    getMetadata,
  });
}

export default registerAuditHooks;
