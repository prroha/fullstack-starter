import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { SettingsService } from '../services/settings.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Helpers
// =============================================================================

function svc(req: FastifyRequest): SettingsService {
  return new SettingsService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Settings Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /settings
   * Get user task settings (creates defaults if none exist)
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const settings = await svc(req).get(authReq.user.userId);
    return reply.send({ success: true, data: settings });
  });

  /**
   * PATCH /settings
   * Update user task settings
   */
  fastify.patch('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { defaultView, defaultProjectId, showCompletedTasks } = req.body as Record<string, unknown>;

    const settings = await svc(req).update(authReq.user.userId, {
      defaultView,
      defaultProjectId,
      showCompletedTasks,
    });

    return reply.send({ success: true, data: settings });
  });
};

export default routes;
