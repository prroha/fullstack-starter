import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { CartService } from '../services/cart.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// DI Helper
// =============================================================================

function svc(req: FastifyRequest): CartService {
  return new CartService((req as FastifyRequest & { db?: PrismaClient }).db!);
}

// =============================================================================
// Helper: Extract cart identity (userId or sessionId)
// =============================================================================

function getCartIdentity(req: FastifyRequest): { userId?: string; sessionId?: string } {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.userId) {
    return { userId: authReq.user.userId };
  }
  const query = req.query as Record<string, string>;
  const sessionId = query.sessionId || (req.headers['x-session-id'] as string);
  return { sessionId };
}

// =============================================================================
// Cart Endpoints (Auth Optional — uses userId or sessionId)
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /cart
   * Get current cart for authenticated user or guest session
   */
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId, sessionId } = getCartIdentity(req);

    if (!userId && !sessionId) {
      return reply.code(400).send({ error: 'Authentication or sessionId is required' });
    }

    const cart = await svc(req).getCart(userId, sessionId);
    return reply.send({ success: true, data: cart });
  });

  /**
   * POST /cart/items
   * Add item to cart
   */
  fastify.post('/items', async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId, sessionId } = getCartIdentity(req);
    const { productId, variantId, quantity } = req.body as { productId: string; variantId?: string; quantity?: number };

    if (!productId) {
      return reply.code(400).send({ error: 'productId is required' });
    }

    if (!userId && !sessionId) {
      return reply.code(400).send({ error: 'Authentication or sessionId is required' });
    }

    const service = svc(req);
    const existingCart = await service.getCart(userId, sessionId);
    const cart = await service.addItem(existingCart.id, {
      productId,
      variantId,
      quantity: quantity ? Number(quantity) : 1,
    });

    return reply.code(201).send({ success: true, data: cart });
  });

  /**
   * PATCH /cart/items/:itemId
   * Update cart item quantity
   */
  fastify.patch('/items/:itemId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { itemId } = req.params as { itemId: string };
    const { quantity } = req.body as { quantity?: number };

    if (quantity === undefined || quantity === null) {
      return reply.code(400).send({ error: 'quantity is required' });
    }

    const cart = await svc(req).updateQuantity(itemId, Number(quantity));

    if (!cart) {
      return reply.code(404).send({ error: 'Cart item not found' });
    }

    return reply.send({ success: true, data: cart });
  });

  /**
   * DELETE /cart/items/:itemId
   * Remove item from cart
   */
  fastify.delete('/items/:itemId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { itemId } = req.params as { itemId: string };
    await svc(req).removeItem(itemId);
    return reply.send({ success: true, message: 'Item removed from cart' });
  });

  /**
   * DELETE /cart
   * Clear entire cart
   */
  fastify.delete('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId, sessionId } = getCartIdentity(req);

    if (!userId && !sessionId) {
      return reply.code(400).send({ error: 'Authentication or sessionId is required' });
    }

    const service = svc(req);
    const cart = await service.getCart(userId, sessionId);
    await service.clearCart(cart.id);
    return reply.send({ success: true, message: 'Cart cleared' });
  });

  /**
   * POST /cart/merge
   * Merge guest cart into authenticated user's cart
   */
  fastify.post('/merge', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { sessionId } = req.body as { sessionId: string };

    if (!sessionId) {
      return reply.code(400).send({ error: 'sessionId is required' });
    }

    const service = svc(req);
    await service.mergeGuestCart(sessionId, authReq.user.userId);

    const cart = await service.getCart(authReq.user.userId, undefined);
    return reply.send({ success: true, data: cart });
  });
};

export default routes;
