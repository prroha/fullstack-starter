import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { ReviewService } from '../services/review.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// DI Helper
// =============================================================================

function svc(req: FastifyRequest): ReviewService {
  return new ReviewService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Public Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /reviews/product/:productId
   * List reviews for a specific product
   */
  fastify.get('/product/:productId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { productId } = req.params as { productId: string };
    const { page, limit } = req.query as Record<string, string>;

    const result = await svc(req).listProductReviews(
      productId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /reviews/product/:productId/stats
   * Get rating statistics for a product
   */
  fastify.get('/product/:productId/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    const { productId } = req.params as { productId: string };
    const stats = await svc(req).getProductRatingStats(productId);
    return reply.send({ success: true, data: stats });
  });

  // =============================================================================
  // Authenticated Endpoints
  // =============================================================================

  /**
   * POST /reviews
   * Create a review for a product
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { productId, rating, comment } = req.body as { productId: string; rating: number; comment?: string };

    if (!productId || !rating) {
      return reply.code(400).send({ error: 'productId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return reply.code(400).send({ error: 'Rating must be between 1 and 5' });
    }

    const review = await svc(req).createReview({
      userId: authReq.user.userId,
      productId,
      rating: Number(rating),
      comment,
    });

    return reply.code(201).send({ success: true, data: review });
  });

  /**
   * PATCH /reviews/:id
   * Update a review
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { rating, comment } = req.body as { rating?: number; comment?: string };

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return reply.code(400).send({ error: 'Rating must be between 1 and 5' });
    }

    const review = await svc(req).updateReview(id, {
      rating: rating ? Number(rating) : undefined,
      comment,
    });

    if (!review) {
      return reply.code(404).send({ error: 'Review not found' });
    }

    return reply.send({ success: true, data: review });
  });

  /**
   * DELETE /reviews/:id
   * Delete a review
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await svc(req).deleteReview(id);
    return reply.send({ success: true, message: 'Review deleted' });
  });
};

export default routes;
