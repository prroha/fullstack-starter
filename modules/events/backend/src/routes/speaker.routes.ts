import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getSpeakerService } from '../services/speaker.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const speakerService = getSpeakerService();

// =============================================================================
// Speaker Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /speakers/reorder
   * Reorder speakers
   * MUST be before /:id route
   */
  fastify.post('/reorder', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { ids } = req.body as { ids: unknown };

    if (!Array.isArray(ids)) {
      return reply.code(400).send({ error: 'ids array is required' });
    }

    await speakerService.reorder(authReq.user.userId, ids);
    return reply.send({ success: true, message: 'Speakers reordered' });
  });

  /**
   * PATCH /speakers/:id
   * Update a speaker
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, email, bio, avatarUrl, title, company } = req.body as Record<string, unknown>;

    const speaker = await speakerService.update(id, authReq.user.userId, {
      name,
      email,
      bio,
      avatarUrl,
      title,
      company,
    });

    if (!speaker) {
      return reply.code(404).send({ error: 'Speaker not found' });
    }

    return reply.send({ success: true, data: speaker });
  });

  /**
   * DELETE /speakers/:id
   * Delete a speaker
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await speakerService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Speaker deleted' });
  });
};

export default routes;
