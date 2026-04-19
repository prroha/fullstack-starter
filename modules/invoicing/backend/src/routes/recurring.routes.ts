import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { RecurringInvoiceService } from '../services/recurring.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Helpers
// =============================================================================

function svc(req: FastifyRequest): RecurringInvoiceService {
  return new RecurringInvoiceService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Recurring Invoice Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /recurring
   * List recurring invoices with pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query as Record<string, string>;

    const result = await svc(req).list(authReq.user.userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /recurring/:id
   * Get recurring invoice by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const recurring = await svc(req).getById(id, authReq.user.userId);
    if (!recurring) {
      return reply.code(404).send({ error: 'Recurring invoice not found' });
    }
    return reply.send({ success: true, data: recurring });
  });

  /**
   * POST /recurring
   * Create a new recurring invoice
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const {
      clientId,
      frequency,
      startDate,
      endDate,
      templateItems,
      currency,
      notes,
      terms,
      maxOccurrences,
    } = req.body as Record<string, unknown>;

    if (!clientId || !frequency || !startDate || !templateItems) {
      return reply.code(400).send({ error: 'clientId, frequency, startDate, and templateItems are required' });
    }

    if (!Array.isArray(templateItems) || templateItems.length === 0) {
      return reply.code(400).send({ error: 'templateItems must be a non-empty array' });
    }

    const recurring = await svc(req).create({
      userId: authReq.user.userId,
      clientId,
      frequency,
      startDate,
      endDate,
      templateItems,
      currency,
      notes,
      terms,
      maxOccurrences,
    });

    return reply.code(201).send({ success: true, data: recurring });
  });

  /**
   * PATCH /recurring/:id
   * Update a recurring invoice
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const {
      clientId,
      frequency,
      startDate,
      endDate,
      templateItems,
      currency,
      notes,
      terms,
      maxOccurrences,
    } = req.body as Record<string, unknown>;

    const recurring = await svc(req).update(id, authReq.user.userId, {
      clientId,
      frequency,
      startDate,
      endDate,
      templateItems,
      currency,
      notes,
      terms,
      maxOccurrences,
    });

    if (!recurring) {
      return reply.code(404).send({ error: 'Recurring invoice not found' });
    }

    return reply.send({ success: true, data: recurring });
  });

  /**
   * POST /recurring/:id/pause
   * Pause a recurring invoice
   */
  fastify.post('/:id/pause', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const recurring = await svc(req).pause(id, authReq.user.userId);
    if (!recurring) {
      return reply.code(404).send({ error: 'Recurring invoice not found' });
    }
    return reply.send({ success: true, data: recurring });
  });

  /**
   * POST /recurring/:id/resume
   * Resume a paused recurring invoice
   */
  fastify.post('/:id/resume', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const recurring = await svc(req).resume(id, authReq.user.userId);
    if (!recurring) {
      return reply.code(404).send({ error: 'Recurring invoice not found' });
    }
    return reply.send({ success: true, data: recurring });
  });

  /**
   * POST /recurring/:id/cancel
   * Cancel a recurring invoice
   */
  fastify.post('/:id/cancel', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const recurring = await svc(req).cancel(id, authReq.user.userId);
    if (!recurring) {
      return reply.code(404).send({ error: 'Recurring invoice not found' });
    }
    return reply.send({ success: true, data: recurring });
  });
};

export default routes;
