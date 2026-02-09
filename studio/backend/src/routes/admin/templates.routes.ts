import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

const templateSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(100),
  description: z.string().min(10),
  shortDescription: z.string().max(200).optional(),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).optional(),
  tier: z.string(),
  includedFeatures: z.array(z.string()),
  previewImageUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  iconName: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

/**
 * GET /api/admin/templates
 * List all templates
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { search, isActive, isFeatured } = req.query;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (isFeatured !== undefined) where.isFeatured = isFeatured === "true";
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { slug: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayOrder: "asc" },
      }),
      prisma.template.count({ where }),
    ]);

    // Get order counts for each template
    const orderCounts = await prisma.order.groupBy({
      by: ["templateId"],
      _count: { id: true },
      where: { templateId: { in: templates.map(t => t.id) } },
    });

    const templatesWithStats = templates.map(t => ({
      ...t,
      orderCount: orderCounts.find(o => o.templateId === t.id)?._count.id || 0,
    }));

    sendPaginated(res, templatesWithStats, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/templates/:id
 * Get single template
 */
router.get("/:id", async (req, res, next) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      throw ApiError.notFound("Template");
    }

    // Get order stats
    const stats = await prisma.order.aggregate({
      where: { templateId: template.id, status: "COMPLETED" },
      _count: { id: true },
      _sum: { total: true },
    });

    sendSuccess(res, {
      ...template,
      stats: {
        totalOrders: stats._count.id,
        totalRevenue: stats._sum.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/templates
 * Create new template
 */
router.post("/", async (req, res, next) => {
  try {
    const data = templateSchema.parse(req.body);

    // Check slug uniqueness
    const existing = await prisma.template.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw ApiError.conflict("Template with this slug already exists");
    }

    const template = await prisma.template.create({ data });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "CREATE",
        entityType: "template",
        entityId: template.id,
        newValues: data,
      },
    });

    sendSuccess(res, template, "Template created", 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/templates/:id
 * Update template
 */
router.put("/:id", async (req, res, next) => {
  try {
    const data = templateSchema.partial().parse(req.body);

    const existing = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw ApiError.notFound("Template");
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.template.findUnique({ where: { slug: data.slug } });
      if (slugExists) {
        throw ApiError.conflict("Template with this slug already exists");
      }
    }

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "UPDATE",
        entityType: "template",
        entityId: template.id,
        oldValues: existing,
        newValues: data,
      },
    });

    sendSuccess(res, template, "Template updated");
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/templates/:id/toggle
 * Toggle template active status
 */
router.patch("/:id/toggle", async (req, res, next) => {
  try {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) {
      throw ApiError.notFound("Template");
    }

    const updated = await prisma.template.update({
      where: { id: req.params.id },
      data: { isActive: !template.isActive },
    });

    sendSuccess(res, updated, `Template ${updated.isActive ? "activated" : "deactivated"}`);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/templates/:id
 * Delete template
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) {
      throw ApiError.notFound("Template");
    }

    // Check if template has orders
    const orderCount = await prisma.order.count({ where: { templateId: req.params.id } });
    if (orderCount > 0) {
      throw ApiError.badRequest("Cannot delete template with existing orders. Deactivate it instead.");
    }

    await prisma.template.delete({ where: { id: req.params.id } });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "DELETE",
        entityType: "template",
        entityId: template.id,
        oldValues: template,
      },
    });

    sendSuccess(res, null, "Template deleted");
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/templates/reorder
 * Reorder templates
 */
router.put("/reorder", async (req, res, next) => {
  try {
    const schema = z.object({
      orders: z.array(z.object({
        id: z.string(),
        displayOrder: z.number().int(),
      })),
    });
    const { orders } = schema.parse(req.body);

    await prisma.$transaction(
      orders.map(({ id, displayOrder }) =>
        prisma.template.update({ where: { id }, data: { displayOrder } })
      )
    );

    sendSuccess(res, null, "Templates reordered");
  } catch (error) {
    next(error);
  }
});

export { router as templatesRoutes };
