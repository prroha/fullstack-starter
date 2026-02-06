import { Router, Request, Response, NextFunction } from 'express';
import {
  getAuditService,
  AuditQueryOptions,
  AuditLevel,
  AuditCategory,
} from '../services/audit.service';

// =============================================================================
// Types
// =============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    role?: string;
  };
  dbUser?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Admin-only access middleware
 * Assumes authMiddleware has already been applied
 */
function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user || !authReq.dbUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (authReq.dbUser.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

// =============================================================================
// Router
// =============================================================================

const router = Router();
const audit = getAuditService();

// All routes require admin access
router.use(adminOnly);

/**
 * GET /audit-logs
 * Query audit logs with filters and pagination
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      userId,
      level,
      levels,
      action,
      actions,
      category,
      categories,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const options: AuditQueryOptions = {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? Math.min(parseInt(limit as string, 10), 100) : 50,
      sortBy: (sortBy as 'timestamp' | 'level' | 'action') || 'timestamp',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Date filters
    if (startDate) {
      options.startDate = new Date(startDate as string);
    }
    if (endDate) {
      options.endDate = new Date(endDate as string);
    }

    // User filter
    if (userId) {
      options.userId = userId as string;
    }

    // Level filters
    if (level) {
      options.level = level as AuditLevel;
    }
    if (levels) {
      options.levels = (levels as string).split(',') as AuditLevel[];
    }

    // Action filters
    if (action) {
      options.action = action as string;
    }
    if (actions) {
      options.actions = (actions as string).split(',');
    }

    // Category filters
    if (category) {
      options.category = category as AuditCategory;
    }
    if (categories) {
      options.categories = (categories as string).split(',') as AuditCategory[];
    }

    // Search filter
    if (search) {
      options.search = search as string;
    }

    const result = await audit.query(options);

    res.json({
      success: true,
      logs: result.logs,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('[AuditRoutes] Query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
    });
  }
});

/**
 * GET /audit-logs/stats
 * Get audit log statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string, 10) : 30;

    const stats = await audit.getStats(daysNum);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[AuditRoutes] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit statistics',
    });
  }
});

/**
 * GET /audit-logs/export
 * Export audit logs as CSV or JSON
 */
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      format = 'json',
      startDate,
      endDate,
      level,
      category,
      userId,
    } = req.query;

    const options: AuditQueryOptions = {
      limit: 10000, // Max export limit
    };

    if (startDate) {
      options.startDate = new Date(startDate as string);
    }
    if (endDate) {
      options.endDate = new Date(endDate as string);
    }
    if (level) {
      options.level = level as AuditLevel;
    }
    if (category) {
      options.category = category as AuditCategory;
    }
    if (userId) {
      options.userId = userId as string;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csv = await audit.exportToCsv(options);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-logs-${timestamp}.csv"`
      );
      res.send(csv);
    } else {
      const json = await audit.exportToJson(options);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-logs-${timestamp}.json"`
      );
      res.send(json);
    }

    // Log the export action
    const authReq = req as AuthenticatedRequest;
    await audit.info({
      action: 'admin.audit.export',
      category: 'admin',
      userId: authReq.user?.userId,
      userEmail: authReq.dbUser?.email,
      metadata: { format, filters: { startDate, endDate, level, category } },
    });
  } catch (error) {
    console.error('[AuditRoutes] Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs',
    });
  }
});

/**
 * GET /audit-logs/:id
 * Get a single audit log entry by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const log = await audit.getById(id);

    if (!log) {
      res.status(404).json({
        success: false,
        error: 'Audit log not found',
      });
      return;
    }

    res.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error('[AuditRoutes] Get by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log',
    });
  }
});

/**
 * DELETE /audit-logs/cleanup
 * Manually trigger log cleanup (removes logs older than retention period)
 */
router.delete('/cleanup', async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedCount = await audit.cleanup();

    // Log the cleanup action
    const authReq = req as AuthenticatedRequest;
    await audit.warning({
      action: 'admin.audit.cleanup',
      category: 'admin',
      userId: authReq.user?.userId,
      userEmail: authReq.dbUser?.email,
      metadata: { deletedCount },
    });

    res.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} old audit log entries`,
    });
  } catch (error) {
    console.error('[AuditRoutes] Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup audit logs',
    });
  }
});

export default router;
