import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { ClientService } from '../services/client.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Helpers
// =============================================================================

function svc(req: FastifyRequest): ClientService {
  return new ClientService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Client Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /clients
   * List clients with search and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, page, limit } = req.query as Record<string, string>;

    const result = await svc(req).list(authReq.user.userId, {
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /clients/:id
   * Get client by ID
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const client = await svc(req).getById(id, authReq.user.userId);
    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }
    return reply.send({ success: true, data: client });
  });

  /**
   * GET /clients/:id/stats
   * Get client stats (total invoices, total paid, outstanding, etc.)
   */
  fastify.get('/:id/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const stats = await svc(req).getStats(id, authReq.user.userId);
    if (!stats) {
      return reply.code(404).send({ error: 'Client not found' });
    }
    return reply.send({ success: true, data: stats });
  });

  /**
   * POST /clients
   * Create a new client
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { name, email, phone, companyName, taxId, billingAddress, notes } = req.body as Record<string, unknown>;

    if (!name) {
      return reply.code(400).send({ error: 'name is required' });
    }

    const client = await svc(req).create({
      userId: authReq.user.userId,
      name,
      email,
      phone,
      companyName,
      taxId,
      billingAddress,
      notes,
    });

    return reply.code(201).send({ success: true, data: client });
  });

  /**
   * PATCH /clients/:id
   * Update a client
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { name, email, phone, companyName, taxId, billingAddress, notes } = req.body as Record<string, unknown>;

    const client = await svc(req).update(id, authReq.user.userId, {
      name,
      email,
      phone,
      companyName,
      taxId,
      billingAddress,
      notes,
    });

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    return reply.send({ success: true, data: client });
  });

  /**
   * DELETE /clients/:id
   * Delete a client
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await svc(req).delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Client deleted' });
  });
};

export default routes;
