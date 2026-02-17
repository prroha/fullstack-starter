import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getCustomerService } from '../services/customer.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const customerService = getCustomerService();

// =============================================================================
// Customer Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /customer/orders
   * Get customer order history with pagination
   */
  fastify.get('/orders', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query as Record<string, string>;

    const result = await customerService.getOrders(
      authReq.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /customer/orders/:id
   * Get customer order detail
   */
  fastify.get('/orders/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    const order = await customerService.getOrderById(authReq.user.userId, id);
    if (!order) {
      return reply.code(404).send({ error: 'Order not found' });
    }

    return reply.send({ success: true, data: order });
  });

  /**
   * GET /customer/stats
   * Get customer statistics (totalOrders, totalSpent, avgOrderValue)
   */
  fastify.get('/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;

    const stats = await customerService.getStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });
};

export default routes;
