import { Router, Request, Response } from 'express';
import { getCustomerService } from '../services/customer.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const customerService = getCustomerService();

// =============================================================================
// Customer Endpoints (All Authenticated)
// =============================================================================

/**
 * GET /customer/orders
 * Get customer order history with pagination
 */
router.get('/orders', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query;

    const result = await customerService.getOrders(
      authReq.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[CustomerRoutes] Order history error:', error);
    res.status(500).json({ error: 'Failed to get order history' });
  }
});

/**
 * GET /customer/orders/:id
 * Get customer order detail
 */
router.get('/orders/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const order = await customerService.getOrderById(authReq.user.userId, req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[CustomerRoutes] Order detail error:', error);
    res.status(500).json({ error: 'Failed to get order detail' });
  }
});

/**
 * GET /customer/stats
 * Get customer statistics (totalOrders, totalSpent, avgOrderValue)
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    const stats = await customerService.getStats(authReq.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[CustomerRoutes] Stats error:', error);
    res.status(500).json({ error: 'Failed to get customer stats' });
  }
});

export default router;
