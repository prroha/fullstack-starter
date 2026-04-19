import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { RegistrationService } from '../services/registration.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Helpers
// =============================================================================

function svc(req: FastifyRequest): RegistrationService {
  return new RegistrationService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Registration Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /registrations
   * List all registrations with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, status, eventId, page, limit } = req.query as Record<string, string>;

    const result = await svc(req).listAll(authReq.user.userId, {
      search,
      status,
      eventId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * POST /registrations/:id/confirm
   * Confirm a registration
   */
  fastify.post('/:id/confirm', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const registration = await svc(req).confirm(id, authReq.user.userId);
    if (!registration) {
      return reply.code(404).send({ error: 'Registration not found' });
    }
    return reply.send({ success: true, data: registration });
  });

  /**
   * POST /registrations/:id/check-in
   * Check in a registration
   */
  fastify.post('/:id/check-in', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const registration = await svc(req).checkIn(id, authReq.user.userId);
    if (!registration) {
      return reply.code(404).send({ error: 'Registration not found' });
    }
    return reply.send({ success: true, data: registration });
  });

  /**
   * POST /registrations/:id/cancel
   * Cancel a registration
   */
  fastify.post('/:id/cancel', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const registration = await svc(req).cancel(id, authReq.user.userId);
    if (!registration) {
      return reply.code(404).send({ error: 'Registration not found' });
    }
    return reply.send({ success: true, data: registration });
  });
};

export default routes;
