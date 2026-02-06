import { Router, Request, Response, NextFunction } from 'express';
import { getAnalyticsService, AggregationPeriod } from '../services/analytics.service';

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
interface AuthenticatedRequest extends Request {
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
// import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../../../../../core/backend/src/middleware/auth.middleware';

// Placeholder auth middleware - replace with your actual imports
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // This is a placeholder - replace with actual auth middleware import
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }
  // Placeholder - actual middleware would verify token and load user
  next();
};

const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  // This is a placeholder - replace with actual optional auth middleware import
  // Attempts to authenticate but doesn't fail if no token
  next();
};

const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // This is a placeholder - replace with actual admin middleware import
  const authReq = req as AuthenticatedRequest;
  if (!authReq.dbUser || authReq.dbUser.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin access required',
      },
    });
    return;
  }
  next();
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
// Router Setup
// =============================================================================

const router = Router();
const analytics = getAnalyticsService();

// =============================================================================
// Public Endpoints (with optional auth)
// =============================================================================

/**
 * POST /analytics/track
 * Track an analytics event
 *
 * Authentication: Optional (authenticated users get their userId attached)
 *
 * Request body:
 * {
 *   "event": "button_clicked",
 *   "properties": { "buttonId": "signup" },
 *   "sessionId": "sess_abc123",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 */
router.post(
  '/track',
  optionalAuthMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { event, properties, sessionId, timestamp } = req.body as TrackEventRequest;

      // Validate required fields
      if (!event || typeof event !== 'string') {
        res.status(400).json(errorResponse(
          'VALIDATION_ERROR',
          'Event name is required and must be a string'
        ));
        return;
      }

      // Validate event name format
      if (event.length > 100) {
        res.status(400).json(errorResponse(
          'VALIDATION_ERROR',
          'Event name must be 100 characters or less'
        ));
        return;
      }

      // Get user ID from authenticated request if available
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId || null;

      // Parse timestamp if provided
      let eventTimestamp: Date | undefined;
      if (timestamp) {
        eventTimestamp = new Date(timestamp);
        if (isNaN(eventTimestamp.getTime())) {
          res.status(400).json(errorResponse(
            'VALIDATION_ERROR',
            'Invalid timestamp format'
          ));
          return;
        }
      }

      // Track the event
      const trackedEvent = await analytics.trackEvent({
        userId: userId || undefined,
        sessionId,
        event,
        properties,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket.remoteAddress,
        timestamp: eventTimestamp,
      });

      if (!trackedEvent) {
        // Analytics is disabled
        res.status(200).json(successResponse(
          { tracked: false },
          'Analytics is disabled'
        ));
        return;
      }

      res.status(201).json(successResponse(
        {
          tracked: true,
          eventId: trackedEvent.id,
        },
        'Event tracked successfully'
      ));
    } catch (error) {
      console.error('[Analytics] Track error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to track event'
      ));
    }
  }
);

/**
 * POST /analytics/track/batch
 * Track multiple analytics events in a single request
 *
 * Authentication: Optional
 *
 * Request body:
 * {
 *   "events": [
 *     { "event": "page_view", "properties": { "page": "/home" } },
 *     { "event": "button_clicked", "properties": { "buttonId": "signup" } }
 *   ]
 * }
 */
router.post(
  '/track/batch',
  optionalAuthMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { events } = req.body as { events: TrackEventRequest[] };

      // Validate events array
      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json(errorResponse(
          'VALIDATION_ERROR',
          'Events must be a non-empty array'
        ));
        return;
      }

      if (events.length > 100) {
        res.status(400).json(errorResponse(
          'VALIDATION_ERROR',
          'Maximum 100 events per batch'
        ));
        return;
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
        ip: req.ip || req.socket.remoteAddress,
        timestamp: e.timestamp ? new Date(e.timestamp) : undefined,
      }));

      const count = await analytics.trackBatch(trackedEvents);

      res.status(201).json(successResponse(
        {
          tracked: count,
          total: events.length,
        },
        `Tracked ${count} of ${events.length} events`
      ));
    } catch (error) {
      console.error('[Analytics] Batch track error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to track events'
      ));
    }
  }
);

