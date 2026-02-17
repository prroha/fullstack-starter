import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getAgentService } from '../services/agent.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const agentService = getAgentService();

// =============================================================================
// Agent Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /agents/me
   * Get the current user's agent profile
   * MUST be before /:id route to avoid matching "me" as an ID
   */
  fastify.get('/me', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const agent = await agentService.getByUserId(authReq.user.userId, authReq.user.userId);
    if (!agent) {
      return reply.code(404).send({ error: 'Agent profile not found' });
    }
    return reply.send({ success: true, data: agent });
  });

  /**
   * GET /agents/workload
   * Get all agents workload summary
   * MUST be before /:id route to avoid matching "workload" as an ID
   */
  fastify.get('/workload', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const workload = await agentService.getAllWorkloads(authReq.user.userId);
    return reply.send({ success: true, data: workload });
  });

  /**
   * GET /agents
   * List all agents
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, department, role, isActive, page, limit } = req.query as Record<string, string>;

    const agents = await agentService.list(authReq.user.userId, {
      search,
      department,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return reply.send({ success: true, data: agents });
  });

  /**
   * GET /agents/:id
   * Get agent by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const agent = await agentService.getById(id, authReq.user.userId);
    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found' });
    }
    return reply.send({ success: true, data: agent });
  });

  /**
   * POST /agents
   * Create a new agent
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, email, role, department, maxOpenTickets, specialties } = req.body as Record<string, unknown>;

    if (!name || !email) {
      return reply.code(400).send({ error: 'name and email are required' });
    }

    const agent = await agentService.create({
      userId: authReq.user.userId,
      name,
      email,
      role,
      department,
      maxOpenTickets,
      specialties,
    });

    return reply.code(201).send({ success: true, data: agent });
  });

  /**
   * PATCH /agents/:id
   * Update an agent
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, email, role, department, maxOpenTickets, specialties } = req.body as Record<string, unknown>;

    const agent = await agentService.update(id, authReq.user.userId, {
      name,
      email,
      role,
      department,
      maxOpenTickets,
      specialties,
    });

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found' });
    }

    return reply.send({ success: true, data: agent });
  });

  /**
   * DELETE /agents/:id
   * Delete an agent
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await agentService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Agent deleted' });
  });

  /**
   * POST /agents/:id/toggle-active
   * Toggle agent active status
   */
  fastify.post('/:id/toggle-active', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const agent = await agentService.toggleActive(id, authReq.user.userId);
    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found' });
    }
    return reply.send({ success: true, data: agent });
  });
};

export default routes;
