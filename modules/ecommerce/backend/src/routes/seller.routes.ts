import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getSellerService } from '../services/seller.service.js';
import { getProductService } from '../services/product.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const sellerService = getSellerService();
const productService = getProductService();

// =============================================================================
// Seller Dashboard Endpoints (All Authenticated)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /seller/stats
   * Get seller dashboard statistics
   */
  fastify.get('/stats', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const stats = await sellerService.getDashboardStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });

  /**
   * GET /seller/products
   * List seller's own products (all statuses) with pagination
   */
  fastify.get('/products', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query as Record<string, string>;

    const result = await productService.listProducts({
      sellerId: authReq.user.userId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /seller/products/analytics
   * Get per-product analytics for seller
   */
  fastify.get('/products/analytics', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const analytics = await sellerService.getProductAnalytics(authReq.user.userId);
    return reply.send({ success: true, data: analytics });
  });

  /**
   * GET /seller/orders
   * Get seller's orders with pagination
   */
  fastify.get('/orders', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query as Record<string, string>;

    const result = await sellerService.getOrders(
      authReq.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /seller/orders/recent
   * Get 5 most recent orders for seller
   */
  fastify.get('/orders/recent', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const orders = await sellerService.getRecentOrders(authReq.user.userId, 5);
    return reply.send({ success: true, data: orders });
  });

  /**
   * GET /seller/reviews/recent
   * Get 5 most recent reviews for seller's products
   */
  fastify.get('/reviews/recent', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const reviews = await sellerService.getRecentReviews(authReq.user.userId, 5);
    return reply.send({ success: true, data: reviews });
  });

  /**
   * GET /seller/revenue
   * Get revenue data for seller (daily/weekly/monthly)
   */
  fastify.get('/revenue', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { period } = req.query as Record<string, string>;

    const revenue = await sellerService.getRevenue(
      authReq.user.userId,
      (period as 'daily' | 'weekly' | 'monthly') || 'monthly',
    );

    return reply.send({ success: true, data: revenue });
  });
};

export default routes;
