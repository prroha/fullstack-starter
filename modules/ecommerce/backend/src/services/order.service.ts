// =============================================================================
// E-Commerce Order Service
// =============================================================================
// Business logic for order creation from cart, order number generation, and
// order lifecycle management. Supports dependency injection for preview mode
// (per-schema PrismaClient).
// Table: @@map("ecommerce_orders"), @@map("ecommerce_order_items")

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface OrderCreateInput {
  userId: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a unique order number: ORD-XXXXXXXXXX
 */
function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${result}`;
}

// =============================================================================
// Order Service
// =============================================================================

export class OrderService {
  constructor(private db: PrismaClient) {}

  /**
   * Create an order from the user's current cart (prices in cents)
   */
  async createOrder(input: OrderCreateInput) {
    // Snapshot cart items at current prices
    const cart = await this.db.cart.findFirst({
      where: { userId: input.userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    const cartItems = cart?.items || [];

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const orderNumber = generateOrderNumber();

    // Calculate totals (all values in cents)
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const taxAmount = 0; // Replace with tax calculation service
    const shippingCost = 0; // Replace with shipping calculation service
    const totalAmount = subtotal + taxAmount + shippingCost;

    const order = await this.db.ecommerceOrder.create({
      data: {
        orderNumber,
        userId: input.userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal,
        taxAmount,
        shippingCost,
        totalAmount,
        currency: 'usd',
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress || input.shippingAddress,
        notes: input.notes || null,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            productTitle: item.product.title,
            productSlug: item.product.slug,
            variantName: null,
            unitPrice: item.product.price,
            quantity: item.quantity,
            totalPrice: item.product.price * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Clear the cart after successful order creation
    if (cart) {
      await this.db.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return order;
  }

  /**
   * List orders for a user with pagination
   */
  async listOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.db.ecommerceOrder.findMany({
        where: { userId },
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.ecommerceOrder.count({ where: { userId } }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single order by ID
   */
  async getOrderById(id: string) {
    return this.db.ecommerceOrder.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  /**
   * Cancel an order (only if still pending)
   */
  async cancelOrder(id: string) {
    const order = await this.db.ecommerceOrder.findUnique({ where: { id } });
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new Error('Only pending orders can be cancelled');
    }
    return this.db.ecommerceOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createOrderService(db: PrismaClient): OrderService {
  return new OrderService(db);
}

let orderServiceInstance: OrderService | null = null;

export function getOrderService(db?: PrismaClient): OrderService {
  if (db) return createOrderService(db);
  if (!orderServiceInstance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    orderServiceInstance = new OrderService(globalDb);
  }
  return orderServiceInstance;
}

export default OrderService;
