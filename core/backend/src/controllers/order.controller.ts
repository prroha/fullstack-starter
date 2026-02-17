import { FastifyRequest, FastifyReply } from "fastify";
import { AuditAction, OrderStatus, PaymentMethod } from "@prisma/client";
import { orderService } from "../services/order.service.js";
import { auditService } from "../services/audit.service.js";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  ErrorCodes,
} from "../utils/response.js";
import { z } from "zod";
import { AuthenticatedRequest } from "../types/index.js";
import { paginationSchema } from "../utils/validation-schemas.js";
import {
  ensureParam,
  getUserIdFromToken,
  sendCsvExport,
} from "../utils/controller-helpers.js";

// ============================================================================
// Validation Schemas
// ============================================================================

const getOrdersQuerySchema = paginationSchema.extend({
  status: z.enum(["PENDING", "COMPLETED", "REFUNDED", "FAILED"]).optional(),
  paymentMethod: z.enum(["STRIPE", "PAYPAL", "MANUAL"]).optional(),
  startDate: z.string().transform((v) => (v ? new Date(v) : undefined)).optional(),
  endDate: z.string().transform((v) => (v ? new Date(v) : undefined)).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "total", "email"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "REFUNDED", "FAILED"]),
});

const getUserOrdersQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

class OrderController {
  /**
   * Get all orders (admin)
   * GET /api/v1/admin/orders
   */
  async getAll(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const query = getOrdersQuerySchema.parse(req.query);
    const result = await orderService.getAll({
      page: query.page,
      limit: query.limit,
      status: query.status as OrderStatus | undefined,
      paymentMethod: query.paymentMethod as PaymentMethod | undefined,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return reply.send(
      paginatedResponse(result.orders, result.page, result.limit, result.total)
    );
  }

  /**
   * Get order by ID (admin)
   * GET /api/v1/admin/orders/:id
   */
  async getById(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const id = (req.params as Record<string, string>).id;

    if (!ensureParam(id, reply, "Order ID")) {
      return;
    }

    const order = await orderService.getById(id);
    return reply.send(successResponse({ order }));
  }

  /**
   * Get order statistics (admin)
   * GET /api/v1/admin/orders/stats
   */
  async getStats(
    _req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const stats = await orderService.getStats();
    return reply.send(successResponse(stats));
  }

  /**
   * Update order status (admin)
   * PATCH /api/v1/admin/orders/:id/status
   */
  async updateStatus(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;

    if (!ensureParam(id, reply, "Order ID")) {
      return;
    }

    const data = updateStatusSchema.parse(req.body);
    const previousOrder = await orderService.getById(id);
    const order = await orderService.updateStatus(id, data.status as OrderStatus);

    // Audit log: order status update
    await auditService.log({
      action: AuditAction.UPDATE,
      entity: "Order",
      entityId: id,
      userId: authReq.user?.userId,
      req,
      changes: {
        previousStatus: previousOrder.status,
        newStatus: data.status,
      },
      metadata: { adminAction: "updateOrderStatus" },
    });

    return reply.send(successResponse({ order }, "Order status updated successfully"));
  }

  /**
   * Get user's own orders
   * GET /api/v1/orders
   */
  async getUserOrders(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return reply.code(401).send(
        errorResponse(ErrorCodes.AUTH_REQUIRED, "Not authenticated")
      );
    }

    const query = getUserOrdersQuerySchema.parse(req.query);
    const result = await orderService.getUserOrders(userId, query.page, query.limit);

    return reply.send(
      paginatedResponse(result.orders, result.page, result.limit, result.total)
    );
  }

  /**
   * Get a specific order for the authenticated user
   * GET /api/v1/orders/:id
   */
  async getUserOrderById(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = getUserIdFromToken(req);
    const orderId = (req.params as Record<string, string>).id;

    if (!userId) {
      return reply.code(401).send(
        errorResponse(ErrorCodes.AUTH_REQUIRED, "Not authenticated")
      );
    }

    if (!ensureParam(orderId, reply, "Order ID")) {
      return;
    }

    const order = await orderService.getUserOrderById(userId, orderId);
    return reply.send(successResponse({ order }));
  }

  /**
   * Export all orders as CSV (admin only)
   * GET /api/v1/admin/orders/export
   */
  async exportOrders(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const orders = await orderService.getAllForExport();

    sendCsvExport(reply, orders, [
      { header: "ID", accessor: "id" },
      { header: "User ID", accessor: (item) => item.userId || "" },
      { header: "User Name", accessor: (item) => item.user?.name || "" },
      { header: "Email", accessor: "email" },
      { header: "Status", accessor: "status" },
      { header: "Payment Method", accessor: "paymentMethod" },
      { header: "Payment ID", accessor: (item) => item.paymentId || "" },
      { header: "Subtotal", accessor: "subtotal" },
      { header: "Discount", accessor: "discount" },
      { header: "Total", accessor: "total" },
      { header: "Coupon Code", accessor: (item) => item.couponCode || "" },
      { header: "Items", accessor: (item) => JSON.stringify(item.items) },
      { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
      { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
    ], { filenamePrefix: "orders-export" });
  }
}

export const orderController = new OrderController();
