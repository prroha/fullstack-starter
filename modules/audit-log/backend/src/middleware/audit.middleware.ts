import { Request, Response, NextFunction } from 'express';
import { getAuditService, AuditLevel, AuditCategory } from '../services/audit.service';

// =============================================================================
// Types
// =============================================================================

interface AuditMiddlewareOptions {
  /** Extract user ID from request */
  getUserId?: (req: Request) => string | undefined;
  /** Extract user email from request */
  getUserEmail?: (req: Request) => string | undefined;
  /** Determine the action name from the request */
  getAction?: (req: Request) => string;
  /** Determine the category from the request */
  getCategory?: (req: Request) => AuditCategory;
  /** Determine the log level based on response */
  getLevel?: (req: Request, res: Response) => AuditLevel;
  /** Skip logging for certain requests */
  skip?: (req: Request) => boolean;
  /** Additional metadata to include */
  getMetadata?: (req: Request, res: Response) => Record<string, unknown>;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Create audit logging middleware
 */
export function auditMiddleware(options: AuditMiddlewareOptions = {}) {
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

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check if should skip logging
    if (skip(req) || audit.shouldExcludePath(req.path)) {
      next();
      return;
    }

    // Record start time
    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Capture response
    let responseBody: string | undefined;

    // Override end to capture response
    res.end = function (
      this: Response,
      chunk?: unknown,
      encoding?: BufferEncoding | (() => void),
      callback?: () => void
    ): Response {
      if (chunk && typeof chunk === 'string') {
        responseBody = chunk;
      } else if (chunk && Buffer.isBuffer(chunk)) {
        responseBody = chunk.toString('utf8');
      }

      // Call original end
      if (typeof encoding === 'function') {
        return originalEnd.call(this, chunk, encoding) as Response;
      }
      return originalEnd.call(this, chunk, encoding as BufferEncoding | undefined, callback) as Response;
    };

    // Continue with request
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      // Log asynchronously
      audit
        .log({
          level: getLevel(req, res),
          action: getAction(req),
          category: getCategory(req),
          userId: getUserId(req),
          userEmail: getUserEmail(req),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          ipAddress: getClientIp(req),
          userAgent: req.get('user-agent'),
          duration,
          metadata: getMetadata(req, res),
          error: res.statusCode >= 400 ? extractError(responseBody) : undefined,
        })
        .catch((err) => {
          console.error('[AuditMiddleware] Logging error:', err);
        });
    });

    next();
  };
}

// =============================================================================
// Default Extractors
// =============================================================================

function defaultGetUserId(req: Request): string | undefined {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.id;
}

function defaultGetUserEmail(req: Request): string | undefined {
  const authReq = req as AuthenticatedRequest;
  return authReq.user?.email;
}

function defaultGetAction(req: Request): string {
  // Convert path to action name
  // e.g., POST /api/v1/users -> api.users.create
  //       GET /api/v1/users/123 -> api.users.read
  //       PUT /api/v1/users/123 -> api.users.update
  //       DELETE /api/v1/users/123 -> api.users.delete

  const method = req.method.toLowerCase();
  const pathParts = req.path
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

function defaultGetCategory(req: Request): AuditCategory {
  const path = req.path.toLowerCase();

  if (path.includes('/auth')) return 'auth';
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/user')) return 'user';
  if (path.includes('/payment') || path.includes('/subscription')) return 'payment';
  if (path.includes('/upload') || path.includes('/file')) return 'system';

  return 'api';
}

function defaultGetLevel(req: Request, res: Response): AuditLevel {
  const statusCode = res.statusCode;
  const path = req.path.toLowerCase();

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

function defaultSkip(req: Request): boolean {
  // Skip OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') return true;

  // Skip static files
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/)) {
    return true;
  }

  return false;
}

function defaultGetMetadata(req: Request, _res: Response): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  // Add query parameters (filtered)
  if (Object.keys(req.query).length > 0) {
    metadata.query = filterSensitiveData(req.query);
  }

  // Add route params if present
  if (Object.keys(req.params).length > 0) {
    metadata.params = req.params;
  }

  // Add request ID if present
  const requestId = req.get('x-request-id') || req.get('x-correlation-id');
  if (requestId) {
    metadata.requestId = requestId;
  }

  return metadata;
}

// =============================================================================
// Helpers
// =============================================================================

function getClientIp(req: Request): string {
  // Handle proxied requests
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

function extractError(responseBody: string | undefined): string | undefined {
  if (!responseBody) return undefined;

  try {
    const parsed = JSON.parse(responseBody);
    return parsed.error?.message || parsed.error || parsed.message;
  } catch {
    return undefined;
  }
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
// Action-Specific Middleware
// =============================================================================

/**
 * Log a specific action with custom details
 */
export function logAction(
  action: string,
  options: {
    category?: AuditCategory;
    level?: AuditLevel;
    getTargetId?: (req: Request) => string | undefined;
    getTargetType?: (req: Request) => string | undefined;
    getMetadata?: (req: Request) => Record<string, unknown>;
  } = {}
) {
  const audit = getAuditService();

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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
      path: req.path,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      metadata: options.getMetadata?.(req),
    });

    next();
  };
}

/**
 * Log security events
 */
export function logSecurityEvent(
  action: string,
  getMetadata?: (req: Request) => Record<string, unknown>
) {
  return logAction(action, {
    category: 'security',
    level: 'security',
    getMetadata,
  });
}

export default auditMiddleware;
