import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getCannedResponseService } from '../services/canned-response.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const cannedResponseService = getCannedResponseService();

// =============================================================================
// Canned Response Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /canned-responses/mine
   * Get the current agent's canned responses
   * MUST be before /:id route to avoid matching "mine" as an ID
   */
  fastify.get('/mine', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const responses = await cannedResponseService.list(authReq.user.userId, {
      createdByAgentId: authReq.user.userId,
    });
    return reply.send({ success: true, data: responses });
  });

  /**
   * GET /canned-responses
   * List canned responses with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, categoryId, page, limit } = req.query as Record<string, string>;

    const result = await cannedResponseService.list(authReq.user.userId, {
      search,
      categoryId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /canned-responses/:id
   * Get canned response by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const response = await cannedResponseService.getById(id, authReq.user.userId);
    if (!response) {
      return reply.code(404).send({ error: 'Canned response not found' });
    }
    return reply.send({ success: true, data: response });
  });

  /**
   * POST /canned-responses
   * Create a new canned response
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { title, content, shortcut, categoryId, isShared } = req.body as Record<string, unknown>;

    if (!title || !content) {
      return reply.code(400).send({ error: 'title and content are required' });
    }

    const response = await cannedResponseService.create({
      userId: authReq.user.userId,
      title,
      content,
      shortcut,
      categoryId,
      isShared,
    });

    return reply.code(201).send({ success: true, data: response });
  });

  /**
   * PATCH /canned-responses/:id
   * Update a canned response
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { title, content, shortcut, categoryId, isShared } = req.body as Record<string, unknown>;

    const response = await cannedResponseService.update(id, authReq.user.userId, {
      title,
      content,
      shortcut,
      categoryId,
      isShared,
    });

    if (!response) {
      return reply.code(404).send({ error: 'Canned response not found' });
    }

    return reply.send({ success: true, data: response });
  });

  /**
   * DELETE /canned-responses/:id
   * Delete a canned response
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await cannedResponseService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Canned response deleted' });
  });
};

export default routes;
