import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  getAuditService,
  AuditQueryOptions,
  AuditLevel,
  AuditCategory,
} from '../services/audit.service.js';

// =============================================================================
// Types
// =============================================================================

interface AuthenticatedRequest extends FastifyRequest {
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
async function adminOnly(req: FastifyRequest, reply: FastifyReply) {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user || !authReq.dbUser) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  if (authReq.dbUser.role !== 'ADMIN') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

// =============================================================================
// Plugin
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  const audit = getAuditService();

  // All routes require admin access
  fastify.addHook('preHandler', adminOnly);

  /**
   * GET /audit-logs
   * Query audit logs with filters and pagination
   */
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
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
    } = req.query as Record<string, string | undefined>;

    const options: AuditQueryOptions = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
      sortBy: (sortBy as 'timestamp' | 'level' | 'action') || 'timestamp',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Date filters
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // User filter
    if (userId) {
      options.userId = userId;
    }

    // Level filters
    if (level) {
      options.level = level as AuditLevel;
    }
    if (levels) {
      options.levels = levels.split(',') as AuditLevel[];
    }

    // Action filters
    if (action) {
      options.action = action;
    }
    if (actions) {
      options.actions = actions.split(',');
    }

    // Category filters
    if (category) {
      options.category = category as AuditCategory;
    }
    if (categories) {
      options.categories = categories.split(',') as AuditCategory[];
    }

    // Search filter
    if (search) {
      options.search = search;
    }

    const result = await audit.query(options);

    return reply.send({
      success: true,
      logs: result.logs,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  /**
   * GET /audit-logs/stats
   * Get audit log statistics
   */
  fastify.get('/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    const { days } = req.query as { days?: string };
    const daysNum = days ? parseInt(days, 10) : 30;

    const stats = await audit.getStats(daysNum);

    return reply.send({
      success: true,
      stats,
    });
  });

  /**
   * GET /audit-logs/export
   * Export audit logs as CSV or JSON
   */
  fastify.get('/export', async (req: FastifyRequest, reply: FastifyReply) => {
    const {
      format = 'json',
      startDate,
      endDate,
      level,
      category,
      userId,
    } = req.query as Record<string, string | undefined>;

    const options: AuditQueryOptions = {
      limit: 10000, // Max export limit
    };

    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    if (level) {
      options.level = level as AuditLevel;
    }
    if (category) {
      options.category = category as AuditCategory;
    }
    if (userId) {
      options.userId = userId;
    }

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csv = await audit.exportToCsv(options);
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="audit-logs-${timestamp}.csv"`)
        .send(csv);
    } else {
      const json = await audit.exportToJson(options);
      return reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="audit-logs-${timestamp}.json"`)
        .send(json);
    }

    // Log the export action (fire and forget after response)
    // Note: In Fastify, we log after sending. Use onResponse hook if needed.
    const authReq = req as AuthenticatedRequest;
    await audit.info({
      action: 'admin.audit.export',
      category: 'admin',
      userId: authReq.user?.userId,
      userEmail: authReq.dbUser?.email,
      metadata: { format, filters: { startDate, endDate, level, category } },
    });
  });

  /**
   * GET /audit-logs/:id
   * Get a single audit log entry by ID
   */
  fastify.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const log = await audit.getById(id);

    if (!log) {
      return reply.code(404).send({
        success: false,
        error: 'Audit log not found',
      });
    }

    return reply.send({
      success: true,
      log,
    });
  });

  /**
   * DELETE /audit-logs/cleanup
   * Manually trigger log cleanup (removes logs older than retention period)
   */
  fastify.delete('/cleanup', async (req: FastifyRequest, reply: FastifyReply) => {
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

    return reply.send({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} old audit log entries`,
    });
  });
};

export default routes;
