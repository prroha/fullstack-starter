import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getPaymentService } from '../services/payment.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const paymentService = getPaymentService();

// =============================================================================
// Payment Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /invoices/:invoiceId/payments
   * List payments for an invoice
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { invoiceId } = req.params as { invoiceId: string };

    const payments = await paymentService.list(invoiceId, authReq.user.userId);
    return reply.send({ success: true, data: payments });
  });

  /**
   * POST /invoices/:invoiceId/payments
   * Record a payment for an invoice
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { invoiceId } = req.params as { invoiceId: string };
    const { amount, method, paidAt, reference } = req.body as Record<string, unknown>;

    if (!amount || !method || !paidAt) {
      return reply.code(400).send({ error: 'amount, method, and paidAt are required' });
    }

    const payment = await paymentService.record(authReq.user.userId, {
      invoiceId,
      amount: Number(amount),
      method,
      paidAt,
      reference,
    });

    return reply.code(201).send({ success: true, data: payment });
  });

  /**
   * DELETE /invoices/:invoiceId/payments/:paymentId
   * Delete a payment
   */
  fastify.delete('/:paymentId', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { paymentId } = req.params as { paymentId: string };

    await paymentService.delete(paymentId, authReq.user.userId);
    return reply.send({ success: true, message: 'Payment deleted' });
  });
};

export default routes;
