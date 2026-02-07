/**
 * Sentry Middleware for Express
 *
 * Premium tier feature providing:
 * - Request handler (adds request context to Sentry events)
 * - Error handler (captures unhandled errors)
 * - Tracing middleware (performance monitoring)
 *
 * Usage:
 *   import { sentryRequestHandler, sentryErrorHandler, sentryTracingMiddleware } from './middleware/sentry.middleware';
 *
 *   // Add at the very beginning of your middleware stack
 *   app.use(sentryRequestHandler);
 *   app.use(sentryTracingMiddleware);
 *
 *   // Your routes here...
 *
 *   // Add at the very end, before your error handler
 *   app.use(sentryErrorHandler);
 */

import type { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from 'express';
import { errorTracking, getRequestContext } from '../services/error-tracking.service';

// =============================================================================
// Types
// =============================================================================

export interface SentryMiddlewareOptions {
  /** Skip certain paths from tracing */
  ignorePaths?: string[];
  /** Skip certain paths from error tracking */
  ignoreErrorPaths?: string[];
  /** Include request body in error context */
  includeBody?: boolean;
  /** Include query params in error context */
  includeQuery?: boolean;
  /** Custom user extractor from request */
  extractUser?: (req: Request) => { id?: string; email?: string; username?: string } | null;
  /** Custom function to determine if an error should be captured */
  shouldCaptureError?: (error: Error) => boolean;
}

// =============================================================================
// Default Options
// =============================================================================

const defaultOptions: SentryMiddlewareOptions = {
  ignorePaths: ['/health', '/healthz', '/ready', '/readyz', '/metrics', '/favicon.ico'],
  ignoreErrorPaths: [],
  includeBody: false,
  includeQuery: true,
  extractUser: (req: Request) => {
    const user = (req as Request & { user?: { id?: string; email?: string } }).user;
    return user ? { id: user.id, email: user.email } : null;
  },
  shouldCaptureError: () => true,
};

// =============================================================================
// Request Handler Middleware
// =============================================================================

/**
 * Request handler middleware that adds request context to Sentry events.
 * Should be added at the very beginning of your middleware stack.
 */
export function createSentryRequestHandler(options: SentryMiddlewareOptions = {}): RequestHandler {
  const opts = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip ignored paths
    if (opts.ignorePaths?.some((path) => req.path.startsWith(path))) {
      next();
      return;
    }

    // Extract user context
    const user = opts.extractUser?.(req);
    if (user) {
      errorTracking.setUser(user);
    }

    // Add request breadcrumb
    errorTracking.addBreadcrumb({
      category: 'http',
      message: `${req.method} ${req.path}`,
      level: 'info',
      type: 'http',
      data: {
        method: req.method,
        url: req.originalUrl || req.url,
        ...(opts.includeQuery && { query: req.query }),
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
        },
      },
    });

    // Set request context
    errorTracking.setContext('request', {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: opts.includeQuery ? req.query : undefined,
      body: opts.includeBody ? req.body : undefined,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-request-id': req.headers['x-request-id'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        host: req.headers.host,
      },
      ip: req.ip,
    });

    // Track response for breadcrumb
    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: unknown, encoding?: BufferEncoding | (() => void), callback?: () => void) {
      errorTracking.addBreadcrumb({
        category: 'http',
        message: `Response: ${res.statusCode}`,
        level: res.statusCode >= 400 ? 'warning' : 'info',
        type: 'http',
        data: {
          statusCode: res.statusCode,
          url: req.originalUrl || req.url,
        },
      });

      if (typeof encoding === 'function') {
        return originalEnd(chunk, encoding);
      }
      return originalEnd(chunk, encoding, callback);
    };

    next();
  };
}

/**
 * Default request handler with default options
 */
export const sentryRequestHandler: RequestHandler = createSentryRequestHandler();

// =============================================================================
// Error Handler Middleware
// =============================================================================

/**
 * Error handler middleware that captures unhandled errors to Sentry.
 * Should be added at the very end of your middleware stack, before your error handler.
 */
