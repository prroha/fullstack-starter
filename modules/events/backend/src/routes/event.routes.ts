import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getEventService } from '../services/event.service.js';
import { getSpeakerService } from '../services/speaker.service.js';
import { getRegistrationService } from '../services/registration.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const eventService = getEventService();
const speakerService = getSpeakerService();
const registrationService = getRegistrationService();

// =============================================================================
// Event Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /events/stats, GET /events/dashboard-stats
   * Get dashboard stats
   * MUST be before /:id route to avoid matching "stats" as an ID
   */
  const handleGetStats = async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const stats = await eventService.getDashboardStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  };

  fastify.get('/stats', { preHandler: [authMiddleware] }, handleGetStats);
  fastify.get('/dashboard-stats', { preHandler: [authMiddleware] }, handleGetStats);

  /**
   * GET /events
   * List events with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, status, type, categoryId, venueId, startAfter, startBefore, page, limit } = req.query as Record<string, string>;

    const result = await eventService.list(authReq.user.userId, {
      search,
      status,
      type,
      categoryId,
      venueId,
      startAfter,
      startBefore,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /events/:id
   * Get event by ID (includes category, venue, speakers, registrations)
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const event = await eventService.getById(id, authReq.user.userId);
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }
    return reply.send({ success: true, data: event });
  });

  /**
   * POST /events
   * Create a new event
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { title, description, categoryId, venueId, type, status, startDate, endDate, capacity, price, currency, imageUrl, isFeatured } = req.body as Record<string, unknown>;

    if (!title || !startDate || !endDate) {
      return reply.code(400).send({ error: 'title, startDate, and endDate are required' });
    }

    const event = await eventService.create({
      userId: authReq.user.userId,
      title,
      description,
      categoryId,
      venueId,
      type,
      status,
      startDate,
      endDate,
      capacity,
      price,
      currency,
      imageUrl,
      isFeatured,
    });

    return reply.code(201).send({ success: true, data: event });
  });

  /**
   * PATCH /events/:id
   * Update an event
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { title, description, categoryId, venueId, type, status, startDate, endDate, capacity, price, currency, imageUrl, isFeatured } = req.body as Record<string, unknown>;

    const event = await eventService.update(id, authReq.user.userId, {
      title,
      description,
      categoryId,
      venueId,
      type,
      status,
      startDate,
      endDate,
      capacity,
      price,
      currency,
      imageUrl,
      isFeatured,
    });

    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }

    return reply.send({ success: true, data: event });
  });

  /**
   * DELETE /events/:id
   * Delete an event
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await eventService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Event deleted' });
  });

  /**
   * POST /events/:id/publish
   * Publish an event
   */
  fastify.post('/:id/publish', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const event = await eventService.publish(id, authReq.user.userId);
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }
    return reply.send({ success: true, data: event });
  });

  /**
   * POST /events/:id/cancel
   * Cancel an event
   */
  fastify.post('/:id/cancel', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const event = await eventService.cancel(id, authReq.user.userId);
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }
    return reply.send({ success: true, data: event });
  });

  /**
   * POST /events/:id/complete
   * Mark event as completed
   */
  fastify.post('/:id/complete', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const event = await eventService.complete(id, authReq.user.userId);
    if (!event) {
      return reply.code(404).send({ error: 'Event not found' });
    }
    return reply.send({ success: true, data: event });
  });

  // =============================================================================
  // Nested Speaker Endpoints
  // =============================================================================

  /**
   * GET /events/:id/speakers
   * Get speakers for an event
   */
  fastify.get('/:id/speakers', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    const speakers = await speakerService.listByEvent(id);
    return reply.send({ success: true, data: speakers });
  });

  /**
   * POST /events/:id/speakers
   * Add a speaker to an event
   */
  fastify.post('/:id/speakers', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, email, bio, avatarUrl, title, company } = req.body as Record<string, unknown>;

    if (!name) {
      return reply.code(400).send({ error: 'name is required' });
    }

    const speaker = await speakerService.create({
      eventId: id,
      userId: authReq.user.userId,
      name,
      email,
      bio,
      avatarUrl,
      title,
      company,
    });

    return reply.code(201).send({ success: true, data: speaker });
  });

  // =============================================================================
  // Nested Registration Endpoints
  // =============================================================================

  /**
   * GET /events/:id/registrations
   * Get registrations for an event
   */
  fastify.get('/:id/registrations', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    const registrations = await registrationService.listByEvent(id);
    return reply.send({ success: true, data: registrations });
  });

  /**
   * POST /events/:id/registrations
   * Register for an event
   */
  fastify.post('/:id/registrations', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { attendeeName, attendeeEmail, notes } = req.body as Record<string, unknown>;

    if (!attendeeName || !attendeeEmail) {
      return reply.code(400).send({ error: 'attendeeName and attendeeEmail are required' });
    }

    const registration = await registrationService.register({
      eventId: id,
      userId: authReq.user.userId,
      attendeeName,
      attendeeEmail,
      notes,
    });

    return reply.code(201).send({ success: true, data: registration });
  });
};

export default routes;
