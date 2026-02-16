import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

/**
 * Sanitize CSV cell to prevent formula injection
 * Prefixes cells starting with =, +, -, @, \t, \r with a single quote
 */
function sanitizeCsvCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  // Escape quotes and wrap in quotes if contains comma or newline
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * GET /api/admin/customers/export/csv
 * Export customers to CSV
 * NOTE: Must be defined BEFORE /:id route to avoid being matched as an id
 */
router.get("/export/csv", async (_req, res, next) => {
  try {
    const customers = await prisma.studioUser.findMany({
      take: 50000,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
      },
    });

    const headers = ["Email", "Name", "Orders", "Verified", "Blocked", "Joined"];
    const rows = customers.map(c => [
      sanitizeCsvCell(c.email),
      sanitizeCsvCell(c.name || ""),
      c._count.orders.toString(),
      c.emailVerified ? "Yes" : "No",
      c.isBlocked ? "Yes" : "No",
      c.createdAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=customers-${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/customers
 * List all customers
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { search, isBlocked } = req.query;

    const where: Record<string, unknown> = {};
    if (isBlocked !== undefined) where.isBlocked = isBlocked === "true";
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: "insensitive" } },
        { name: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.studioUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          emailVerified: true,
          isBlocked: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.studioUser.count({ where }),
    ]);

    // Get total spent for each customer
    const customerIds = customers.map(c => c.id);
    const spentByCustomer = await prisma.order.groupBy({
      by: ["userId"],
      _sum: { total: true },
      where: { userId: { in: customerIds }, status: "COMPLETED" },
    });

    const customersWithStats = customers.map(c => ({
      ...c,
      orderCount: c._count.orders,
      totalSpent: spentByCustomer.find(s => s.userId === c.id)?._sum.total || 0,
    }));

    sendPaginated(res, customersWithStats, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/customers/:id
 * Get single customer with orders
 */
router.get("/:id", async (req, res, next) => {
  try {
    const customer = await prisma.studioUser.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            template: { select: { name: true } },
            license: { select: { status: true, downloadCount: true } },
          },
        },
      },
    });

    if (!customer) {
      throw ApiError.notFound("Customer");
    }

    // Calculate total spent
    const totalSpent = customer.orders
      .filter(o => o.status === "COMPLETED")
      .reduce((sum, o) => sum + o.total, 0);

    sendSuccess(res, {
      ...customer,
      totalSpent,
      orderCount: customer.orders.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/customers/:id/block
 * Block/unblock customer
 */
router.patch("/:id/block", async (req, res, next) => {
  try {
    const schema = z.object({
      isBlocked: z.boolean(),
      reason: z.string().optional(),
    });
    const { isBlocked, reason } = schema.parse(req.body);

    const customer = await prisma.studioUser.findUnique({ where: { id: req.params.id } });
    if (!customer) {
      throw ApiError.notFound("Customer");
    }

    const updated = await prisma.studioUser.update({
      where: { id: req.params.id },
      data: { isBlocked },
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: isBlocked ? "BLOCK_CUSTOMER" : "UNBLOCK_CUSTOMER",
        entityType: "customer",
        entityId: customer.id,
        metadata: { reason },
      },
    });

    sendSuccess(res, updated, `Customer ${isBlocked ? "blocked" : "unblocked"}`);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/customers/:id/orders
 * Get customer orders
 */
router.get("/:id/orders", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.params.id },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          template: { select: { name: true } },
          license: { select: { status: true, downloadCount: true } },
        },
      }),
      prisma.order.count({ where: { userId: req.params.id } }),
    ]);

    sendPaginated(res, orders, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

export { router as customersRoutes };
