import { db } from "../lib/db";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware";
import { ErrorCodes } from "../utils/response";

/**
 * Order item structure stored in the items JSON field
 */
export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

/**
 * Order list filters
 */
interface OrderListFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sortBy?: "createdAt" | "total" | "email";
  sortOrder?: "asc" | "desc";
}

/**
 * Order with user info
 */
interface OrderWithUser {
  id: string;
  userId: string | null;
  email: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentId: string | null;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  items: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

/**
 * Order statistics
 */
interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  refundedOrders: number;
  failedOrders: number;
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  averageOrderValue: number;
  recentOrders: number; // Last 7 days
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  revenueByPaymentMethod: Array<{ method: PaymentMethod; revenue: number; orders: number }>;
}

class OrderService {
  /**
   * Get paginated list of orders (admin)
   */
  async getAll(filters: OrderListFilters = {}): Promise<{
    orders: OrderWithUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      paymentMethod,
      startDate,
      endDate,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Search in email, paymentId, or couponCode
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { paymentId: { contains: search, mode: "insensitive" } },
        { couponCode: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get total count and orders in parallel
    const [total, orders] = await Promise.all([
      db.order.count({ where }),
      db.order.findMany({
        where,
        select: {
          id: true,
          userId: true,
          email: true,
          status: true,
          paymentMethod: true,
          paymentId: true,
          subtotal: true,
          discount: true,
          total: true,
          couponCode: true,
          items: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  /**
   * Get order by ID (admin)
   */
  async getById(id: string): Promise<OrderWithUser> {
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        email: true,
        status: true,
        paymentMethod: true,
        paymentId: true,
        subtotal: true,
        discount: true,
        total: true,
        couponCode: true,
        items: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found", ErrorCodes.NOT_FOUND);
    }

    return order;
  }

  /**
   * Get order statistics (admin)
   */
  async getStats(): Promise<OrderStats> {
    // Get aggregate counts and sums
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      refundedOrders,
      failedOrders,
      recentOrders,
      _aggregates,
      completedAggregates,
      revenueByDay,
      revenueByPaymentMethod,
    ] = await Promise.all([
      // Total orders count
      db.order.count(),

      // Orders by status
      db.order.count({ where: { status: OrderStatus.PENDING } }),
      db.order.count({ where: { status: OrderStatus.COMPLETED } }),
      db.order.count({ where: { status: OrderStatus.REFUNDED } }),
      db.order.count({ where: { status: OrderStatus.FAILED } }),

      // Recent orders (last 7 days)
      db.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total aggregates
      db.order.aggregate({
        _sum: {
          total: true,
          discount: true,
        },
      }),

      // Completed orders aggregates (for revenue calculation)
      db.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: {
          total: true,
          discount: true,
        },
        _avg: {
          total: true,
        },
      }),

      // Revenue by day (last 7 days)
      this.getRevenueByDay(7),

      // Revenue by payment method
      this.getRevenueByPaymentMethod(),
    ]);

    const totalRevenue = completedAggregates._sum.total || 0;
    const totalDiscount = completedAggregates._sum.discount || 0;
    const averageOrderValue = completedAggregates._avg.total || 0;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      refundedOrders,
      failedOrders,
      totalRevenue,
      totalDiscount,
      netRevenue: totalRevenue - totalDiscount,
      averageOrderValue,
      recentOrders,
      revenueByDay,
      revenueByPaymentMethod,
    };
  }

  /**
   * Get revenue grouped by day
   */
  private async getRevenueByDay(
    days: number
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Query completed orders in the date range
    const orders = await db.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group by date
    const dataByDate: Record<string, { revenue: number; orders: number }> = {};

    // Initialize all days with 0
    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dataByDate[dateStr] = { revenue: 0, orders: 0 };
    }

    // Aggregate revenue per day
    for (const order of orders) {
      const dateStr = order.createdAt.toISOString().split("T")[0];
      if (dataByDate[dateStr] !== undefined) {
        dataByDate[dateStr].revenue += order.total;
        dataByDate[dateStr].orders += 1;
      }
    }

    // Convert to array and sort by date
    return Object.entries(dataByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get revenue grouped by payment method
   */
  private async getRevenueByPaymentMethod(): Promise<
    Array<{ method: PaymentMethod; revenue: number; orders: number }>
  > {
    const results = await db.order.groupBy({
      by: ["paymentMethod"],
      where: { status: OrderStatus.COMPLETED },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    return results.map((r) => ({
      method: r.paymentMethod,
      revenue: r._sum.total || 0,
      orders: r._count.id,
    }));
  }

  /**
   * Update order status (admin)
   */
  async updateStatus(
    id: string,
    status: OrderStatus
  ): Promise<OrderWithUser> {
    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw ApiError.notFound("Order not found", ErrorCodes.NOT_FOUND);
    }

    // Validate status transition
    this.validateStatusTransition(existingOrder.status, status);

    // Update the order
    const order = await db.order.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        userId: true,
        email: true,
        status: true,
        paymentMethod: true,
        paymentId: true,
        subtotal: true,
        discount: true,
        total: true,
        couponCode: true,
        items: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return order;
  }

  /**
   * Validate order status transitions
   */
  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): void {
    // Define allowed transitions
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.COMPLETED,
        OrderStatus.FAILED,
        OrderStatus.REFUNDED,
      ],
      [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: [], // No transitions allowed from refunded
      [OrderStatus.FAILED]: [OrderStatus.PENDING], // Allow retry
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        `Cannot transition order from ${currentStatus} to ${newStatus}`,
        ErrorCodes.VALIDATION_ERROR
      );
    }
  }

  /**
   * Get user's own orders
   */
  async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    orders: OrderWithUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: Prisma.OrderWhereInput = { userId };

    const [total, orders] = await Promise.all([
      db.order.count({ where }),
      db.order.findMany({
        where,
        select: {
          id: true,
          userId: true,
          email: true,
          status: true,
          paymentMethod: true,
          paymentId: true,
          subtotal: true,
          discount: true,
          total: true,
          couponCode: true,
          items: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a specific order for a user (validates ownership)
   */
  async getUserOrderById(userId: string, orderId: string): Promise<OrderWithUser> {
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      select: {
        id: true,
        userId: true,
        email: true,
        status: true,
        paymentMethod: true,
        paymentId: true,
        subtotal: true,
        discount: true,
        total: true,
        couponCode: true,
        items: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound("Order not found", ErrorCodes.NOT_FOUND);
    }

    return order;
  }

  /**
   * Get all orders for CSV export (admin)
   */
  async getAllForExport(): Promise<OrderWithUser[]> {
    return db.order.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        status: true,
        paymentMethod: true,
        paymentId: true,
        subtotal: true,
        discount: true,
        total: true,
        couponCode: true,
        items: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const orderService = new OrderService();
