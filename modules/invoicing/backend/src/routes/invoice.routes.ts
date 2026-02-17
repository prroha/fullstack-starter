import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getInvoiceService } from '../services/invoice.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const invoiceService = getInvoiceService();

// =============================================================================
// Invoice Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /invoices/stats
   * Get dashboard stats (total, paid, outstanding, overdue, etc.)
   * MUST be before /:id route to avoid matching "stats" as an ID
   */
  fastify.get('/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const stats = await invoiceService.getStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });

  /**
   * GET /invoices
   * List invoices with filtering and pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { search, status, clientId, dateFrom, dateTo, page, limit } = req.query as Record<string, string>;

    const result = await invoiceService.list(authReq.user.userId, {
      search,
      status,
      clientId,
      dateFrom,
      dateTo,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /invoices/:id
   * Get invoice by ID (includes items, payments, activities, client)
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const invoice = await invoiceService.getById(id, authReq.user.userId);
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }
    return reply.send({ success: true, data: invoice });
  });

  /**
   * POST /invoices
   * Create a new invoice
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { clientId, issueDate, dueDate, currency, notes, terms, discountAmount, items } = req.body as Record<string, unknown>;

    if (!clientId || !issueDate || !dueDate) {
      return reply.code(400).send({ error: 'clientId, issueDate, and dueDate are required' });
    }

    const invoice = await invoiceService.create({
      userId: authReq.user.userId,
      clientId,
      issueDate,
      dueDate,
      currency,
      notes,
      terms,
      discountAmount,
      items,
    });

    return reply.code(201).send({ success: true, data: invoice });
  });

  /**
   * PATCH /invoices/:id
   * Update an invoice
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { clientId, issueDate, dueDate, currency, notes, terms, discountAmount } = req.body as Record<string, unknown>;

    const invoice = await invoiceService.update(id, authReq.user.userId, {
      clientId,
      issueDate,
      dueDate,
      currency,
      notes,
      terms,
      discountAmount,
    });

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    return reply.send({ success: true, data: invoice });
  });

  /**
   * DELETE /invoices/:id
   * Delete an invoice (only DRAFT invoices can be deleted)
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await invoiceService.delete(id, authReq.user.userId);
    return reply.send({ success: true, message: 'Invoice deleted' });
  });

  /**
   * POST /invoices/:id/send
   * Mark invoice as sent
   */
  fastify.post('/:id/send', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const invoice = await invoiceService.send(id, authReq.user.userId);
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }
    return reply.send({ success: true, data: invoice });
  });

  /**
   * POST /invoices/:id/void
   * Void an invoice
   */
  fastify.post('/:id/void', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const invoice = await invoiceService.void(id, authReq.user.userId);
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }
    return reply.send({ success: true, data: invoice });
  });

  /**
   * POST /invoices/:id/duplicate
   * Duplicate an invoice (creates a new DRAFT copy)
   */
  fastify.post('/:id/duplicate', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const invoice = await invoiceService.duplicate(id, authReq.user.userId);
    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }
    return reply.code(201).send({ success: true, data: invoice });
  });
};

export default routes;
