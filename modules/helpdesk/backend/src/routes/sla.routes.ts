import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getSlaService } from '../services/sla.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const slaService = getSlaService();

// =============================================================================
// SLA Policy Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /sla-policies/check-breaches
   * Check for SLA breaches across all active tickets
   * MUST be before /:id route to avoid matching "check-breaches" as an ID
   */
  fastify.get('/check-breaches', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const breaches = await slaService.checkBreaches(authReq.user.userId);
    return reply.send({ success: true, data: breaches });
  });

  /**
   * GET /sla-policies
   * List all SLA policies
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, priority, isActive, page, limit } = req.query as Record<string, string>;

    const policies = await slaService.list(authReq.user.userId, {
      search,
      priority,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return reply.send({ success: true, data: policies });
  });

  /**
   * GET /sla-policies/:id
   * Get SLA policy by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const policy = await slaService.getById(id, authReq.user.userId);
    if (!policy) {
      return reply.code(404).send({ error: 'SLA policy not found' });
    }
    return reply.send({ success: true, data: policy });
  });

  /**
   * POST /sla-policies
   * Create a new SLA policy
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, description, priority, firstResponseMinutes, resolutionMinutes, escalationEmail, businessHoursOnly } = req.body as Record<string, unknown>;

    if (!name || !priority || !firstResponseMinutes || !resolutionMinutes) {
      return reply.code(400).send({ error: 'name, priority, firstResponseMinutes, and resolutionMinutes are required' });
    }

    const policy = await slaService.create({
      userId: authReq.user.userId,
      name,
      description,
      priority,
      firstResponseMinutes: Number(firstResponseMinutes),
      resolutionMinutes: Number(resolutionMinutes),
      escalationEmail,
      businessHoursOnly,
    });

    return reply.code(201).send({ success: true, data: policy });
  });

  /**
   * PATCH /sla-policies/:id
   * Update an SLA policy
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, description, priority, firstResponseMinutes, resolutionMinutes, escalationEmail, businessHoursOnly } = req.body as Record<string, unknown>;

    const policy = await slaService.update(id, authReq.user.userId, {
      name,
      description,
      priority,
      firstResponseMinutes: firstResponseMinutes ? Number(firstResponseMinutes) : undefined,
      resolutionMinutes: resolutionMinutes ? Number(resolutionMinutes) : undefined,
      escalationEmail,
      businessHoursOnly,
    });

    if (!policy) {
      return reply.code(404).send({ error: 'SLA policy not found' });
    }

    return reply.send({ success: true, data: policy });
  });

  /**
   * DELETE /sla-policies/:id
   * Delete an SLA policy
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await slaService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'SLA policy deleted' });
  });

  /**
   * POST /sla-policies/:id/toggle-active
   * Toggle SLA policy active status
   */
  fastify.post('/:id/toggle-active', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const policy = await slaService.toggleActive(id, authReq.user.userId);
    if (!policy) {
      return reply.code(404).send({ error: 'SLA policy not found' });
    }
    return reply.send({ success: true, data: policy });
  });
};

export default routes;
