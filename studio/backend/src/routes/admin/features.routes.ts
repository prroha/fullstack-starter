import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const featureSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-_.]+$/),
  name: z.string().min(2).max(100),
  description: z.string().min(10),
  moduleId: z.string(),
  price: z.number().int().min(0).default(0),
  tier: z.string().nullable().optional(),
  requires: z.array(z.string()).default([]),
  conflicts: z.array(z.string()).default([]),
  fileMappings: z.array(z.object({ source: z.string().max(500), destination: z.string().max(500), transform: z.string().max(100).optional() })).optional(),
  schemaMappings: z.array(z.object({ model: z.string().max(100), source: z.string().max(500) })).optional(),
  envVars: z.array(z.object({ key: z.string().max(100), description: z.string().max(500), required: z.boolean().optional(), default: z.string().max(500).optional() })).optional(),
  npmPackages: z.array(z.object({ name: z.string().max(200), version: z.string().max(50), dev: z.boolean().optional() })).optional(),
  iconName: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isPopular: z.boolean().optional(),
});

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/admin/features
   * List all features
   */
  fastify.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const { page, limit, skip } = parsePaginationParams(query as { page?: string; limit?: string });
    const { search, moduleId, tier, isActive } = query;

    const where: Record<string, unknown> = {};
    if (moduleId) where.moduleId = moduleId;
    if (tier) where.tier = tier;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [features, total] = await Promise.all([
      prisma.feature.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ module: { displayOrder: "asc" } }, { displayOrder: "asc" }],
        include: {
          module: { select: { id: true, name: true, slug: true, category: true } },
        },
      }),
      prisma.feature.count({ where }),
    ]);

    return sendPaginated(reply, features, createPaginationInfo(page, limit, total));
  });

  /**
   * GET /api/admin/features/:id
   * Get single feature
   */
  fastify.get("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        module: true,
      },
    });

    if (!feature) {
      throw ApiError.notFound("Feature");
    }

    return sendSuccess(reply, feature);
  });

  /**
   * POST /api/admin/features
   * Create new feature
   */
  fastify.post("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const data = featureSchema.parse(req.body);

    // Verify module exists
    const module = await prisma.module.findUnique({ where: { id: data.moduleId } });
    if (!module) {
      throw ApiError.badRequest("Invalid module ID");
    }

    // Check slug uniqueness
    const existing = await prisma.feature.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw ApiError.conflict("Feature with this slug already exists");
    }

    const feature = await prisma.feature.create({ data });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "CREATE",
        entityType: "feature",
        entityId: feature.id,
        newValues: data,
      },
    });

    return sendSuccess(reply, feature, "Feature created", 201);
  });

  /**
   * PATCH /api/admin/features/:id
   * Partial update feature
   */
  fastify.patch("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const data = featureSchema.partial().parse(req.body);

    const existing = await prisma.feature.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Feature");
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.feature.findUnique({ where: { slug: data.slug } });
      if (slugExists) {
        throw ApiError.conflict("Feature with this slug already exists");
      }
    }

    if (data.moduleId) {
      const module = await prisma.module.findUnique({ where: { id: data.moduleId } });
      if (!module) {
        throw ApiError.badRequest("Invalid module ID");
      }
    }

    const feature = await prisma.feature.update({
      where: { id },
      data,
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "UPDATE",
        entityType: "feature",
        entityId: feature.id,
        oldValues: existing,
        newValues: data,
      },
    });

    return sendSuccess(reply, feature, "Feature updated");
  });

  /**
   * PUT /api/admin/features/:id
   * Update feature
   */
  fastify.put("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const data = featureSchema.partial().parse(req.body);

    const existing = await prisma.feature.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound("Feature");
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.feature.findUnique({ where: { slug: data.slug } });
      if (slugExists) {
        throw ApiError.conflict("Feature with this slug already exists");
      }
    }

    if (data.moduleId) {
      const module = await prisma.module.findUnique({ where: { id: data.moduleId } });
      if (!module) {
        throw ApiError.badRequest("Invalid module ID");
      }
    }

    const feature = await prisma.feature.update({
      where: { id },
      data,
    });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "UPDATE",
        entityType: "feature",
        entityId: feature.id,
        oldValues: existing,
        newValues: data,
      },
    });

    return sendSuccess(reply, feature, "Feature updated");
  });

  /**
   * PATCH /api/admin/features/:id/toggle
   * Toggle feature active status
   */
  fastify.patch("/:id/toggle", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const feature = await prisma.feature.findUnique({ where: { id } });
    if (!feature) {
      throw ApiError.notFound("Feature");
    }

    const updated = await prisma.feature.update({
      where: { id },
      data: { isActive: !feature.isActive },
    });

    return sendSuccess(reply, updated, `Feature ${updated.isActive ? "activated" : "deactivated"}`);
  });

  /**
   * DELETE /api/admin/features/:id
   * Delete feature
   */
  fastify.delete("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as Record<string, string>;
    const feature = await prisma.feature.findUnique({ where: { id } });
    if (!feature) {
      throw ApiError.notFound("Feature");
    }

    // Check if feature is used in any template
    const templatesUsingFeature = await prisma.template.count({
      where: { includedFeatures: { has: feature.slug } },
    });

    if (templatesUsingFeature > 0) {
      throw ApiError.badRequest("Cannot delete feature used in templates. Remove from templates first.");
    }

    await prisma.feature.delete({ where: { id } });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "DELETE",
        entityType: "feature",
        entityId: feature.id,
        oldValues: feature,
      },
    });

    return sendSuccess(reply, null, "Feature deleted");
  });

  /**
   * POST /api/admin/features/bulk-update-price
   * Bulk update feature prices (direct updates)
   */
  fastify.post("/bulk-update-price", async (req: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      updates: z.array(z.object({
        id: z.string(),
        price: z.number().int().min(0),
      })).max(100),
    });
    const { updates } = schema.parse(req.body);

    await prisma.$transaction(
      updates.map(({ id, price }) =>
        prisma.feature.update({ where: { id }, data: { price } })
      )
    );

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "BULK_UPDATE_PRICE",
        entityType: "feature",
        newValues: { updates },
      },
    });

    return sendSuccess(reply, null, `${updates.length} features updated`);
  });

  /**
   * POST /api/admin/features/bulk-price-update
   * Bulk update feature prices with adjustment type (percentage or fixed)
   */
  fastify.post("/bulk-price-update", async (req: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      featureIds: z.array(z.string()).max(100),
      adjustmentType: z.enum(["percentage", "fixed"]),
      value: z.number(),
    });
    const { featureIds, adjustmentType, value } = schema.parse(req.body);

    // Get current prices
    const features = await prisma.feature.findMany({
      where: { id: { in: featureIds } },
      select: { id: true, price: true },
    });

    // Calculate new prices
    const updates = features.map((feature) => {
      let newPrice: number;
      if (adjustmentType === "percentage") {
        // Increase/decrease by percentage
        newPrice = Math.round(feature.price * (1 + value / 100));
      } else {
        // Add/subtract fixed amount (value is in cents)
        newPrice = feature.price + value;
      }
      // Ensure price is not negative
      newPrice = Math.max(0, newPrice);
      return { id: feature.id, price: newPrice };
    });

    await prisma.$transaction(
      updates.map(({ id, price }) =>
        prisma.feature.update({ where: { id }, data: { price } })
      )
    );

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "BULK_PRICE_UPDATE",
        entityType: "feature",
        newValues: { featureIds, adjustmentType, value, updates },
      },
    });

    return sendSuccess(reply, { updatedCount: updates.length, updates }, `${updates.length} features updated`);
  });
};

export { routePlugin as featuresRoutes };
