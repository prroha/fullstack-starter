import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getVenueService } from '../services/venue.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const venueService = getVenueService();

// =============================================================================
// Venue Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /venues/stats
   * Get venue stats
   * MUST be before /:id route
   */
  fastify.get('/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const stats = await venueService.getStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });

  /**
   * GET /venues
   * List venues with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, isVirtual, page, limit } = req.query as Record<string, string>;

    const result = await venueService.list(authReq.user.userId, {
      search,
      isVirtual: isVirtual === 'true' ? true : isVirtual === 'false' ? false : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /venues/:id
   * Get venue by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const venue = await venueService.getById(id, authReq.user.userId);
    if (!venue) {
      return reply.code(404).send({ error: 'Venue not found' });
    }
    return reply.send({ success: true, data: venue });
  });

  /**
   * POST /venues
   * Create a new venue
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, address, city, state, country, capacity, isVirtual, meetingUrl } = req.body as Record<string, unknown>;

    if (!name) {
      return reply.code(400).send({ error: 'name is required' });
    }

    const venue = await venueService.create({
      userId: authReq.user.userId,
      name,
      address,
      city,
      state,
      country,
      capacity,
      isVirtual,
      meetingUrl,
    });

    return reply.code(201).send({ success: true, data: venue });
  });

  /**
   * PATCH /venues/:id
   * Update a venue
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, address, city, state, country, capacity, isVirtual, meetingUrl } = req.body as Record<string, unknown>;

    const venue = await venueService.update(id, authReq.user.userId, {
      name,
      address,
      city,
      state,
      country,
      capacity,
      isVirtual,
      meetingUrl,
    });

    if (!venue) {
      return reply.code(404).send({ error: 'Venue not found' });
    }

    return reply.send({ success: true, data: venue });
  });

  /**
   * DELETE /venues/:id
   * Delete a venue
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await venueService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Venue deleted' });
  });
};

export default routes;
