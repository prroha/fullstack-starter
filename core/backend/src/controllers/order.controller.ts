import { Response, NextFunction } from "express";
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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
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

      res.json(
        paginatedResponse(result.orders, result.page, result.limit, result.total)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order by ID (admin)
   * GET /api/v1/admin/orders/:id
   */
  async getById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!ensureParam(id, res, "Order ID")) {
        return;
      }

      const order = await orderService.getById(id);
      res.json(successResponse({ order }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order statistics (admin)
   * GET /api/v1/admin/orders/stats
   */
  async getStats(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await orderService.getStats();
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order status (admin)
   * PATCH /api/v1/admin/orders/:id/status
   */
  async updateStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!ensureParam(id, res, "Order ID")) {
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
        userId: req.user?.userId,
        req,
        changes: {
          previousStatus: previousOrder.status,
          newStatus: data.status,
        },
        metadata: { adminAction: "updateOrderStatus" },
      });

      res.json(successResponse({ order }, "Order status updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's own orders
   * GET /api/v1/orders
   */
  async getUserOrders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = getUserIdFromToken(req);

      if (!userId) {
        res.status(401).json(
          errorResponse(ErrorCodes.AUTH_REQUIRED, "Not authenticated")
        );
        return;
      }

      const query = getUserOrdersQuerySchema.parse(req.query);
      const result = await orderService.getUserOrders(userId, query.page, query.limit);

      res.json(
        paginatedResponse(result.orders, result.page, result.limit, result.total)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific order for the authenticated user
   * GET /api/v1/orders/:id
   */
  async getUserOrderById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = getUserIdFromToken(req);
      const orderId = req.params.id as string;

      if (!userId) {
        res.status(401).json(
          errorResponse(ErrorCodes.AUTH_REQUIRED, "Not authenticated")
        );
        return;
      }

      if (!ensureParam(orderId, res, "Order ID")) {
        return;
      }

      const order = await orderService.getUserOrderById(userId, orderId);
      res.json(successResponse({ order }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export all orders as CSV (admin only)
   * GET /api/v1/admin/orders/export
   */
  async exportOrders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const orders = await orderService.getAllForExport();

      sendCsvExport(res, orders, [
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
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
