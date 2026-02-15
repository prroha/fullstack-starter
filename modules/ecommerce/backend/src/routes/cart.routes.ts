import { Router, Request, Response } from 'express';
import { getCartService } from '../services/cart.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const cartService = getCartService();

// =============================================================================
// Helper: Extract cart identity (userId or sessionId)
// =============================================================================

function getCartIdentity(req: Request): { userId?: string; sessionId?: string } {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.userId) {
    return { userId: authReq.user.userId };
  }
  const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string);
  return { sessionId };
}

// =============================================================================
// Cart Endpoints (Auth Optional — uses userId or sessionId)
// =============================================================================

/**
 * GET /cart
 * Get current cart for authenticated user or guest session
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = getCartIdentity(req);

    if (!userId && !sessionId) {
      res.status(400).json({ error: 'Authentication or sessionId is required' });
      return;
    }

    const cart = await cartService.getCart(userId, sessionId);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('[CartRoutes] Get cart error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

/**
 * POST /cart/items
 * Add item to cart
 */
router.post('/items', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = getCartIdentity(req);
    const { productId, variantId, quantity } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'productId is required' });
      return;
    }

    if (!userId && !sessionId) {
      res.status(400).json({ error: 'Authentication or sessionId is required' });
      return;
    }

    const existingCart = await cartService.getCart(userId, sessionId);
    const cart = await cartService.addItem(existingCart.id, {
      productId,
      variantId,
      quantity: quantity ? Number(quantity) : 1,
    });

    res.status(201).json({ success: true, data: cart });
  } catch (error) {
    console.error('[CartRoutes] Add item error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add item to cart',
    });
  }
});

/**
 * PATCH /cart/items/:itemId
 * Update cart item quantity
 */
router.patch('/items/:itemId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      res.status(400).json({ error: 'quantity is required' });
      return;
    }

    const cart = await cartService.updateQuantity(req.params.itemId, Number(quantity));

    if (!cart) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('[CartRoutes] Update item error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update cart item',
    });
  }
});

/**
 * DELETE /cart/items/:itemId
 * Remove item from cart
 */
router.delete('/items/:itemId', async (req: Request, res: Response): Promise<void> => {
  try {
    await cartService.removeItem(req.params.itemId);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('[CartRoutes] Remove item error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

/**
 * DELETE /cart
 * Clear entire cart
 */
router.delete('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = getCartIdentity(req);

    if (!userId && !sessionId) {
      res.status(400).json({ error: 'Authentication or sessionId is required' });
      return;
    }

    const cart = await cartService.getCart(userId, sessionId);
    await cartService.clearCart(cart.id);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('[CartRoutes] Clear cart error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

/**
 * POST /cart/merge
 * Merge guest cart into authenticated user's cart
 */
router.post('/merge', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    await cartService.mergeGuestCart(sessionId, authReq.user.userId);

    const cart = await cartService.getCart(authReq.user.userId, undefined);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('[CartRoutes] Merge cart error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to merge carts',
    });
  }
});

export default router;
