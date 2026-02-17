import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getReviewService } from '../services/review.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const reviewService = getReviewService();

// =============================================================================
// Public Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /reviews/service/:serviceId
   * List reviews for a specific service (paginated)
   */
  fastify.get('/service/:serviceId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { serviceId } = req.params as { serviceId: string };
    const { page, limit } = req.query as Record<string, string>;

    const result = await reviewService.listServiceReviews(
      serviceId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    return reply.send({ success: true, data: result });
  });

  /**
   * GET /reviews/provider/:providerId
   * List reviews for a specific provider (paginated)
   */
  fastify.get('/provider/:providerId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { providerId } = req.params as { providerId: string };
    const { page, limit } = req.query as Record<string, string>;

    const result = await reviewService.listProviderReviews(
      providerId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    return reply.send({ success: true, data: result });
  });

  // =============================================================================
  // Authenticated Endpoints
  // =============================================================================

  /**
   * POST /reviews
   * Create a review for a booking service/provider
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { serviceId, providerId, rating, comment } = req.body as { serviceId: string; providerId: string; rating: number; comment?: string };

    if (!serviceId || !providerId || !rating) {
      return reply.code(400).send({ error: 'serviceId, providerId, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return reply.code(400).send({ error: 'Rating must be between 1 and 5' });
    }

    const review = await reviewService.createReview({
      userId: authReq.user.userId,
      serviceId,
      providerId,
      rating: Number(rating),
      comment,
    });

    return reply.code(201).send({ success: true, data: review });
  });

  /**
   * PATCH /reviews/:id
   * Update own review
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { rating, comment } = req.body as { rating?: number; comment?: string };

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return reply.code(400).send({ error: 'Rating must be between 1 and 5' });
    }

    const review = await reviewService.updateReview(id, {
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
   * Delete own review
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await reviewService.deleteReview(id);
    return reply.send({ success: true, message: 'Review deleted' });
  });
};

export default routes;
