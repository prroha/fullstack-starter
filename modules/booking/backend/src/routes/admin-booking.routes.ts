import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { BookingService } from '../services/booking.service.js';
import { authMiddleware } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Helper
// =============================================================================

function svc(req: FastifyRequest): BookingService {
  return new BookingService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Admin Booking Endpoints (All Authenticated — Admin Only)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /admin/bookings
   * List all bookings with full filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { status, search, providerId, serviceId, startDate, endDate, page, limit } = req.query as Record<string, string>;

    const result = await svc(req).listAllBookings({
      status,
      search,
      providerId,
      serviceId,
      startDate,
      endDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /admin/bookings/stats
   * Get booking dashboard statistics
   */
  fastify.get('/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const stats = await svc(req).getBookingStats();
    return reply.send({ success: true, data: stats });
  });

  /**
   * PATCH /admin/bookings/:id/status
   * Update booking status (admin override)
   */
  fastify.patch('/:id/status', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };

    if (!status) {
      return reply.code(400).send({ error: 'status is required' });
    }

    const booking = await svc(req).updateBookingStatus(id, status);
    if (!booking) {
      return reply.code(404).send({ error: 'Booking not found' });
    }

    return reply.send({ success: true, data: booking });
  });

  /**
   * GET /admin/bookings/export
   * Export bookings as CSV
   */
  fastify.get('/export', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { status, startDate, endDate } = req.query as Record<string, string>;

    const csv = await svc(req).exportBookings({
      status,
      startDate,
      endDate,
    });

    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename=bookings-export.csv')
      .send(csv);
  });
};

export default routes;
