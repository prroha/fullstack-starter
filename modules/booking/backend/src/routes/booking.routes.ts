import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getBookingService } from '../services/booking.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Validation Schemas
// =============================================================================

const createBookingSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  providerId: z.string().uuid('Invalid provider ID'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  notes: z.string().max(2000).optional().nullable(),
});

// =============================================================================
// Routes
// =============================================================================

const bookingService = getBookingService();

// =============================================================================
// Booking Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /bookings
   * Create a new booking
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { serviceId, providerId, date, startTime, notes } = createBookingSchema.parse(req.body);

    const booking = await bookingService.createBooking({
      userId: authReq.user.userId,
      serviceId,
      providerId,
      date,
      startTime,
      notes,
    });

    return reply.code(201).send({ success: true, data: booking });
  });

  /**
   * GET /bookings
   * List current user's bookings with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { status, page, limit } = req.query as Record<string, string>;

    const result = await bookingService.listUserBookings({
      userId: authReq.user.userId,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /bookings/:id
   * Get booking detail
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const booking = await bookingService.getBookingById(id);
    if (!booking) {
      return reply.code(404).send({ error: 'Booking not found' });
    }
    return reply.send({ success: true, data: booking });
  });

  /**
   * POST /bookings/:id/cancel
   * Cancel a booking
   */
  fastify.post('/:id/cancel', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason?: string };

    const booking = await bookingService.cancelBooking(id, reason);
    if (!booking) {
      return reply.code(404).send({ error: 'Booking not found' });
    }

    return reply.send({ success: true, data: booking });
  });

  /**
   * POST /bookings/:id/reschedule
   * Reschedule a booking to a new date and time
   */
  fastify.post('/:id/reschedule', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { date, startTime } = req.body as { date: string; startTime: string };

    if (!date || !startTime) {
      return reply.code(400).send({ error: 'date and startTime are required' });
    }

    const booking = await bookingService.rescheduleBooking(id, { date, startTime });
    if (!booking) {
      return reply.code(404).send({ error: 'Booking not found' });
    }

    return reply.send({ success: true, data: booking });
  });

  // =============================================================================
  // Provider Actions
  // =============================================================================

  /**
   * POST /bookings/:id/confirm
   * Confirm a pending booking (provider)
   */
  fastify.post('/:id/confirm', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const booking = await bookingService.confirmBooking(id);
    if (!booking) {
      return reply.code(404).send({ error: 'Booking not found' });
    }
    return reply.send({ success: true, data: booking });
  });

  /**
   * POST /bookings/:id/complete
   * Mark a booking as completed (provider)
   */
  fastify.post('/:id/complete', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const booking = await bookingService.completeBooking(id);
    if (!booking) {
      return reply.code(404).send({ error: 'Booking not found' });
    }
    return reply.send({ success: true, data: booking });
  });

  /**
   * POST /bookings/:id/no-show
   * Mark a booking as no-show (provider)
   */
  fastify.post('/:id/no-show', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const booking = await bookingService.markNoShow(id);
    if (!booking) {
      return reply.code(404).send({ error: 'Booking not found' });
    }
    return reply.send({ success: true, data: booking });
  });
};

export default routes;
