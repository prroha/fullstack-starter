import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

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

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/admin/templates
   * List all templates
   */
  fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const { page, limit, skip } = parsePaginationParams(query as { page?: string; limit?: string });
    const { search, isActive, isFeatured } = query;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (isFeatured !== undefined) where.isFeatured = isFeatured === "true";
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
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

    return sendPaginated(reply, templatesWithStats, createPaginationInfo(page, limit, total));
  });

  /**
   * PUT /api/admin/templates/reorder
   * Reorder templates
   * NOTE: Must be defined BEFORE /:id routes to avoid "reorder" being matched as an id
   */
  fastify.put("/reorder", async (req: FastifyRequest, reply: FastifyReply) => {
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

    return sendSuccess(reply, null, "Templates reordered");
  });

  /**
   * GET /api/admin/templates/:id
   * Get single template
   */
  fastify.get("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const template = await prisma.template.findUnique({
      where: { id },
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

    return sendSuccess(reply, {
      ...template,
      stats: {
        totalOrders: stats._count.id,
        totalRevenue: stats._sum.total || 0,
      },
    });
  });

  /**
   * POST /api/admin/templates
   * Create new template
   */
  fastify.post("/", async (req: FastifyRequest, reply: FastifyReply) => {
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

    return sendSuccess(reply, template, "Template created", 201);
  });

  /**
   * PUT /api/admin/templates/:id
   * Update template
   */
  fastify.put("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const data = templateSchema.partial().parse(req.body);

    const existing = await prisma.template.findUnique({ where: { id } });
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
      where: { id },
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

    return sendSuccess(reply, template, "Template updated");
  });

  /**
   * PATCH /api/admin/templates/:id/toggle
   * Toggle template active status
   */
  fastify.patch("/:id/toggle", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw ApiError.notFound("Template");
    }

    const updated = await prisma.template.update({
      where: { id },
      data: { isActive: !template.isActive },
    });

    return sendSuccess(reply, updated, `Template ${updated.isActive ? "activated" : "deactivated"}`);
  });

  /**
   * DELETE /api/admin/templates/:id
   * Delete template
   */
  fastify.delete("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw ApiError.notFound("Template");
    }

    // Check if template has orders
    const orderCount = await prisma.order.count({ where: { templateId: id } });
    if (orderCount > 0) {
      throw ApiError.badRequest("Cannot delete template with existing orders. Deactivate it instead.");
    }

    await prisma.template.delete({ where: { id } });

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

    return sendSuccess(reply, null, "Template deleted");
  });
};

export { routePlugin as templatesRoutes };
