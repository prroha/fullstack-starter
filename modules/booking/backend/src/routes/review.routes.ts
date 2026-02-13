import { Router, Request, Response } from 'express';
import { getReviewService } from '../services/review.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const reviewService = getReviewService();

// =============================================================================
// Public Endpoints
// =============================================================================

/**
 * GET /reviews/service/:serviceId
 * List reviews for a specific service (paginated)
 */
router.get('/service/:serviceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit } = req.query;

    const result = await reviewService.listServiceReviews(
      req.params.serviceId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ReviewRoutes] List service reviews error:', error);
    res.status(500).json({ error: 'Failed to list reviews' });
  }
});

/**
 * GET /reviews/provider/:providerId
 * List reviews for a specific provider (paginated)
 */
router.get('/provider/:providerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit } = req.query;

    const result = await reviewService.listProviderReviews(
      req.params.providerId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ReviewRoutes] List provider reviews error:', error);
    res.status(500).json({ error: 'Failed to list reviews' });
  }
});

// =============================================================================
// Authenticated Endpoints
// =============================================================================

/**
 * POST /reviews
 * Create a review for a booking service/provider
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { serviceId, providerId, rating, comment } = req.body;

    if (!serviceId || !providerId || !rating) {
      res.status(400).json({ error: 'serviceId, providerId, and rating are required' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    const review = await reviewService.createReview({
      userId: authReq.user.userId,
      serviceId,
      providerId,
      rating: Number(rating),
      comment,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('[ReviewRoutes] Create error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to create review',
    });
  }
});

/**
 * PATCH /reviews/:id
 * Update own review
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    const review = await reviewService.updateReview(req.params.id, {
      rating: rating ? Number(rating) : undefined,
      comment,
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.json({ success: true, data: review });
  } catch (error) {
    console.error('[ReviewRoutes] Update error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update review',
    });
  }
});

/**
 * DELETE /reviews/:id
 * Delete own review
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await reviewService.deleteReview(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('[ReviewRoutes] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
