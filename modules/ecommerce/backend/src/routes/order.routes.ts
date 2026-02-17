import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getOrderService } from '../services/order.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const orderService = getOrderService();

// =============================================================================
// Order Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /orders
   * Create an order from the current cart
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { shippingAddress, billingAddress, notes } = req.body as Record<string, unknown>;

    if (!shippingAddress) {
      return reply.code(400).send({ error: 'Shipping address is required' });
    }

    const order = await orderService.createOrder({
      userId: authReq.user.userId,
      shippingAddress,
      billingAddress,
      notes,
    });

    return reply.code(201).send({ success: true, data: order });
  });

  /**
   * GET /orders
   * List current user's orders with pagination
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query as Record<string, string>;

    const result = await orderService.listOrders(
      authReq.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /orders/:id
   * Get order details by id
   */
  fastify.get('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const order = await orderService.getOrderById(id);
    if (!order) {
      return reply.code(404).send({ error: 'Order not found' });
    }

    return reply.send({ success: true, data: order });
  });

  /**
   * POST /orders/:id/cancel
   * Cancel an order
   */
  fastify.post('/:id/cancel', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const order = await orderService.cancelOrder(id);
    if (!order) {
      return reply.code(404).send({ error: 'Order not found' });
    }

    return reply.send({ success: true, data: order });
  });
};

export default routes;
