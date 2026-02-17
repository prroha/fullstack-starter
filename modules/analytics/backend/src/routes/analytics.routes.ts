import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getAnalyticsService, AggregationPeriod } from '../services/analytics.service.js';

// =============================================================================
// Types
// =============================================================================

interface TrackEventRequest {
  event: string;
  properties?: Record<string, unknown>;
  sessionId?: string;
  timestamp?: string;
}

interface QueryEventsRequest {
  userId?: string;
  sessionId?: string;
  event?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface StatsRequest {
  period?: AggregationPeriod;
  startDate?: string;
  endDate?: string;
  event?: string;
  userId?: string;
}

interface ExportRequest {
  format?: 'json' | 'csv';
  startDate?: string;
  endDate?: string;
  events?: string[];
  userId?: string;
}

// Authenticated request type - import from your auth middleware or define here
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
  dbUser: {
    id: string;
    email: string;
    role: string;
  };
}

// =============================================================================
// Auth Middleware Import
// =============================================================================

// Import your auth middleware from the core backend
// Adjust the import path based on your project structure
// import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../../../../../core/backend/src/middleware/auth.middleware.js';

// Placeholder auth middleware - replace with your actual imports
const authMiddleware = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  // This is a placeholder - replace with actual auth middleware import
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      },
    });
  }
  // Placeholder - actual middleware would verify token and load user
};

const optionalAuthMiddleware = async (
  _req: FastifyRequest,
  _reply: FastifyReply
) => {
  // This is a placeholder - replace with actual optional auth middleware import
  // Attempts to authenticate but doesn't fail if no token
};

const adminMiddleware = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  // This is a placeholder - replace with actual admin middleware import
  const authReq = req as AuthenticatedRequest;
  if (!authReq.dbUser || authReq.dbUser.role !== 'ADMIN') {
    return reply.code(403).send({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin access required',
      },
    });
  }
};

// =============================================================================
// Response Helpers
// =============================================================================

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function successResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

function errorResponse(code: string, message: string, details?: unknown): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
}