// =============================================================================
// Admin Endpoints
// =============================================================================

/**
 * GET /analytics/events
 * Query analytics events (admin only)
 *
 * Authentication: Required (Admin)
 *
 * Query parameters:
 * - userId: Filter by user ID
 * - sessionId: Filter by session ID
 * - event: Filter by event name
 * - startDate: Start date (ISO format)
 * - endDate: End date (ISO format)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 1000)
 */
router.get(
  '/events',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
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
        res.status(400).json(errorResponse(
          'VALIDATION_ERROR',
          'Invalid startDate format'
        ));
        return;
      }
      if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
        res.status(400).json(errorResponse(
          'VALIDATION_ERROR',
          'Invalid endDate format'
        ));
        return;
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

      res.json(successResponse({
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
    } catch (error) {
      console.error('[Analytics] Query events error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to query events'
      ));
    }
  }
);

/**
 * GET /analytics/stats
 * Get aggregated analytics statistics (admin only)
 *
 * Authentication: Required (Admin)
 *
 * Query parameters:
 * - period: Aggregation period ('hour', 'day', 'week', 'month') - default: 'day'
 * - startDate: Start date (ISO format)
 * - endDate: End date (ISO format)
 * - event: Filter by event name
 * - userId: Filter by user ID
 */
router.get(
  '/stats',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
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

      res.json(successResponse({
        period: aggregationPeriod,
        stats,
      }));
    } catch (error) {
      console.error('[Analytics] Get stats error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to get statistics'
      ));
    }
  }
);

/**
 * GET /analytics/overview
 * Get overview statistics (admin only)
 *
 * Authentication: Required (Admin)
 *
 * Query parameters:
 * - startDate: Start date (ISO format)
 * - endDate: End date (ISO format)
 */
router.get(
  '/overview',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      // Parse dates
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;

      const overview = await analytics.getOverview(parsedStartDate, parsedEndDate);

      res.json(successResponse(overview));
    } catch (error) {
      console.error('[Analytics] Get overview error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to get overview'
      ));
    }
  }
);

/**
 * GET /analytics/events/names
 * Get list of all distinct event names (admin only)
 *
 * Authentication: Required (Admin)
 */
router.get(
  '/events/names',
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const eventNames = await analytics.getEventNames();

      res.json(successResponse({
        events: eventNames,
      }));
    } catch (error) {
      console.error('[Analytics] Get event names error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to get event names'
      ));
    }
  }
);

/**
 * GET /analytics/export
 * Export analytics events (admin only)
 *
 * Authentication: Required (Admin)
 *
 * Query parameters:
 * - format: Export format ('json' or 'csv') - default: 'json'
 * - startDate: Start date (ISO format)
 * - endDate: End date (ISO format)
 * - events: Filter by event names (comma-separated)
 * - userId: Filter by user ID
 */
router.get(
  '/export',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
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
      const eventsList = events ? events.split(',').map((e) => e.trim()) : undefined;

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

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      console.error('[Analytics] Export error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to export events'
      ));
    }
  }
);

/**
 * POST /analytics/cleanup
 * Clean up old events based on retention policy (admin only)
 *
 * Authentication: Required (Admin)
 */
router.post(
  '/cleanup',
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const deletedCount = await analytics.cleanupOldEvents();

      res.json(successResponse(
        { deletedCount },
        `Cleaned up ${deletedCount} old events`
      ));
    } catch (error) {
      console.error('[Analytics] Cleanup error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to cleanup events'
      ));
    }
  }
);

// =============================================================================
// User-specific endpoints (authenticated users)
// =============================================================================

/**
 * GET /analytics/me/events
 * Get current user's analytics events
 *
 * Authentication: Required
 *
 * Query parameters:
 * - event: Filter by event name
 * - startDate: Start date (ISO format)
 * - endDate: End date (ISO format)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 */
router.get(
  '/me/events',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
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

      res.json(successResponse({
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
    } catch (error) {
      console.error('[Analytics] Get user events error:', error);
      res.status(500).json(errorResponse(
        'INTERNAL_ERROR',
        'Failed to get events'
      ));
    }
  }
);

export default router;
