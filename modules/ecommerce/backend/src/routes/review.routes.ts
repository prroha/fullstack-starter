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
 * GET /reviews/product/:productId
 * List reviews for a specific product
 */
router.get('/product/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit } = req.query;

    const result = await reviewService.listProductReviews(
      req.params.productId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[ReviewRoutes] List product reviews error:', error);
    res.status(500).json({ error: 'Failed to list reviews' });
  }
});

/**
 * GET /reviews/product/:productId/stats
 * Get rating statistics for a product
 */
router.get('/product/:productId/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await reviewService.getProductRatingStats(req.params.productId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[ReviewRoutes] Rating stats error:', error);
    res.status(500).json({ error: 'Failed to get rating stats' });
  }
});

// =============================================================================
// Authenticated Endpoints
// =============================================================================

/**
 * POST /reviews
 * Create a review for a product
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      res.status(400).json({ error: 'productId and rating are required' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    const review = await reviewService.createReview({
      userId: authReq.user.userId,
      productId,
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
 * Update a review
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
 * Delete a review
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
