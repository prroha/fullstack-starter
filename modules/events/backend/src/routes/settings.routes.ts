import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getSettingsService } from '../services/settings.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const settingsService = getSettingsService();

// =============================================================================
// Settings Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /settings
   * Get user event settings (creates defaults if none exist)
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const settings = await settingsService.get(authReq.user.userId);
    return reply.send({ success: true, data: settings });
  });

  /**
   * PATCH /settings
   * Update user event settings
   */
  fastify.patch('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { defaultView, defaultCategoryId, currency, timezone } = req.body as Record<string, unknown>;

    const settings = await settingsService.update(authReq.user.userId, {
      defaultView,
      defaultCategoryId,
      currency,
      timezone,
    });

    return reply.send({ success: true, data: settings });
  });
};

export default routes;
