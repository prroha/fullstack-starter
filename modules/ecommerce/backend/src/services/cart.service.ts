// =============================================================================
// E-Commerce Cart Service
// =============================================================================
// Business logic for shopping cart management, item operations, and guest-to-user
// cart merging. Uses placeholder db operations - replace with actual Prisma client.
// Table: @@map("ecommerce_carts"), @@map("ecommerce_cart_items")

// =============================================================================
// Types
// =============================================================================

export interface CartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

interface CartRecord {
  id: string;
  userId: string | null;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItemRecord {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async findCart(userId?: string, sessionId?: string): Promise<(CartRecord & { items: CartItemRecord[] }) | null> {
    // Replace with:
    // const where = userId ? { userId } : { sessionId };
    // return db.cart.findFirst({
    //   where,
    //   include: { items: { include: { product: true } }, },
    // });
    console.log('[DB] Finding cart for userId:', userId, 'sessionId:', sessionId);
    return null;
  },

  async createCart(userId?: string, sessionId?: string): Promise<CartRecord> {
    // Replace with: return db.cart.create({ data: { userId: userId || null, sessionId: sessionId || null } });
    console.log('[DB] Creating cart for userId:', userId, 'sessionId:', sessionId);
    return {
      id: 'cart_' + Date.now(),
      userId: userId || null,
      sessionId: sessionId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async addItem(cartId: string, input: CartItemInput & { unitPrice: number }): Promise<CartItemRecord> {
    // Replace with:
    // return db.cartItem.upsert({
    //   where: { cartId_productId_variantId: { cartId, productId: input.productId, variantId: input.variantId || null } },
    //   create: { cartId, productId: input.productId, variantId: input.variantId || null, quantity: input.quantity, unitPrice: input.unitPrice },
    //   update: { quantity: { increment: input.quantity } },
    // });
    console.log('[DB] Adding item to cart:', cartId, input.productId);
    return {
      id: 'cartitem_' + Date.now(),
      cartId,
      productId: input.productId,
      variantId: input.variantId || null,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItemRecord | null> {
    // Replace with: return db.cartItem.update({ where: { id: itemId }, data: { quantity } });
    console.log('[DB] Updating cart item quantity:', itemId, quantity);
    return null;
  },

  async removeItem(itemId: string): Promise<void> {
    // Replace with: await db.cartItem.delete({ where: { id: itemId } });
    console.log('[DB] Removing cart item:', itemId);
  },

  async clearCart(cartId: string): Promise<void> {
    // Replace with: await db.cartItem.deleteMany({ where: { cartId } });
    console.log('[DB] Clearing cart:', cartId);
  },

  async mergeCarts(sessionId: string, userId: string): Promise<void> {
    // Replace with:
    // const guestCart = await db.cart.findFirst({ where: { sessionId }, include: { items: true } });
    // if (!guestCart) return;
    // const userCart = await db.cart.findFirst({ where: { userId } });
    // if (userCart) {
    //   // Move guest items to user cart (upsert to avoid duplicates)
    //   for (const item of guestCart.items) {
    //     await db.cartItem.upsert({
    //       where: { cartId_productId_variantId: { cartId: userCart.id, productId: item.productId, variantId: item.variantId } },
    //       create: { cartId: userCart.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity, unitPrice: item.unitPrice },
    //       update: { quantity: { increment: item.quantity } },
    //     });
    //   }
    //   await db.cart.delete({ where: { id: guestCart.id } });
    // } else {
    //   await db.cart.update({ where: { id: guestCart.id }, data: { userId, sessionId: null } });
    // }
    console.log('[DB] Merging guest cart to user:', sessionId, userId);
  },
};

// =============================================================================
// Cart Service
// =============================================================================

export class CartService {
  /**
   * Get cart for a user or guest session, creating one if it does not exist
   */
  async getCart(userId?: string, sessionId?: string) {
    let cart = await dbOperations.findCart(userId, sessionId);

    if (!cart) {
      const newCart = await dbOperations.createCart(userId, sessionId);
      cart = { ...newCart, items: [] };
    }

    return cart;
  }

  /**
   * Add an item to the cart (price in cents)
   */
  async addItem(cartId: string, input: CartItemInput) {
    // In a real implementation, look up product price from db
    const unitPrice = 0; // Replace with: product.price
    return dbOperations.addItem(cartId, { ...input, unitPrice });
  }

  /**
   * Update the quantity of a cart item
   */
  async updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      await dbOperations.removeItem(itemId);
      return null;
    }
    return dbOperations.updateItemQuantity(itemId, quantity);
  }

  /**
   * Remove an item from the cart
   */
  async removeItem(itemId: string) {
    return dbOperations.removeItem(itemId);
  }

  /**
   * Clear all items from the cart
   */
  async clearCart(cartId: string) {
    return dbOperations.clearCart(cartId);
  }

  /**
   * Merge a guest session cart into a user's cart upon login
   */
  async mergeGuestCart(sessionId: string, userId: string) {
    return dbOperations.mergeCarts(sessionId, userId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let cartServiceInstance: CartService | null = null;

export function getCartService(): CartService {
  if (!cartServiceInstance) {
    cartServiceInstance = new CartService();
  }
  return cartServiceInstance;
}

export default CartService;
