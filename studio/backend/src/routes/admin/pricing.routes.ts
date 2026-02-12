import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess, sendPaginated, parsePaginationParams, createPaginationInfo } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

// =====================================================
// Validation Schemas
// =====================================================

const tierUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().min(10).max(500).optional(),
  price: z.number().int().min(0).optional(),
  includedFeatures: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  color: z.string().max(20).nullable().optional(),
  isActive: z.boolean().optional(),
});

const bundleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().int().min(1),
  minItems: z.number().int().min(2).default(2),
  applicableTiers: z.array(z.string()).default([]),
  applicableFeatures: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// =====================================================
// Pricing Tier Routes
// =====================================================

/**
 * GET /api/admin/pricing/tiers
 * Get all pricing tier configurations
 */
router.get("/tiers", async (_req, res, next) => {
  try {
    const tiers = await prisma.pricingTier.findMany({
      orderBy: { displayOrder: "asc" },
    });

    // Get order counts per tier
    const orderCounts = await prisma.order.groupBy({
      by: ["tier"],
      _count: { id: true },
      _sum: { total: true },
      where: { status: "COMPLETED" },
    });

    const tiersWithStats = tiers.map((tier) => {
      const stats = orderCounts.find((o) => o.tier === tier.slug);
      return {
        ...tier,
        stats: {
          totalOrders: stats?._count.id || 0,
          totalRevenue: stats?._sum.total || 0,
        },
      };
    });

    sendSuccess(res, tiersWithStats);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/pricing/tiers/reorder
 * Reorder pricing tiers
 * NOTE: Must be defined BEFORE /tiers/:tier routes to avoid "reorder" being matched as a tier
 */
router.put("/tiers/reorder", async (req, res, next) => {
  try {
    const schema = z.object({
      orders: z.array(
        z.object({
          slug: z.string(),
          displayOrder: z.number().int(),
        })
      ),
    });
    const { orders } = schema.parse(req.body);

    await prisma.$transaction(
      orders.map(({ slug, displayOrder }) =>
        prisma.pricingTier.update({ where: { slug }, data: { displayOrder } })
      )
    );

    sendSuccess(res, null, "Tiers reordered");
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/pricing/tiers/:tier
 * Get single pricing tier
 */
router.get("/tiers/:tier", async (req, res, next) => {
  try {
    const tier = await prisma.pricingTier.findUnique({
      where: { slug: req.params.tier },
    });

    if (!tier) {
      throw ApiError.notFound("Pricing tier");
    }

    // Get detailed stats
    const stats = await prisma.order.aggregate({
      where: { tier: tier.slug, status: "COMPLETED" },
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { tier: tier.slug },
      select: {
        id: true,
        orderNumber: true,
        customerEmail: true,
        total: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    sendSuccess(res, {
      ...tier,
      stats: {
        totalOrders: stats._count.id,
        totalRevenue: stats._sum.total || 0,
        avgOrderValue: stats._avg.total || 0,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/pricing/tiers/:tier
 * Update pricing tier configuration
 */
router.put("/tiers/:tier", async (req, res, next) => {
  try {
    const data = tierUpdateSchema.parse(req.body);

    const existing = await prisma.pricingTier.findUnique({
      where: { slug: req.params.tier },
    });

    if (!existing) {
      throw ApiError.notFound("Pricing tier");
    }

    const tier = await prisma.pricingTier.update({
      where: { slug: req.params.tier },
      data,
    });

    // Track price changes
    if (data.price !== undefined && data.price !== existing.price) {
      const changePercent = existing.price > 0
        ? ((data.price - existing.price) / existing.price) * 100
        : 100;
      await prisma.priceHistory.create({
        data: {
          entityType: "tier",
          entityId: tier.id,
          entitySlug: tier.slug,
          entityName: tier.name,
          oldPrice: existing.price,
          newPrice: data.price,
          changePercent,
          changedBy: req.user?.email,
        },
      });
    }

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "UPDATE",
        entityType: "pricing_tier",
        entityId: tier.id,
        oldValues: existing,
        newValues: data,
      },
    });

    sendSuccess(res, tier, "Pricing tier updated");
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/pricing/tiers/:tier/toggle
 * Toggle tier active status
 */
router.patch("/tiers/:tier/toggle", async (req, res, next) => {
  try {
    const tier = await prisma.pricingTier.findUnique({
      where: { slug: req.params.tier },
    });

    if (!tier) {
      throw ApiError.notFound("Pricing tier");
    }

    const updated = await prisma.pricingTier.update({
      where: { slug: req.params.tier },
      data: { isActive: !tier.isActive },
    });

    sendSuccess(res, updated, `Tier ${updated.isActive ? "activated" : "deactivated"}`);
  } catch (error) {
    next(error);
  }
});

// =====================================================
// Bundle Discount Routes
// =====================================================

/**
 * GET /api/admin/pricing/bundles
 * List all bundle discounts
 */
router.get("/bundles", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(
      req.query as { page?: string; limit?: string }
    );
    const { search, isActive } = req.query;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.name = { contains: search as string, mode: "insensitive" };
    }

    const [bundles, total] = await Promise.all([
      prisma.bundleDiscount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.bundleDiscount.count({ where }),
    ]);

    sendPaginated(res, bundles, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/pricing/bundles/:id
 * Get single bundle discount
 */
router.get("/bundles/:id", async (req, res, next) => {
  try {
    const bundle = await prisma.bundleDiscount.findUnique({
      where: { id: req.params.id },
    });

    if (!bundle) {
      throw ApiError.notFound("Bundle discount");
    }

    sendSuccess(res, bundle);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/pricing/bundles
 * Create new bundle discount
 */
router.post("/bundles", async (req, res, next) => {
  try {
    const data = bundleSchema.parse(req.body);

    // Validate percentage
    if (data.type === "PERCENTAGE" && data.value > 100) {
      throw ApiError.badRequest("Percentage discount cannot exceed 100");
    }

    const bundle = await prisma.bundleDiscount.create({
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
        entityType: "bundle_discount",
        entityId: bundle.id,
        newValues: data,
      },
    });

    sendSuccess(res, bundle, "Bundle discount created", 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/pricing/bundles/:id
 * Update bundle discount
 */
router.put("/bundles/:id", async (req, res, next) => {
  try {
    const data = bundleSchema.partial().parse(req.body);

    const existing = await prisma.bundleDiscount.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      throw ApiError.notFound("Bundle discount");
    }

    // Validate percentage
    if (data.type === "PERCENTAGE" && data.value && data.value > 100) {
      throw ApiError.badRequest("Percentage discount cannot exceed 100");
    }

    const bundle = await prisma.bundleDiscount.update({
      where: { id: req.params.id },
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
        entityType: "bundle_discount",
        entityId: bundle.id,
        oldValues: existing,
        newValues: data,
      },
    });

    sendSuccess(res, bundle, "Bundle discount updated");
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin/pricing/bundles/:id/toggle
 * Toggle bundle active status
 */
router.patch("/bundles/:id/toggle", async (req, res, next) => {
  try {
    const bundle = await prisma.bundleDiscount.findUnique({
      where: { id: req.params.id },
    });

    if (!bundle) {
      throw ApiError.notFound("Bundle discount");
    }

    const updated = await prisma.bundleDiscount.update({
      where: { id: req.params.id },
      data: { isActive: !bundle.isActive },
    });

    sendSuccess(res, updated, `Bundle ${updated.isActive ? "activated" : "deactivated"}`);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/pricing/bundles/:id
 * Delete bundle discount
 */
router.delete("/bundles/:id", async (req, res, next) => {
  try {
    const bundle = await prisma.bundleDiscount.findUnique({
      where: { id: req.params.id },
    });

    if (!bundle) {
      throw ApiError.notFound("Bundle discount");
    }

    await prisma.bundleDiscount.delete({ where: { id: req.params.id } });

    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "DELETE",
        entityType: "bundle_discount",
        entityId: bundle.id,
        oldValues: bundle,
      },
    });

    sendSuccess(res, null, "Bundle discount deleted");
  } catch (error) {
    next(error);
  }
});

// =====================================================
// Price History Routes
// =====================================================

/**
 * GET /api/admin/pricing/history
 * Get price change history
 */
router.get("/history", async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(
      req.query as { page?: string; limit?: string }
    );
    const { entityType, entitySlug } = req.query;

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType as string;
    if (entitySlug) where.entitySlug = entitySlug as string;

    const [history, total] = await Promise.all([
      prisma.priceHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.priceHistory.count({ where }),
    ]);

    sendPaginated(res, history, createPaginationInfo(page, limit, total));
  } catch (error) {
    next(error);
  }
});

// =====================================================
// Upgrade Recommendation Rules
// =====================================================

/**
 * GET /api/admin/pricing/recommendations
 * Get upgrade recommendation analysis
 * Analyzes order data to suggest when customers should be recommended to upgrade tiers
 */
router.get("/recommendations", async (_req, res, next) => {
  try {
    // Get all completed orders with their features and tiers
    const orders = await prisma.order.findMany({
      where: { status: "COMPLETED" },
      select: {
        tier: true,
        selectedFeatures: true,
        total: true,
        discount: true,
      },
    });

    // Get tiers and features for analysis
    const [tiers, features] = await Promise.all([
      prisma.pricingTier.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" },
      }),
      prisma.feature.findMany({
        where: { isActive: true },
        select: { slug: true, name: true, price: true, tier: true },
      }),
    ]);

    // Analyze: For each tier, find customers who would save money by upgrading
    const recommendations = tiers.slice(0, -1).map((currentTier, idx) => {
      const nextTier = tiers[idx + 1];
      if (!nextTier) return null;

      // Orders on this tier
      const tierOrders = orders.filter((o) => o.tier === currentTier.slug);
      if (tierOrders.length === 0) return null;

      // Calculate how many had enough add-ons that upgrading would save money
      const nextTierFeatures = new Set(nextTier.includedFeatures);
      let wouldSaveCount = 0;
      let totalPotentialSavings = 0;

      tierOrders.forEach((order) => {
        // Calculate how much they paid in add-on features that are included in next tier
        const addOnSavings = order.selectedFeatures
          .filter((slug: string) => nextTierFeatures.has(slug))
          .reduce((sum: number, slug: string) => {
            const feature = features.find((f) => f.slug === slug);
            return sum + (feature?.price || 0);
          }, 0);

        const upgradeCost = nextTier.price - currentTier.price;
        if (addOnSavings > upgradeCost) {
          wouldSaveCount++;
          totalPotentialSavings += addOnSavings - upgradeCost;
        }
      });

      return {
        fromTier: currentTier.slug,
        fromTierName: currentTier.name,
        toTier: nextTier.slug,
        toTierName: nextTier.name,
        totalOrders: tierOrders.length,
        wouldSaveCount,
        percentWouldSave: tierOrders.length > 0
          ? Math.round((wouldSaveCount / tierOrders.length) * 100)
          : 0,
        avgPotentialSavings: wouldSaveCount > 0
          ? Math.round(totalPotentialSavings / wouldSaveCount)
          : 0,
        upgradeCost: nextTier.price - currentTier.price,
      };
    }).filter(Boolean);

    // Most common add-on features per tier (helps set recommendation thresholds)
    const addOnPatterns = tiers.map((tier) => {
      const tierOrders = orders.filter((o) => o.tier === tier.slug);
      const featureCounts = new Map<string, number>();

      tierOrders.forEach((order) => {
        order.selectedFeatures.forEach((slug: string) => {
          if (!tier.includedFeatures.includes(slug)) {
            featureCounts.set(slug, (featureCounts.get(slug) || 0) + 1);
          }
        });
      });

      const topAddOns = Array.from(featureCounts.entries())
        .map(([slug, count]) => {
          const feature = features.find((f) => f.slug === slug);
          return {
            slug,
            name: feature?.name || slug,
            price: feature?.price || 0,
            count,
            percentage: tierOrders.length > 0
              ? Math.round((count / tierOrders.length) * 100)
              : 0,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        tier: tier.slug,
        tierName: tier.name,
        orderCount: tierOrders.length,
        avgAddOns: tierOrders.length > 0
          ? (tierOrders.reduce((sum, o) => sum + o.selectedFeatures.filter(
              (s: string) => !tier.includedFeatures.includes(s)
            ).length, 0) / tierOrders.length).toFixed(1)
          : "0",
        topAddOns,
      };
    });

    sendSuccess(res, { recommendations, addOnPatterns });
  } catch (error) {
    next(error);
  }
});

export { router as pricingRoutes };
