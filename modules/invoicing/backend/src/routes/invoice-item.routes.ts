import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getInvoiceItemService } from '../services/invoice-item.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const invoiceItemService = getInvoiceItemService();

// =============================================================================
// Invoice Item Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /invoices/:invoiceId/items
   * Add an item to an invoice
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { invoiceId } = req.params as { invoiceId: string };
    const { description, quantity, unitPrice, taxRateId } = req.body as Record<string, unknown>;

    if (!description || quantity === undefined || unitPrice === undefined) {
      return reply.code(400).send({ error: 'description, quantity, and unitPrice are required' });
    }

    const item = await invoiceItemService.add(invoiceId, authReq.user.userId, {
      description,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      taxRateId,
    });

    return reply.code(201).send({ success: true, data: item });
  });

  /**
   * PATCH /invoices/:invoiceId/items/:itemId
   * Update an invoice item
   */
  fastify.patch('/:itemId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { itemId } = req.params as { itemId: string };
    const { description, quantity, unitPrice, taxRateId } = req.body as Record<string, unknown>;

    const item = await invoiceItemService.update(itemId, authReq.user.userId, {
      description,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
      taxRateId,
    });

    if (!item) {
      return reply.code(404).send({ error: 'Invoice item not found' });
    }

    return reply.send({ success: true, data: item });
  });

  /**
   * DELETE /invoices/:invoiceId/items/:itemId
   * Delete an invoice item
   */
  fastify.delete('/:itemId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { itemId } = req.params as { itemId: string };

    await invoiceItemService.delete(itemId, authReq.user.userId);
    return reply.send({ success: true, message: 'Invoice item deleted' });
  });

  /**
   * POST /invoices/:invoiceId/items/reorder
   * Reorder invoice items
   */
  fastify.post('/reorder', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { invoiceId } = req.params as { invoiceId: string };
    const { itemIds } = req.body as { itemIds: unknown };

    if (!itemIds || !Array.isArray(itemIds)) {
      return reply.code(400).send({ error: 'itemIds array is required' });
    }

    const items = await invoiceItemService.reorder(invoiceId, authReq.user.userId, itemIds);
    return reply.send({ success: true, data: items });
  });
};

export default routes;
