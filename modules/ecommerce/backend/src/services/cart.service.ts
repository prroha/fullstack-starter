// =============================================================================
// E-Commerce Cart Service
// =============================================================================
// Business logic for shopping cart management, item operations, and guest-to-user
// cart merging. Supports dependency injection for preview mode (per-schema PrismaClient).
// Table: @@map("ecommerce_carts"), @@map("ecommerce_cart_items")

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface CartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

// =============================================================================
// Cart Service
// =============================================================================

export class CartService {
  constructor(private db: PrismaClient) {}

  /**
   * Get cart for a user or guest session, creating one if it does not exist
   */
  async getCart(userId?: string, sessionId?: string) {
    const where = userId ? { userId } : { sessionId: sessionId! };

    let cart = await this.db.cart.findFirst({
      where,
      include: {
        items: {
          include: { product: true, variant: true },
        },
      },
    });

    if (!cart) {
      cart = await this.db.cart.create({
        data: {
          userId: userId || null,
          sessionId: sessionId || null,
        },
        include: {
          items: {
            include: { product: true, variant: true },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Add an item to the cart (looks up product price from db)
   */
  async addItem(cartId: string, input: CartItemInput) {
    // Look up the product to get its price
    const product = await this.db.product.findUnique({
      where: { id: input.productId },
      select: { price: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // If a variant is specified, check its price
    let unitPrice = product.price;
    if (input.variantId) {
      const variant = await this.db.productVariant.findUnique({
        where: { id: input.variantId },
        select: { price: true },
      });
      if (variant && variant.price > 0) {
        unitPrice = variant.price;
      }
    }

    // Upsert: if item already in cart, increment quantity
    return this.db.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId,
          productId: input.productId,
          variantId: input.variantId || null,
        },
      },
      create: {
        cartId,
        productId: input.productId,
        variantId: input.variantId || null,
        quantity: input.quantity,
      },
      update: {
        quantity: { increment: input.quantity },
      },
      include: { product: true, variant: true },
    });
  }

  /**
   * Update the quantity of a cart item
   */
  async updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      await this.db.cartItem.delete({ where: { id: itemId } });
      return null;
    }
    return this.db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true, variant: true },
    });
  }

  /**
   * Remove an item from the cart
   */
  async removeItem(itemId: string) {
    await this.db.cartItem.delete({ where: { id: itemId } });
  }

  /**
   * Clear all items from the cart
   */
  async clearCart(cartId: string) {
    await this.db.cartItem.deleteMany({ where: { cartId } });
  }

  /**
   * Merge a guest session cart into a user's cart upon login
   */
  async mergeGuestCart(sessionId: string, userId: string) {
    const guestCart = await this.db.cart.findFirst({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart) return;

    const userCart = await this.db.cart.findFirst({
      where: { userId },
    });

    if (userCart) {
      // Move guest items to user cart (upsert to avoid duplicates)
      for (const item of guestCart.items) {
        await this.db.cartItem.upsert({
          where: {
            cartId_productId_variantId: {
              cartId: userCart.id,
              productId: item.productId,
              variantId: item.variantId,
            },
          },
          create: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
          update: {
            quantity: { increment: item.quantity },
          },
        });
      }
      await this.db.cart.delete({ where: { id: guestCart.id } });
    } else {
      await this.db.cart.update({
        where: { id: guestCart.id },
        data: { userId, sessionId: null },
      });
    }
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createCartService(db: PrismaClient): CartService {
  return new CartService(db);
}

let cartServiceInstance: CartService | null = null;

export function getCartService(db?: PrismaClient): CartService {
  if (db) return createCartService(db);
  if (!cartServiceInstance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    cartServiceInstance = new CartService(globalDb);
  }
  return cartServiceInstance;
}

export default CartService;
