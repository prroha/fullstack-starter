// =============================================================================
// E-Commerce Seller Service
// =============================================================================
// Analytics aggregation for seller dashboard, revenue tracking, and product stats.
// Supports dependency injection for preview mode (per-schema PrismaClient).
// Table: @@map("ecommerce_products"), @@map("ecommerce_orders"), @@map("ecommerce_product_reviews")

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface SellerStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
}

export interface SellerRevenueData {
  period: string;
  amount: number;
  orders: number;
}

export interface ProductAnalytics {
  productId: string;
  productTitle: string;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
  reviewCount: number;
  stock: number;
}

// =============================================================================
// Seller Service
// =============================================================================

export class SellerService {
  constructor(private db: PrismaClient) {}

  /**
   * Get aggregate stats for a seller's dashboard (revenue in cents)
   */
  async getDashboardStats(sellerId: string): Promise<SellerStats> {
    const [totalProducts, activeProducts, ratingData] = await Promise.all([
      this.db.product.count({ where: { sellerId } }),
      this.db.product.count({ where: { sellerId, status: 'ACTIVE' } }),
      this.db.productReview.aggregate({
        where: { product: { sellerId } },
        _avg: { rating: true },
      }),
    ]);

    // Count orders that contain this seller's products via OrderItem -> productId -> Product.sellerId
    // We need to find order items for this seller's products
    const sellerOrderItems = await this.db.orderItem.findMany({
      where: {
        productId: {
          in: (
            await this.db.product.findMany({
              where: { sellerId },
              select: { id: true },
            })
          ).map((p) => p.id),
        },
      },
      select: { orderId: true, totalPrice: true },
    });

    const uniqueOrderIds = new Set(sellerOrderItems.map((i) => i.orderId));
    const totalRevenue = sellerOrderItems.reduce((sum, i) => sum + i.totalPrice, 0);

    return {
      totalProducts,
      activeProducts,
      totalOrders: uniqueOrderIds.size,
      totalRevenue,
      avgRating: Math.round((ratingData._avg.rating || 0) * 10) / 10,
    };
  }

  /**
   * Get per-product analytics for a seller (revenue in cents)
   */
  async getProductAnalytics(sellerId: string): Promise<ProductAnalytics[]> {
    const products = await this.db.product.findMany({
      where: { sellerId },
      include: {
        reviews: { select: { rating: true } },
      },
    });

    // Get order items for all seller products
    const productIds = products.map((p) => p.id);
    const orderItems = await this.db.orderItem.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, quantity: true, totalPrice: true },
    });

    // Group order items by product
    const orderItemsByProduct = new Map<string, typeof orderItems>();
    for (const item of orderItems) {
      const list = orderItemsByProduct.get(item.productId) || [];
      list.push(item);
      orderItemsByProduct.set(item.productId, list);
    }

    return products.map((p) => {
      const items = orderItemsByProduct.get(p.id) || [];
      const totalOrders = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalRevenue = items.reduce((sum, i) => sum + i.totalPrice, 0);
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : 0;

      return {
        productId: p.id,
        productTitle: p.title,
        totalOrders,
        totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: p.reviews.length,
        stock: p.stock,
      };
    });
  }

  /**
   * Get paginated orders containing seller's products
   */
  async getOrders(sellerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get seller's product IDs
    const sellerProductIds = (
      await this.db.product.findMany({
        where: { sellerId },
        select: { id: true },
      })
    ).map((p) => p.id);

    const where = {
      items: { some: { productId: { in: sellerProductIds } } },
    };

    const [orders, total] = await Promise.all([
      this.db.ecommerceOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            where: { productId: { in: sellerProductIds } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.ecommerceOrder.count({ where }),
    ]);

    // Map to the expected shape
    const items = orders.flatMap((order) =>
      order.items.map((item) => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.userId, // userId as placeholder; join User table if available
        productTitle: item.productTitle,
        quantity: item.quantity,
        total: item.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
      })),
    );

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
   * Get recent orders across all seller products
   */
  async getRecentOrders(sellerId: string, limit = 10) {
    const sellerProductIds = (
      await this.db.product.findMany({
        where: { sellerId },
        select: { id: true },
      })
    ).map((p) => p.id);

    const orders = await this.db.ecommerceOrder.findMany({
      where: {
        items: { some: { productId: { in: sellerProductIds } } },
      },
      include: {
        items: {
          where: { productId: { in: sellerProductIds } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return orders.flatMap((order) =>
      order.items.map((item) => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.userId,
        productTitle: item.productTitle,
        quantity: item.quantity,
        total: item.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
      })),
    );
  }

  /**
   * Get recent reviews across all seller products
   */
  async getRecentReviews(sellerId: string, limit = 10) {
    const reviews = await this.db.productReview.findMany({
      where: { product: { sellerId } },
      include: { product: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      productTitle: r.product.title,
      userName: r.userName,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Get revenue breakdown by period (amounts in cents)
   */
  async getRevenue(
    sellerId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    startDate?: Date,
    endDate?: Date,
  ): Promise<SellerRevenueData[]> {
    // Get seller's product IDs
    const sellerProductIds = (
      await this.db.product.findMany({
        where: { sellerId },
        select: { id: true },
      })
    ).map((p) => p.id);

    if (sellerProductIds.length === 0) return [];

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get orders containing seller's products within the date range
    const orders = await this.db.ecommerceOrder.findMany({
      where: {
        items: { some: { productId: { in: sellerProductIds } } },
        status: { not: 'CANCELLED' },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        items: {
          where: { productId: { in: sellerProductIds } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by period
    const buckets = new Map<string, { amount: number; orders: Set<string> }>();

    for (const order of orders) {
      const date = order.createdAt;
      let key: string;

      if (period === 'daily') {
        key = date.toISOString().slice(0, 10);
      } else if (period === 'weekly') {
        // ISO week start (Monday)
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        key = d.toISOString().slice(0, 10);
      } else {
        key = date.toISOString().slice(0, 7);
      }

      const bucket = buckets.get(key) || { amount: 0, orders: new Set<string>() };
      const sellerRevenue = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
      bucket.amount += sellerRevenue;
      bucket.orders.add(order.id);
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries()).map(([period, data]) => ({
      period,
      amount: data.amount,
      orders: data.orders.size,
    }));
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createSellerService(db: PrismaClient): SellerService {
  return new SellerService(db);
}

let sellerServiceInstance: SellerService | null = null;

export function getSellerService(db?: PrismaClient): SellerService {
  if (db) return createSellerService(db);
  if (!sellerServiceInstance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    sellerServiceInstance = new SellerService(globalDb);
  }
  return sellerServiceInstance;
}

export default SellerService;
