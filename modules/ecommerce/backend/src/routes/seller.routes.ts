import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { SellerService } from '../services/seller.service.js';
import { ProductService } from '../services/product.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// DI Helpers
// =============================================================================

function getDb(req: FastifyRequest): PrismaClient {
  return (req as FastifyRequest & { db?: PrismaClient }).db!;
}

function sellerSvc(req: FastifyRequest): SellerService {
  return new SellerService(getDb(req));
}

function productSvc(req: FastifyRequest): ProductService {
  return new ProductService(getDb(req));
}

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
    const stats = await sellerSvc(req).getDashboardStats(authReq.user.userId);
    return reply.send({ success: true, data: stats });
  });

  /**
   * GET /seller/products
   * List seller's own products (all statuses) with pagination
   */
  fastify.get('/products', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query as Record<string, string>;

    const result = await productSvc(req).listProducts({
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
    const analytics = await sellerSvc(req).getProductAnalytics(authReq.user.userId);
    return reply.send({ success: true, data: analytics });
  });

  /**
   * GET /seller/orders
   * Get seller's orders with pagination
   */
  fastify.get('/orders', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query as Record<string, string>;

    const result = await sellerSvc(req).getOrders(
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
    const orders = await sellerSvc(req).getRecentOrders(authReq.user.userId, 5);
    return reply.send({ success: true, data: orders });
  });

  /**
   * GET /seller/reviews/recent
   * Get 5 most recent reviews for seller's products
   */
  fastify.get('/reviews/recent', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const reviews = await sellerSvc(req).getRecentReviews(authReq.user.userId, 5);
    return reply.send({ success: true, data: reviews });
  });

  /**
   * GET /seller/revenue
   * Get revenue data for seller (daily/weekly/monthly)
   */
  fastify.get('/revenue', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { period } = req.query as Record<string, string>;

    const revenue = await sellerSvc(req).getRevenue(
      authReq.user.userId,
      (period as 'daily' | 'weekly' | 'monthly') || 'monthly',
    );

    return reply.send({ success: true, data: revenue });
  });
};

export default routes;
