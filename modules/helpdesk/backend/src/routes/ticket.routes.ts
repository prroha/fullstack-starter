import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getTicketService } from '../services/ticket.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const ticketService = getTicketService();

// =============================================================================
// Ticket Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /tickets/stats
   * Get dashboard stats (total, open, pending, resolved, etc.)
   * MUST be before /:id route to avoid matching "stats" as an ID
   */
  fastify.get('/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const stats = await ticketService.getStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });

  /**
   * GET /tickets
   * List tickets with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, status, priority, categoryId, assignedAgentId, tagId, dateFrom, dateTo, page, limit } = req.query as Record<string, string>;

    const result = await ticketService.list(authReq.user.userId, {
      search,
      status,
      priority,
      categoryId,
      assignedAgentId,
      tagId,
      dateFrom,
      dateTo,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /tickets/:id
   * Get ticket by ID (includes messages, tags, category, assigned agent)
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const ticket = await ticketService.getById(id, authReq.user.userId);
    if (!ticket) {
      return reply.code(404).send({ error: 'Ticket not found' });
    }
    return reply.send({ success: true, data: ticket });
  });

  /**
   * POST /tickets
   * Create a new ticket
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { subject, description, priority, categoryId } = req.body as Record<string, unknown>;

    if (!subject || !description) {
      return reply.code(400).send({ error: 'subject and description are required' });
    }

    const ticket = await ticketService.create({
      userId: authReq.user.userId,
      subject,
      description,
      priority,
      categoryId,
    });

    return reply.code(201).send({ success: true, data: ticket });
  });

  /**
   * PATCH /tickets/:id
   * Update a ticket
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { subject, description, priority, categoryId } = req.body as Record<string, unknown>;

    const ticket = await ticketService.update(id, authReq.user.userId, {
      subject,
      description,
      priority,
      categoryId,
    });

    if (!ticket) {
      return reply.code(404).send({ error: 'Ticket not found' });
    }

    return reply.send({ success: true, data: ticket });
  });

  /**
   * DELETE /tickets/:id
   * Delete a ticket
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await ticketService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Ticket deleted' });
  });

  /**
   * POST /tickets/:id/assign
   * Assign a ticket to an agent
   */
  fastify.post('/:id/assign', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { agentId } = req.body as { agentId: string };

    const ticket = await ticketService.assign(id, authReq.user.userId, agentId);
    if (!ticket) {
      return reply.code(404).send({ error: 'Ticket not found' });
    }
    return reply.send({ success: true, data: ticket });
  });

  /**
   * POST /tickets/:id/status
   * Update ticket status
   */
  fastify.post('/:id/status', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };

    if (!status) {
      return reply.code(400).send({ error: 'status is required' });
    }

    const ticket = await ticketService.changeStatus(id, authReq.user.userId, status);
    if (!ticket) {
      return reply.code(404).send({ error: 'Ticket not found' });
    }
    return reply.send({ success: true, data: ticket });
  });

  /**
   * GET /tickets/:id/messages
   * Get messages for a ticket
   */
  fastify.get('/:id/messages', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const messages = await ticketService.getMessages(id, authReq.user.userId);
    return reply.send({ success: true, data: messages });
  });

  /**
   * POST /tickets/:id/messages
   * Add a message to a ticket
   */
  fastify.post('/:id/messages', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { body, senderType, isInternal } = req.body as Record<string, unknown>;

    if (!body) {
      return reply.code(400).send({ error: 'body is required' });
    }

    const message = await ticketService.addMessage(id, authReq.user.userId, {
      senderId: authReq.user.userId,
      body,
      senderType: (senderType as string) || 'customer',
      isInternal,
    });

    return reply.code(201).send({ success: true, data: message });
  });

  /**
   * POST /tickets/:id/tags
   * Add a tag to a ticket
   */
  fastify.post('/:id/tags', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { tagId } = req.body as { tagId: string };

    if (!tagId) {
      return reply.code(400).send({ error: 'tagId is required' });
    }

    await ticketService.addTag(id, authReq.user.userId, tagId);
    return reply.send({ success: true, message: 'Tag added to ticket' });
  });

  /**
   * DELETE /tickets/:id/tags/:tagId
   * Remove a tag from a ticket
   */
  fastify.delete('/:id/tags/:tagId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id, tagId } = req.params as { id: string; tagId: string };

    await ticketService.removeTag(id, authReq.user.userId, tagId);
    return reply.send({ success: true, message: 'Tag removed from ticket' });
  });
};

export default routes;
