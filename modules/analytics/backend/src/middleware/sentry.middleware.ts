/**
 * Sentry Middleware for Fastify
 *
 * Premium tier feature providing:
 * - Request hook (adds request context to Sentry events)
 * - Error handler (captures unhandled errors)
 * - Tracing hook (performance monitoring)
 *
 * Usage:
 *   import { registerSentryHooks } from './middleware/sentry.middleware.js';
 *
 *   // Register on your Fastify instance
 *   registerSentryHooks(fastify);
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { errorTracking, getRequestContext } from '../services/error-tracking.service.js';

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
  extractUser?: (req: FastifyRequest) => { id?: string; email?: string; username?: string } | null;
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
  extractUser: (req: FastifyRequest) => {
    const user = (req as FastifyRequest & { user?: { id?: string; email?: string } }).user;
    return user ? { id: user.id, email: user.email } : null;
  },
  shouldCaptureError: () => true,
};

// =============================================================================
// Register Sentry Hooks
// =============================================================================

/**
 * Register all Sentry hooks on a Fastify instance.
 * Replaces the Express request handler, error handler, and tracing middleware.
 */
export function registerSentryHooks(
  fastify: FastifyInstance,
  options: SentryMiddlewareOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };

  // ---------------------------------------------------------------------------
  // onRequest hook — replaces sentryRequestHandler
  // ---------------------------------------------------------------------------
  fastify.addHook('onRequest', async (req: FastifyRequest, _reply: FastifyReply) => {
    // Skip ignored paths
    if (opts.ignorePaths?.some((path) => req.url.startsWith(path))) {
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
      message: `${req.method} ${req.url}`,
      level: 'info',
      type: 'http',
      data: {
        method: req.method,
        url: req.url,
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
      url: req.url,
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
  });

  // ---------------------------------------------------------------------------
  // onResponse hook — adds response breadcrumb
  // ---------------------------------------------------------------------------
  fastify.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    if (opts.ignorePaths?.some((path) => req.url.startsWith(path))) {
      return;
    }

    errorTracking.addBreadcrumb({
      category: 'http',
      message: `Response: ${reply.statusCode}`,
      level: reply.statusCode >= 400 ? 'warning' : 'info',
      type: 'http',
      data: {
        statusCode: reply.statusCode,
        url: req.url,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // onError hook — replaces sentryErrorHandler
  // ---------------------------------------------------------------------------
  fastify.addHook('onError', async (req: FastifyRequest, reply: FastifyReply, error: Error) => {
    // Skip ignored paths
    if (opts.ignoreErrorPaths?.some((path) => req.url.startsWith(path))) {
      return;
    }

    // Check if error should be captured
    if (opts.shouldCaptureError && !opts.shouldCaptureError(error)) {
      return;
    }

    // Get request context
    const context = getRequestContext({
      method: req.method,
      url: req.url,
      headers: req.headers as Record<string, string>,
      ip: req.ip,
      user: opts.extractUser?.(req) || undefined,
    });

    // Add additional context
    context.extra = {
      ...context.extra,
      ...(opts.includeQuery && { query: req.query }),
      ...(opts.includeBody && { body: req.body }),
      params: (req as FastifyRequest & { params?: unknown }).params,
    };

    // Capture the exception
    const eventId = errorTracking.captureException(error, context);

    // Add event ID to response headers for debugging
    if (eventId) {
      reply.header('X-Sentry-Event-Id', eventId);
    }
  });

  // ---------------------------------------------------------------------------
  // Tracing hooks — replaces sentryTracingMiddleware
  // ---------------------------------------------------------------------------
  fastify.addHook('onRequest', async (req: FastifyRequest, _reply: FastifyReply) => {
    if (opts.ignorePaths?.some((path) => req.url.startsWith(path))) {
      return;
    }

    // Start transaction
    const transaction = errorTracking.startTransaction({
      name: `${req.method} ${req.url}`,
      op: 'http.server',
      description: `${req.method} ${req.url}`,
      tags: {
        'http.method': req.method,
        'http.url': req.url,
      },
    });

    if (transaction) {
      // Store transaction on request for access in route handlers
      (req as FastifyRequest & { transaction?: typeof transaction }).transaction = transaction;
    }
  });

  fastify.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    const transaction = (req as FastifyRequest & { transaction?: { finish: () => void; setTag: (k: string, v: string) => void; setData: (k: string, v: string) => void } }).transaction;
    if (transaction) {
      transaction.setTag('http.status_code', String(reply.statusCode));
      transaction.setData('http.response_content_length', reply.getHeader('Content-Length')?.toString() || '0');
      transaction.finish();
    }
  });
}

// =============================================================================
// Helper: Create Child Span
// =============================================================================

/**
 * Create a child span for the current transaction
 */
export function createSpan(
  req: FastifyRequest,
  context: { op: string; description?: string }
): { finish: () => void; setTag: (key: string, value: string) => void } | null {
  const transaction = (req as FastifyRequest & { transaction?: { startChild: (ctx: { op: string; description?: string }) => unknown } }).transaction;
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
  registerSentryHooks,
  createSpan,
};
