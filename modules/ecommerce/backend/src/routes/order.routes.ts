import { Router, Request, Response } from 'express';
import { getOrderService } from '../services/order.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const orderService = getOrderService();

// =============================================================================
// Order Endpoints (All Authenticated)
// =============================================================================

/**
 * POST /orders
 * Create an order from the current cart
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { shippingAddress, billingAddress, notes } = req.body;

    if (!shippingAddress) {
      res.status(400).json({ error: 'Shipping address is required' });
      return;
    }

    const order = await orderService.createOrder({
      userId: authReq.user.userId,
      shippingAddress,
      billingAddress,
      notes,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('[OrderRoutes] Create error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create order',
    });
  }
});

/**
 * GET /orders
 * List current user's orders with pagination
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { page, limit } = req.query;

    const result = await orderService.listOrders(
      authReq.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[OrderRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

/**
 * GET /orders/:id
 * Get order details by id
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[OrderRoutes] Get by id error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
});

/**
 * POST /orders/:id/cancel
 * Cancel an order
 */
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await orderService.cancelOrder(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[OrderRoutes] Cancel error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cancel order',
    });
  }
});

export default router;
