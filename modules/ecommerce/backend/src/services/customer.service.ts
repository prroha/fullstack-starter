// =============================================================================
// E-Commerce Customer Service
// =============================================================================
// Business logic for customer-facing order history and purchase statistics.
// Supports dependency injection for preview mode (per-schema PrismaClient).
// Table: @@map("ecommerce_orders"), @@map("ecommerce_order_items")

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
}

// =============================================================================
// Customer Service
// =============================================================================

export class CustomerService {
  constructor(private db: PrismaClient) {}

  /**
   * Get paginated order history for a customer (totals in cents)
   */
  async getOrders(userId: string, page = 1, limit = 20) {
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
   * Get a specific order for a customer (ensures the order belongs to the user)
   */
  async getOrderById(userId: string, orderId: string) {
    const order = await this.db.ecommerceOrder.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  /**
   * Get aggregate purchase statistics for a customer (amounts in cents)
   */
  async getStats(userId: string): Promise<CustomerStats> {
    const [orderCount, aggregate] = await Promise.all([
      this.db.ecommerceOrder.count({
        where: { userId, status: { not: 'CANCELLED' } },
      }),
      this.db.ecommerceOrder.aggregate({
        where: { userId, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders: orderCount,
      totalSpent: aggregate._sum.totalAmount || 0,
      avgOrderValue: Math.round(aggregate._avg.totalAmount || 0),
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createCustomerService(db: PrismaClient): CustomerService {
  return new CustomerService(db);
}

let customerServiceInstance: CustomerService | null = null;

export function getCustomerService(db?: PrismaClient): CustomerService {
  if (db) return createCustomerService(db);
  if (!customerServiceInstance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    customerServiceInstance = new CustomerService(globalDb);
  }
  return customerServiceInstance;
}

export default CustomerService;
