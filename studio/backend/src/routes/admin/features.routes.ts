import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

const featureSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-_.]+$/),
  name: z.string().min(2).max(100),
  description: z.string().min(10),
  moduleId: z.string(),
  price: z.number().int().min(0).default(0),
  tier: z.string().nullable().optional(),
  requires: z.array(z.string()).default([]),
  conflicts: z.array(z.string()).default([]),
  fileMappings: z.any().optional(),
  schemaMappings: z.any().optional(),
  envVars: z.any().optional(),
  npmPackages: z.any().optional(),
  iconName: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isPopular: z.boolean().optional(),
});

/**
 * GET /api/admin/features
 * List all features
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { search, moduleId, tier, isActive } = req.query;

    const where: Record<string, unknown> = {};
    if (moduleId) where.moduleId = moduleId;
    if (tier) where.tier = tier;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { slug: { contains: search as string, mode: "insensitive" } },
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

    sendPaginated(res, features, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/features/:id
 * Get single feature
 */
router.get("/:id", async (req, res, next) => {
  try {
    const feature = await prisma.feature.findUnique({
      where: { id: req.params.id },
      include: {
        module: true,
      },
    });

    if (!feature) {
      throw ApiError.notFound("Feature");
    }

    sendSuccess(res, feature);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/features
 * Create new feature
 */
router.post("/", async (req, res, next) => {
  try {
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

    sendSuccess(res, feature, "Feature created", 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/features/:id
 * Partial update feature
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const data = featureSchema.partial().parse(req.body);

    const existing = await prisma.feature.findUnique({ where: { id: req.params.id } });
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
      where: { id: req.params.id },
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

    sendSuccess(res, feature, "Feature updated");
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/features/:id
 * Update feature
 */
router.put("/:id", async (req, res, next) => {
  try {
    const data = featureSchema.partial().parse(req.body);

    const existing = await prisma.feature.findUnique({ where: { id: req.params.id } });
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
      where: { id: req.params.id },
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

    sendSuccess(res, feature, "Feature updated");
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/features/:id/toggle
 * Toggle feature active status
 */
router.patch("/:id/toggle", async (req, res, next) => {
  try {
    const feature = await prisma.feature.findUnique({ where: { id: req.params.id } });
    if (!feature) {
      throw ApiError.notFound("Feature");
    }

    const updated = await prisma.feature.update({
      where: { id: req.params.id },
      data: { isActive: !feature.isActive },
    });

    sendSuccess(res, updated, `Feature ${updated.isActive ? "activated" : "deactivated"}`);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/features/:id
 * Delete feature
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const feature = await prisma.feature.findUnique({ where: { id: req.params.id } });
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

    await prisma.feature.delete({ where: { id: req.params.id } });

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

    sendSuccess(res, null, "Feature deleted");
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/features/bulk-update-price
 * Bulk update feature prices (direct updates)
 */
router.post("/bulk-update-price", async (req, res, next) => {
  try {
    const schema = z.object({
      updates: z.array(z.object({
        id: z.string(),
        price: z.number().int().min(0),
      })),
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

    sendSuccess(res, null, `${updates.length} features updated`);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/features/bulk-price-update
 * Bulk update feature prices with adjustment type (percentage or fixed)
 */
router.post("/bulk-price-update", async (req, res, next) => {
  try {
    const schema = z.object({
      featureIds: z.array(z.string()),
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

    sendSuccess(res, { updatedCount: updates.length, updates }, `${updates.length} features updated`);
  } catch (error) {
    next(error);
  }
});

export { router as featuresRoutes };
