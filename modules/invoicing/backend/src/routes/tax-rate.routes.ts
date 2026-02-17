import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getTaxRateService } from '../services/tax-rate.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const taxRateService = getTaxRateService();

// =============================================================================
// Tax Rate Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /tax-rates
   * List all tax rates
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const taxRates = await taxRateService.list(authReq.user.userId);
    return reply.send({ success: true, data: taxRates });
  });

  /**
   * POST /tax-rates
   * Create a new tax rate
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, rate, isDefault } = req.body as Record<string, unknown>;

    if (!name || rate === undefined) {
      return reply.code(400).send({ error: 'name and rate are required' });
    }

    const taxRate = await taxRateService.create({
      userId: authReq.user.userId,
      name,
      rate: Number(rate),
      isDefault,
    });

    return reply.code(201).send({ success: true, data: taxRate });
  });

  /**
   * PATCH /tax-rates/:id
   * Update a tax rate
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, rate, isDefault } = req.body as Record<string, unknown>;

    const taxRate = await taxRateService.update(id, authReq.user.userId, {
      name,
      rate: rate !== undefined ? Number(rate) : undefined,
      isDefault,
    });

    if (!taxRate) {
      return reply.code(404).send({ error: 'Tax rate not found' });
    }

    return reply.send({ success: true, data: taxRate });
  });

  /**
   * DELETE /tax-rates/:id
   * Delete a tax rate
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await taxRateService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Tax rate deleted' });
  });

  /**
   * POST /tax-rates/:id/default
   * Set a tax rate as the default
   */
  fastify.post('/:id/default', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const taxRate = await taxRateService.setDefault(id, authReq.user.userId);
    if (!taxRate) {
      return reply.code(404).send({ error: 'Tax rate not found' });
    }
    return reply.send({ success: true, data: taxRate });
  });
};

export default routes;
