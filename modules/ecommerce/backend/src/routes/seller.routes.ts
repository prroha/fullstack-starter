import { Router, Request, Response } from 'express';
import { getSellerService } from '../services/seller.service';
import { getProductService } from '../services/product.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const sellerService = getSellerService();
const productService = getProductService();

// =============================================================================
// Seller Dashboard Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /seller/stats
 * Get seller dashboard statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const stats = await sellerService.getDashboardStats(authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[SellerRoutes] Stats error:', error);
    res.status(500).json({ error: 'Failed to get seller stats' });
  }
});

/**
 * GET /seller/products
 * List seller's own products (all statuses) with pagination
 */
router.get('/products', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query;

    const result = await productService.listProducts({
      sellerId: authReq.user.userId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[SellerRoutes] Products error:', error);
    res.status(500).json({ error: 'Failed to get seller products' });
  }
});

/**
 * GET /seller/products/analytics
 * Get per-product analytics for seller
 */
router.get('/products/analytics', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const analytics = await sellerService.getProductAnalytics(authReq.user.userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('[SellerRoutes] Product analytics error:', error);
    res.status(500).json({ error: 'Failed to get product analytics' });
  }
});

/**
 * GET /seller/orders
 * Get seller's orders with pagination
 */
router.get('/orders', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query;

    const result = await sellerService.getOrders(
      authReq.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[SellerRoutes] Orders error:', error);
    res.status(500).json({ error: 'Failed to get seller orders' });
  }
});

/**
 * GET /seller/orders/recent
 * Get 5 most recent orders for seller
 */
router.get('/orders/recent', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const orders = await sellerService.getRecentOrders(authReq.user.userId, 5);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('[SellerRoutes] Recent orders error:', error);
    res.status(500).json({ error: 'Failed to get recent orders' });
  }
});

/**
 * GET /seller/reviews/recent
 * Get 5 most recent reviews for seller's products
 */
router.get('/reviews/recent', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const reviews = await sellerService.getRecentReviews(authReq.user.userId, 5);
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('[SellerRoutes] Recent reviews error:', error);
    res.status(500).json({ error: 'Failed to get recent reviews' });
  }
});

/**
 * GET /seller/revenue
 * Get revenue data for seller (daily/weekly/monthly)
 */
router.get('/revenue', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { period } = req.query;

    const revenue = await sellerService.getRevenue(
      authReq.user.userId,
      (period as 'daily' | 'weekly' | 'monthly') || 'monthly',
    );

    res.json({ success: true, data: revenue });
  } catch (error) {
    console.error('[SellerRoutes] Revenue error:', error);
    res.status(500).json({ error: 'Failed to get revenue data' });
  }
});

export default router;