// =============================================================================
// Plugin Setup
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  const analytics = getAnalyticsService();

  // =============================================================================
  // Public Endpoints (with optional auth)
  // =============================================================================

  /**
   * POST /analytics/track
   * Track an analytics event
   */
  fastify.post(
    '/track',
    { preHandler: [optionalAuthMiddleware] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { event, properties, sessionId, timestamp } = req.body as TrackEventRequest;

      // Validate required fields
      if (!event || typeof event !== 'string') {
        return reply.code(400).send(errorResponse(
          'VALIDATION_ERROR',
          'Event name is required and must be a string'
        ));
      }

      // Validate event name format
      if (event.length > 100) {
        return reply.code(400).send(errorResponse(
          'VALIDATION_ERROR',
          'Event name must be 100 characters or less'
        ));
      }

      // Get user ID from authenticated request if available
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId || null;

      // Parse timestamp if provided
      let eventTimestamp: Date | undefined;
      if (timestamp) {
        eventTimestamp = new Date(timestamp);
        if (isNaN(eventTimestamp.getTime())) {
          return reply.code(400).send(errorResponse(
            'VALIDATION_ERROR',
            'Invalid timestamp format'
          ));
        }
      }

      // Track the event
      const trackedEvent = await analytics.trackEvent({
        userId: userId || undefined,
        sessionId,
        event,
        properties,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: eventTimestamp,
      });

      if (!trackedEvent) {
        // Analytics is disabled
        return reply.code(200).send(successResponse(
          { tracked: false },
          'Analytics is disabled'
        ));
      }

      return reply.code(201).send(successResponse(
        {
          tracked: true,
          eventId: trackedEvent.id,
        },
        'Event tracked successfully'
      ));
    }
  );

  /**
   * POST /analytics/track/batch
   * Track multiple analytics events in a single request
   */
  fastify.post(
    '/track/batch',
    { preHandler: [optionalAuthMiddleware] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { events } = req.body as { events: TrackEventRequest[] };

      // Validate events array
      if (!Array.isArray(events) || events.length === 0) {
        return reply.code(400).send(errorResponse(
          'VALIDATION_ERROR',
          'Events must be a non-empty array'
        ));
      }

      if (events.length > 100) {
        return reply.code(400).send(errorResponse(
          'VALIDATION_ERROR',
          'Maximum 100 events per batch'
        ));
      }

      // Get user ID from authenticated request if available
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId || undefined;

      // Track all events
      const trackedEvents = events.map((e) => ({
        userId,
        sessionId: e.sessionId,
        event: e.event,
        properties: e.properties,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: e.timestamp ? new Date(e.timestamp) : undefined,
      }));

      const count = await analytics.trackBatch(trackedEvents);

      return reply.code(201).send(successResponse(
        {
          tracked: count,
          total: events.length,
        },
        `Tracked ${count} of ${events.length} events`
      ));
    }
  );

  // =============================================================================
  // Admin Endpoints
  // =============================================================================

  /**
   * GET /analytics/events
   * Query analytics events (admin only)
   */
  fastify.get(
    '/events',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const {
        userId,
        sessionId,
        event,
        startDate,
        endDate,
        page,
        limit,
      } = req.query as unknown as QueryEventsRequest;

      // Parse pagination
      const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
      const limitNum = Math.min(1000, Math.max(1, parseInt(String(limit || '50'), 10)));
      const offset = (pageNum - 1) * limitNum;

      // Parse dates
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      // Validate dates
      if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
        return reply.code(400).send(errorResponse(
          'VALIDATION_ERROR',
          'Invalid startDate format'
        ));
      }
      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        return reply.code(400).send(errorResponse(
          'VALIDATION_ERROR',
          'Invalid endDate format'
        ));
      }

      const result = await analytics.queryEvents({
        userId,
        sessionId,
        event,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        limit: limitNum,
        offset,
      });

      return reply.send(successResponse({
        events: result.events,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1,
        },
      }));
    }
  );

  /**
   * GET /analytics/stats
   * Get aggregated analytics statistics (admin only)
   */
  fastify.get(
    '/stats',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const {
        period,
        startDate,
        endDate,
        event,
        userId,
      } = req.query as unknown as StatsRequest;

      // Validate period
      const validPeriods: AggregationPeriod[] = ['hour', 'day', 'week', 'month'];
      const aggregationPeriod = validPeriods.includes(period as AggregationPeriod)
        ? (period as AggregationPeriod)
        : 'day';

      // Parse dates
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      const stats = await analytics.getStats({
        period: aggregationPeriod,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        event,
        userId,
      });

      return reply.send(successResponse({
        period: aggregationPeriod,
        stats,
      }));
    }
  );

  /**
   * GET /analytics/overview
   * Get overview statistics (admin only)
   */
  fastify.get(
    '/overview',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      // Parse dates
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      const overview = await analytics.getOverview(parsedStartDate, parsedEndDate);

      return reply.send(successResponse(overview));
    }
  );

  /**
   * GET /analytics/events/names
   * Get list of all distinct event names (admin only)
   */
  fastify.get(
    '/events/names',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const eventNames = await analytics.getEventNames();

      return reply.send(successResponse({
        events: eventNames,
      }));
    }
  );

  /**
   * GET /analytics/export
   * Export analytics events (admin only)
   */
  fastify.get(
    '/export',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const {
        format,
        startDate,
        endDate,
        events,
        userId,
      } = req.query as unknown as ExportRequest & { events?: string };

      // Validate format
      const exportFormat = format === 'csv' ? 'csv' : 'json';

      // Parse dates
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      // Parse events list
      const eventsList = events ? (events as string).split(',').map((e: string) => e.trim()) : undefined;

      const exportData = await analytics.exportEvents({
        format: exportFormat,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        events: eventsList,
        userId,
      });

      // Set appropriate content type and headers
      const contentType = exportFormat === 'csv' ? 'text/csv' : 'application/json';
      const filename = `analytics-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;

      return reply
        .header('Content-Type', contentType)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(exportData);
    }
  );

  /**
   * POST /analytics/cleanup
   * Clean up old events based on retention policy (admin only)
   */
  fastify.post(
    '/cleanup',
    { preHandler: [authMiddleware, adminMiddleware] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const deletedCount = await analytics.cleanupOldEvents();

      return reply.send(successResponse(
        { deletedCount },
        `Cleaned up ${deletedCount} old events`
      ));
    }
  );

  // =============================================================================
  // User-specific endpoints (authenticated users)
  // =============================================================================

  /**
   * GET /analytics/me/events
   * Get current user's analytics events
   */
  fastify.get(
    '/me/events',
    { preHandler: [authMiddleware] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.userId;

      const {
        event,
        startDate,
        endDate,
        page,
        limit,
      } = req.query as unknown as QueryEventsRequest;

      // Parse pagination (more restrictive for user endpoint)
      const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '50'), 10)));
      const offset = (pageNum - 1) * limitNum;

      // Parse dates
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      const result = await analytics.queryEvents({
        userId,
        event,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        limit: limitNum,
        offset,
      });

      return reply.send(successResponse({
        events: result.events,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1,
        },
      }));
    }
  );
};

export default routes;
