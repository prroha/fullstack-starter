import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const couponSchema = z.object({
  code: z.string().min(3).max(20).transform(s => s.toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().int().min(1),
  maxUses: z.number().int().min(1).nullable().optional(),
  minPurchase: z.number().int().min(0).nullable().optional(),
  applicableTiers: z.array(z.string()).default([]),
  applicableTemplates: z.array(z.string()).default([]),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
});

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/admin/coupons
   * List all coupons
   */
  fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const { page, limit, skip } = parsePaginationParams(query as { page?: string; limit?: string });
    const { search, type, isActive } = query;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    const [coupons, total] = await Promise.all([
      prisma.studioCoupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.studioCoupon.count({ where }),
    ]);

    return sendPaginated(reply, coupons, createPaginationInfo(page, limit, total));
  });

  /**
   * GET /api/admin/coupons/:id
   * Get single coupon with usage stats
   */
  fastify.get("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const coupon = await prisma.studioCoupon.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            customerEmail: true,
            total: true,
            discount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!coupon) {
      throw ApiError.notFound("Coupon");
    }

    // Calculate total discount given
    const totalDiscount = await prisma.order.aggregate({
      _sum: { discount: true },
      where: { couponId: coupon.id },
    });

    return sendSuccess(reply, {
      ...coupon,
      totalDiscountGiven: totalDiscount._sum.discount || 0,
    });
  });

  /**
   * POST /api/admin/coupons
   * Create new coupon
   */
  fastify.post("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const data = couponSchema.parse(req.body);

    // Validate percentage
    if (data.type === "PERCENTAGE" && data.value > 100) {
      throw ApiError.badRequest("Percentage discount cannot exceed 100");
    }

    // Check code uniqueness
    const existing = await prisma.studioCoupon.findUnique({ where: { code: data.code } });
    if (existing) {
      throw ApiError.conflict("Coupon code already exists");
    }

    const coupon = await prisma.studioCoupon.create({
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "CREATE",
        entityType: "coupon",
        entityId: coupon.id,
        newValues: data,
      },
    });

    return sendSuccess(reply, coupon, "Coupon created", 201);
  });

  /**
   * PUT /api/admin/coupons/:id
   * Update coupon
   */
  fastify.put("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const data = couponSchema.partial().parse(req.body);

    const existing = await prisma.studioCoupon.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Coupon");
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await prisma.studioCoupon.findUnique({ where: { code: data.code } });
      if (codeExists) {
        throw ApiError.conflict("Coupon code already exists");
      }
    }

    if (data.type === "PERCENTAGE" && data.value && data.value > 100) {
      throw ApiError.badRequest("Percentage discount cannot exceed 100");
    }

    const coupon = await prisma.studioCoupon.update({
      where: { id },
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "UPDATE",
        entityType: "coupon",
        entityId: coupon.id,
        oldValues: existing,
        newValues: data,
      },
    });

    return sendSuccess(reply, coupon, "Coupon updated");
  });

  /**
   * PATCH /api/admin/coupons/:id/toggle
   * Toggle coupon active status
   */
  fastify.patch("/:id/toggle", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const coupon = await prisma.studioCoupon.findUnique({ where: { id } });
    if (!coupon) {
      throw ApiError.notFound("Coupon");
    }

    const updated = await prisma.studioCoupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    return sendSuccess(reply, updated, `Coupon ${updated.isActive ? "activated" : "deactivated"}`);
  });

  /**
   * DELETE /api/admin/coupons/:id
   * Delete coupon
   */
  fastify.delete("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const coupon = await prisma.studioCoupon.findUnique({ where: { id } });
    if (!coupon) {
      throw ApiError.notFound("Coupon");
    }

    if (coupon.usedCount > 0) {
      throw ApiError.badRequest("Cannot delete coupon that has been used. Deactivate it instead.");
    }

    await prisma.studioCoupon.delete({ where: { id } });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "DELETE",
        entityType: "coupon",
        entityId: coupon.id,
        oldValues: coupon,
      },
    });

    return sendSuccess(reply, null, "Coupon deleted");
  });
};

export { routePlugin as couponsRoutes };
