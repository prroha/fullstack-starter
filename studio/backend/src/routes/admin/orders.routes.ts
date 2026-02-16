import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";
import { stripeService } from "../../services/stripe.service.js";
import { emailService } from "../../services/email.service.js";

const router = Router();

/**
 * GET /api/admin/orders
 * List all orders with filtering and pagination
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { status, tier, search, from, to, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from as string) } : {}),
        ...(to ? { lte: new Date(to as string) } : {}),
      };
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: "insensitive" } },
        { customerEmail: { contains: search as string, mode: "insensitive" } },
        { customerName: { contains: search as string, mode: "insensitive" } },
      ];
    }


    const allowedSortColumns = ['createdAt', 'orderNumber', 'total', 'status', 'tier', 'customerEmail'];
    const safeSortBy = allowedSortColumns.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          template: { select: { name: true, slug: true } },
          coupon: { select: { code: true } },
          license: { select: { id: true, status: true, downloadCount: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    sendPaginated(res, orders, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders/stats
 * Get order statistics
 */
router.get("/stats", async (_req, res, next) => {
  try {
    const [total, completed, pending, refunded, revenue, avgOrder] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "REFUNDED" } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: "COMPLETED" } }),
      prisma.order.aggregate({ _avg: { total: true }, where: { status: "COMPLETED" } }),
    ]);

    sendSuccess(res, {
      total,
      completed,
      pending,
      refunded,
      revenue: revenue._sum.total || 0,
      averageOrderValue: Math.round(avgOrder._avg.total || 0),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Sanitize CSV cell to prevent formula injection
 */
function sanitizeCsvCell(value: string): string {
  // Prefix sanitization: prevent formula injection
  let sanitized = value;
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }
  // Always quote-wrap values that contain special characters
  if (sanitized.includes(",") || sanitized.includes("\n") || sanitized.includes('"') || sanitized.includes("'")) {
    sanitized = `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/**
 * GET /api/admin/orders/export/csv
 * Export orders to CSV
 * NOTE: Must be defined BEFORE /:id route to avoid being matched as an id
 */
router.get("/export/csv", async (req, res, next) => {
  try {
    const { status, tier, from, to } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from as string) } : {}),
        ...(to ? { lte: new Date(to as string) } : {}),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      take: 50000,
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { name: true } },
      },
    });

    const headers = ["Order Number", "Customer Email", "Customer Name", "Tier", "Template", "Total", "Status", "Created At"];
    const rows = orders.map(o => [
      sanitizeCsvCell(o.orderNumber),
      sanitizeCsvCell(o.customerEmail),
      sanitizeCsvCell(o.customerName || ""),
      o.tier,
      o.template?.name || "Custom",
      (o.total / 100).toFixed(2),
      o.status,
      o.createdAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=orders-${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/orders/:id
 * Get single order details
 */
router.get("/:id", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, name: true, createdAt: true } },
        template: true,
        coupon: true,
        license: true,
      },
    });

    if (!order) {
      throw ApiError.notFound("Order");
    }

    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status
 */
router.patch("/:id/status", async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]),
    });
    const { status } = schema.parse(req.body);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === "COMPLETED" ? { paidAt: new Date() } : {}),
      },
    });

    // Log the action
    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "UPDATE",
        entityType: "order",
        entityId: order.id,
        newValues: { status },
      },
    });

    sendSuccess(res, order, "Order status updated");
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/orders/:id/refund
 * Process refund
 */
router.post("/:id/refund", async (req, res, next) => {
  try {
    const schema = z.object({
      reason: z.string().max(500).optional(),
    });
    const { reason } = schema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { license: true },
    });

    if (!order) {
      throw ApiError.notFound("Order");
    }

    if (order.status !== "COMPLETED") {
      throw ApiError.badRequest("Can only refund completed orders");
    }

    // Process Stripe refund if payment was made via Stripe
    let refundResult: { refundId: string; status: string } | null = null;
    if (order.paymentId && stripeService.isConfigured()) {
      try {
        refundResult = await stripeService.processRefund(order.paymentId, reason);
      } catch (stripeError) {
        throw ApiError.badRequest(
          stripeError instanceof Error ? stripeError.message : "Failed to process refund"
        );
      }
    }

    // Update order and revoke license
    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: req.params.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          refundId: refundResult?.refundId || null,
        },
      }),
      ...(order.license ? [prisma.license.update({
        where: { id: order.license.id },
        data: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason || "Refund" },
      })] : []),
    ]);

    // Log the action
    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "REFUND",
        entityType: "order",
        entityId: order.id,
        newValues: { reason, refundId: refundResult?.refundId },
      },
    });

    // Send refund confirmation email
    try {
      await emailService.sendRefundConfirmation({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        refundAmount: order.total,
        reason,
      });
    } catch (emailError) {
      console.error("Failed to send refund confirmation email:", emailError);
      // Don't throw - refund is already processed
    }

    sendSuccess(res, updatedOrder, "Order refunded successfully");
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/orders/:id/regenerate-download
 * Regenerate download link for an order
 */
router.post("/:id/regenerate-download", async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { license: true },
    });

    if (!order) {
      throw ApiError.notFound("Order");
    }

    if (order.status !== "COMPLETED") {
      throw ApiError.badRequest("Order must be completed");
    }

    // Generate new download token
    const { v4: uuid } = await import("uuid");
    const newToken = uuid();

    let license;
    if (order.license) {
      license = await prisma.license.update({
        where: { id: order.license.id },
        data: {
          downloadToken: newToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } else {
      license = await prisma.license.create({
        data: {
          orderId: order.id,
          licenseKey: uuid(),
          downloadToken: newToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Log the action
    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "REGENERATE_DOWNLOAD",
        entityType: "order",
        entityId: order.id,
      },
    });

    // Send new download link email
    const downloadUrl = `${env.CORS_ORIGIN}/download/${license.downloadToken}`;
    try {
      await emailService.sendDownloadLink({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        licenseKey: license.licenseKey,
        downloadUrl,
        expiresAt: license.expiresAt || undefined,
      });
    } catch (emailError) {
      console.error("Failed to send download link email:", emailError);
    }

    sendSuccess(res, { downloadToken: license.downloadToken }, "Download link regenerated");
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/orders/:id/resend-email
 * Resend order confirmation or download link email
 */
router.post("/:id/resend-email", async (req, res, next) => {
  try {
    const schema = z.object({
      type: z.enum(["confirmation", "download"]).default("download"),
    });
    const { type } = schema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { license: true },
    });

    if (!order) {
      throw ApiError.notFound("Order");
    }

    if (order.status !== "COMPLETED") {
      throw ApiError.badRequest("Order must be completed to resend emails");
    }

    if (!order.license) {
      throw ApiError.badRequest("Order has no license - regenerate download first");
    }

    const downloadUrl = `${env.CORS_ORIGIN}/download/${order.license.downloadToken}`;

    if (type === "confirmation") {
      // Get tier name
      const tier = await prisma.pricingTier.findFirst({
        where: { slug: order.tier },
      });

      await emailService.sendOrderConfirmation({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        tier: order.tier,
        tierName: tier?.name || order.tier,
        selectedFeatures: order.selectedFeatures,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        licenseKey: order.license.licenseKey,
        downloadUrl,
      });
    } else {
      await emailService.sendDownloadLink({
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        licenseKey: order.license.licenseKey,
        downloadUrl,
        expiresAt: order.license.expiresAt || undefined,
      });
    }

    // Log the action
    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "RESEND_EMAIL",
        entityType: "order",
        entityId: order.id,
        newValues: { type },
      },
    });

    sendSuccess(res, { sent: true }, `${type === "confirmation" ? "Order confirmation" : "Download link"} email sent`);
  } catch (error) {
    next(error);
  }
});

export { router as ordersRoutes };