export function createSentryErrorHandler(options: SentryMiddlewareOptions = {}): ErrorRequestHandler {
  const opts = { ...defaultOptions, ...options };

  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    // Skip ignored paths
    if (opts.ignoreErrorPaths?.some((path) => req.path.startsWith(path))) {
      next(err);
      return;
    }

    // Check if error should be captured
    if (opts.shouldCaptureError && !opts.shouldCaptureError(err)) {
      next(err);
      return;
    }

    // Get request context
    const context = getRequestContext({
      method: req.method,
      url: req.originalUrl || req.url,
      headers: req.headers as Record<string, string>,
      ip: req.ip,
      user: opts.extractUser?.(req) || undefined,
    });

    // Add additional context
    context.extra = {
      ...context.extra,
      ...(opts.includeQuery && { query: req.query }),
      ...(opts.includeBody && { body: req.body }),
      params: req.params,
    };

    // Capture the exception
    const eventId = errorTracking.captureException(err, context);

    // Add event ID to response headers for debugging
    if (eventId) {
      res.setHeader('X-Sentry-Event-Id', eventId);
    }

    // Pass error to next handler
    next(err);
  };
}

/**
 * Default error handler with default options
 */
export const sentryErrorHandler: ErrorRequestHandler = createSentryErrorHandler();

// =============================================================================
// Tracing Middleware
// =============================================================================

/**
 * Tracing middleware for performance monitoring.
 * Should be added early in your middleware stack, after the request handler.
 */
export function createSentryTracingMiddleware(options: SentryMiddlewareOptions = {}): RequestHandler {
  const opts = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip ignored paths
    if (opts.ignorePaths?.some((path) => req.path.startsWith(path))) {
      next();
      return;
    }

    // Start transaction
    const transaction = errorTracking.startTransaction({
      name: `${req.method} ${req.route?.path || req.path}`,
      op: 'http.server',
      description: `${req.method} ${req.originalUrl || req.url}`,
      tags: {
        'http.method': req.method,
        'http.url': req.originalUrl || req.url,
      },
    });

    if (!transaction) {
      next();
      return;
    }

    // Store transaction on request for access in route handlers
    (req as Request & { transaction?: typeof transaction }).transaction = transaction;

    // Track response
    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: unknown, encoding?: BufferEncoding | (() => void), callback?: () => void) {
      // Set final transaction data
      transaction.setTag('http.status_code', String(res.statusCode));
      transaction.setData('http.response_content_length', res.get('Content-Length') || '0');

      // Finish transaction
      transaction.finish();

      if (typeof encoding === 'function') {
        return originalEnd(chunk, encoding);
      }
      return originalEnd(chunk, encoding, callback);
    };

    next();
  };
}

/**
 * Default tracing middleware with default options
 */
export const sentryTracingMiddleware: RequestHandler = createSentryTracingMiddleware();

// =============================================================================
// Helper: Wrap Async Route Handlers
// =============================================================================

/**
 * Wrap an async route handler to automatically capture errors
 */
export function wrapAsync(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      errorTracking.captureException(error, getRequestContext(req));
      next(error);
    });
  };
}

// =============================================================================
// Helper: Create Child Span
// =============================================================================

/**
 * Create a child span for the current transaction
 */
export function createSpan(
  req: Request,
  context: { op: string; description?: string }
): { finish: () => void; setTag: (key: string, value: string) => void } | null {
  const transaction = (req as Request & { transaction?: { startChild: (ctx: { op: string; description?: string }) => unknown } }).transaction;
  if (!transaction) {
    return null;
  }

  const span = transaction.startChild(context);
  return span as { finish: () => void; setTag: (key: string, value: string) => void };
}

// =============================================================================
// Exports
// =============================================================================

export default {
  createSentryRequestHandler,
  createSentryErrorHandler,
  createSentryTracingMiddleware,
  sentryRequestHandler,
  sentryErrorHandler,
  sentryTracingMiddleware,
  wrapAsync,
  createSpan,
};
