import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getProviderService } from '../services/provider.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const providerService = getProviderService();

// =============================================================================
// Public Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /providers
   * List active providers
   */
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { page, limit } = req.query as Record<string, string>;

    const result = await providerService.listProviders({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /providers/:id
   * Get provider profile with services and rating
   */
  fastify.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const provider = await providerService.getProviderById(id);
    if (!provider) {
      return reply.code(404).send({ error: 'Provider not found' });
    }
    return reply.send({ success: true, data: provider });
  });

  /**
   * GET /providers/:id/availability
   * Get available time slots for a specific provider, service, and date
   */
  fastify.get('/:id/availability', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { serviceId, date } = req.query as Record<string, string>;

    if (!serviceId || !date) {
      return reply.code(400).send({ error: 'serviceId and date are required' });
    }

    const slots = await providerService.getAvailability(id, serviceId, date);

    return reply.send({ success: true, data: slots });
  });

  // =============================================================================
  // Authenticated Endpoints
  // =============================================================================

  /**
   * POST /providers
   * Create a provider profile
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { bio, specialties, avatarUrl, phone, location } = req.body as Record<string, unknown>;

    const provider = await providerService.createProvider({
      userId: authReq.user.userId,
      bio,
      specialties,
      avatarUrl,
      phone,
      location,
    });

    return reply.code(201).send({ success: true, data: provider });
  });

  /**
   * PATCH /providers/:id
   * Update a provider profile
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { bio, specialties, avatarUrl, phone, location } = req.body as Record<string, unknown>;

    const provider = await providerService.updateProvider(id, {
      bio,
      specialties,
      avatarUrl,
      phone,
      location,
    });

    if (!provider) {
      return reply.code(404).send({ error: 'Provider not found' });
    }

    return reply.send({ success: true, data: provider });
  });

  /**
   * POST /providers/:id/services
   * Link a service to a provider
   */
  fastify.post('/:id/services', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { serviceId } = req.body as { serviceId: string };

    if (!serviceId) {
      return reply.code(400).send({ error: 'serviceId is required' });
    }

    const result = await providerService.linkService(id, serviceId);
    return reply.code(201).send({ success: true, data: result });
  });

  /**
   * DELETE /providers/:id/services/:serviceId
   * Unlink a service from a provider
   */
  fastify.delete('/:id/services/:serviceId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id, serviceId } = req.params as { id: string; serviceId: string };
    await providerService.unlinkService(id, serviceId);
    return reply.send({ success: true, message: 'Service unlinked from provider' });
  });
};

export default routes;
