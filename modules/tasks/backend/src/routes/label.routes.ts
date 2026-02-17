import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getLabelService } from '../services/label.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const labelService = getLabelService();

// =============================================================================
// Label Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /labels
   * List all labels for the authenticated user
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const labels = await labelService.list(authReq.user.userId);
    return reply.send({ success: true, data: labels });
  });

  /**
   * POST /labels
   * Create a new label
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, color } = req.body as Record<string, unknown>;

    if (!name) {
      return reply.code(400).send({ error: 'name is required' });
    }

    const label = await labelService.create({
      userId: authReq.user.userId,
      name,
      color,
    });

    return reply.code(201).send({ success: true, data: label });
  });

  /**
   * PATCH /labels/:id
   * Update a label
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, color } = req.body as Record<string, unknown>;

    const label = await labelService.update(id, authReq.user.userId, { name, color });
    if (!label) {
      return reply.code(404).send({ error: 'Label not found' });
    }

    return reply.send({ success: true, data: label });
  });

  /**
   * DELETE /labels/:id
   * Delete a label
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await labelService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Label deleted' });
  });
};

export default routes;
