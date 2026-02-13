// =============================================================================
// E-Commerce Order Service
// =============================================================================
// Business logic for order creation from cart, order number generation, and
// order lifecycle management. Uses placeholder db operations - replace with
// actual Prisma client.
// Table: @@map("ecommerce_orders"), @@map("ecommerce_order_items")

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

interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  paymentIntentId: string | null;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  shippingAddress: unknown;
  billingAddress: unknown;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
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
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async createOrder(
    data: OrderCreateInput & { orderNumber: string; subtotal: number; tax: number; shippingCost: number; total: number; currency: string },
    items: Array<{ productId: string; variantId?: string; title: string; sku?: string; unitPrice: number; quantity: number; total: number }>,
  ): Promise<OrderRecord & { items: OrderItemRecord[] }> {
    // Replace with:
    // return db.order.create({
    //   data: {
    //     orderNumber: data.orderNumber,
    //     userId: data.userId,
    //     status: 'PENDING',
    //     subtotal: data.subtotal,
    //     tax: data.tax,
    //     shippingCost: data.shippingCost,
    //     total: data.total,
    //     currency: data.currency,
    //     shippingAddress: data.shippingAddress,
    //     billingAddress: data.billingAddress || data.shippingAddress,
    //     notes: data.notes || null,
    //     items: {
    //       create: items.map(item => ({
    //         productId: item.productId,
    //         variantId: item.variantId || null,
    //         title: item.title,
    //         sku: item.sku || null,
    //         unitPrice: item.unitPrice,
    //         quantity: item.quantity,
    //         total: item.total,
    //       })),
    //     },
    //   },
    //   include: { items: true },
    // });
    console.log('[DB] Creating order:', data.orderNumber, 'for user:', data.userId);
    const orderId = 'order_' + Date.now();
    return {
      id: orderId,
      orderNumber: data.orderNumber,
      userId: data.userId,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentIntentId: null,
      subtotal: data.subtotal,
      taxAmount: data.tax,
      shippingCost: data.shippingCost,
      totalAmount: data.total,
      currency: data.currency,
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress || data.shippingAddress,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: items.map((item, index) => ({
        id: `orderitem_${Date.now()}_${index}`,
        orderId,
        productId: item.productId,
        productTitle: item.title,
        productSlug: '',
        variantName: null,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.total,
      })),
    };
  },

  async findOrders(userId: string, page: number, limit: number): Promise<{ items: OrderRecord[]; total: number }> {
    // Replace with:
    // const skip = (page - 1) * limit;
    // const [items, total] = await Promise.all([
    //   db.order.findMany({ where: { userId }, skip, take: limit, include: { items: true }, orderBy: { createdAt: 'desc' } }),
    //   db.order.count({ where: { userId } }),
    // ]);
    console.log('[DB] Finding orders for user:', userId, 'page:', page);
    return { items: [], total: 0 };
  },

  async findOrderById(id: string): Promise<(OrderRecord & { items: OrderItemRecord[] }) | null> {
    // Replace with: return db.order.findUnique({ where: { id }, include: { items: true } });
    console.log('[DB] Finding order by ID:', id);
    return null;
  },

  async cancelOrder(id: string): Promise<OrderRecord | null> {
    // Replace with: return db.order.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    console.log('[DB] Cancelling order:', id);
    return null;
  },

  async getCartItems(userId: string): Promise<Array<{
    productId: string;
    variantId: string | null;
    title: string;
    sku: string | null;
    unitPrice: number;
    quantity: number;
  }>> {
    // Replace with:
    // const cart = await db.cart.findFirst({
    //   where: { userId },
    //   include: { items: { include: { product: true } } },
    // });
    // return cart?.items.map(item => ({
    //   productId: item.productId,
    //   variantId: item.variantId,
    //   title: item.product.title,
    //   sku: item.product.sku,
    //   unitPrice: item.unitPrice,
    //   quantity: item.quantity,
    // })) || [];
    console.log('[DB] Getting cart items for user:', userId);
    return [];
  },

  async clearCartAfterOrder(userId: string): Promise<void> {
    // Replace with:
    // const cart = await db.cart.findFirst({ where: { userId } });
    // if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    console.log('[DB] Clearing cart after order for user:', userId);
  },
};

// =============================================================================
// Order Service
// =============================================================================

export class OrderService {
  /**
   * Create an order from the user's current cart (prices in cents)
   */
  async createOrder(input: OrderCreateInput) {
    // Snapshot cart items at current prices
    const cartItems = await dbOperations.getCartItems(input.userId);

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const orderNumber = generateOrderNumber();

    // Calculate totals (all values in cents)
    const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = 0; // Replace with tax calculation service
    const shippingCost = 0; // Replace with shipping calculation service
    const total = subtotal + tax + shippingCost;

    const items = cartItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      title: item.title,
      sku: item.sku || undefined,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: item.unitPrice * item.quantity,
    }));

    const order = await dbOperations.createOrder(
      {
        ...input,
        orderNumber,
        subtotal,
        tax,
        shippingCost,
        total,
        currency: 'usd',
      },
      items,
    );

    // Clear the cart after successful order creation
    await dbOperations.clearCartAfterOrder(input.userId);

    return order;
  }

  /**
   * List orders for a user with pagination
   */
  async listOrders(userId: string, page = 1, limit = 20) {
    const result = await dbOperations.findOrders(userId, page, limit);

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Get a single order by ID
   */
  async getOrderById(id: string) {
    return dbOperations.findOrderById(id);
  }

  /**
   * Cancel an order (only if still pending)
   */
  async cancelOrder(id: string) {
    const order = await dbOperations.findOrderById(id);
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new Error('Only pending orders can be cancelled');
    }
    return dbOperations.cancelOrder(id);
  }
}

// =============================================================================
// Factory
// =============================================================================

let orderServiceInstance: OrderService | null = null;

export function getOrderService(): OrderService {
  if (!orderServiceInstance) {
    orderServiceInstance = new OrderService();
  }
  return orderServiceInstance;
}

export default OrderService;
