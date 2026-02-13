// =============================================================================
// E-Commerce Customer Service
// =============================================================================
// Business logic for customer-facing order history and purchase statistics.
// Uses placeholder db operations - replace with actual Prisma client.
// Table: @@map("ecommerce_orders"), @@map("ecommerce_order_items")

// =============================================================================
// Types
// =============================================================================

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
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
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async getCustomerOrders(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: (OrderRecord & { items: OrderItemRecord[] })[]; total: number }> {
    // Replace with:
    // const skip = (page - 1) * limit;
    // const [items, total] = await Promise.all([
    //   db.order.findMany({
    //     where: { userId },
    //     skip,
    //     take: limit,
    //     include: { items: true },
    //     orderBy: { createdAt: 'desc' },
    //   }),
    //   db.order.count({ where: { userId } }),
    // ]);
    console.log('[DB] Getting customer orders:', userId, 'page:', page);
    return { items: [], total: 0 };
  },

  async getCustomerOrderById(
    userId: string,
    orderId: string,
  ): Promise<(OrderRecord & { items: OrderItemRecord[] }) | null> {
    // Replace with:
    // return db.order.findFirst({
    //   where: { id: orderId, userId },
    //   include: { items: { include: { product: true } } },
    // });
    console.log('[DB] Getting customer order:', userId, orderId);
    return null;
  },

  async getCustomerStats(userId: string): Promise<CustomerStats> {
    // Replace with:
    // const [orderCount, aggregate] = await Promise.all([
    //   db.order.count({ where: { userId, status: { not: 'CANCELLED' } } }),
    //   db.order.aggregate({
    //     where: { userId, status: { not: 'CANCELLED' } },
    //     _sum: { total: true },
    //     _avg: { total: true },
    //   }),
    // ]);
    // return {
    //   totalOrders: orderCount,
    //   totalSpent: aggregate._sum.total || 0,
    //   avgOrderValue: aggregate._avg.total || 0,
    // };
    console.log('[DB] Getting customer stats:', userId);
    return {
      totalOrders: 0,
      totalSpent: 0,
      avgOrderValue: 0,
    };
  },
};

// =============================================================================
// Customer Service
// =============================================================================

export class CustomerService {
  /**
   * Get paginated order history for a customer (totals in cents)
   */
  async getOrders(userId: string, page = 1, limit = 20) {
    const result = await dbOperations.getCustomerOrders(userId, page, limit);

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
   * Get a specific order for a customer (ensures the order belongs to the user)
   */
  async getOrderById(userId: string, orderId: string) {
    const order = await dbOperations.getCustomerOrderById(userId, orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  /**
   * Get aggregate purchase statistics for a customer (amounts in cents)
   */
  async getStats(userId: string): Promise<CustomerStats> {
    const stats = await dbOperations.getCustomerStats(userId);
    return {
      totalOrders: stats.totalOrders,
      totalSpent: stats.totalSpent,
      avgOrderValue: Math.round(stats.avgOrderValue),
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

let customerServiceInstance: CustomerService | null = null;

export function getCustomerService(): CustomerService {
  if (!customerServiceInstance) {
    customerServiceInstance = new CustomerService();
  }
  return customerServiceInstance;
}

export default CustomerService;
