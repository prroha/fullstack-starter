import { Router } from "express";
import { prisma } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";

const router = Router();

/**
 * GET /api/admin/analytics/revenue
 * Revenue analytics
 */
router.get("/revenue", async (req, res, next) => {
  try {
    const { period = "30d" } = req.query;
    const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "1y" ? 365 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Revenue by tier
    const revenueByTier = await prisma.order.groupBy({
      by: ["tier"],
      _sum: { total: true },
      _count: { id: true },
      where: { status: "COMPLETED", paidAt: { gte: startDate } },
    });

    // Revenue by template
    const revenueByTemplate = await prisma.order.groupBy({
      by: ["templateId"],
      _sum: { total: true },
      _count: { id: true },
      where: { status: "COMPLETED", paidAt: { gte: startDate }, templateId: { not: null } },
    });

    // Get template names
    const templateIds = revenueByTemplate.map(r => r.templateId).filter(Boolean) as string[];
    const templates = await prisma.template.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true },
    });

    const revenueByTemplateWithNames = revenueByTemplate.map(r => ({
      templateId: r.templateId,
      templateName: templates.find(t => t.id === r.templateId)?.name || "Unknown",
      revenue: r._sum.total || 0,
      orderCount: r._count.id,
    }));

    // Daily revenue trend
    const dailyRevenue = await prisma.$queryRaw`
      SELECT DATE(paid_at) as date, SUM(total) as revenue, COUNT(*) as orders
      FROM orders
      WHERE status = 'COMPLETED' AND paid_at >= ${startDate}
      GROUP BY DATE(paid_at)
      ORDER BY date ASC
    ` as { date: Date; revenue: bigint; orders: bigint }[];

    sendSuccess(res, {
      byTier: revenueByTier.map(r => ({
        tier: r.tier,
        revenue: r._sum.total || 0,
        orderCount: r._count.id,
      })),
      byTemplate: revenueByTemplateWithNames,
      daily: dailyRevenue.map(d => ({
        date: d.date,
        revenue: Number(d.revenue),
        orders: Number(d.orders),
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/analytics/features
 * Feature popularity analytics
 */
router.get("/features", async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "COMPLETED" },
      select: { selectedFeatures: true },
    });

    // Count feature occurrences
    const featureCounts = new Map<string, number>();
    for (const order of orders) {
      for (const feature of order.selectedFeatures) {
        featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
      }
    }

    // Get feature details
    const featureSlugs = Array.from(featureCounts.keys());
    const features = await prisma.feature.findMany({
      where: { slug: { in: featureSlugs } },
      select: { slug: true, name: true, price: true },
    });

    const popularFeatures = Array.from(featureCounts.entries())
      .map(([slug, count]) => {
        const feature = features.find(f => f.slug === slug);
        return {
          slug,
          name: feature?.name || slug,
          price: feature?.price || 0,
          purchaseCount: count,
          percentage: Math.round((count / orders.length) * 100),
        };
      })
      .sort((a, b) => b.purchaseCount - a.purchaseCount);

    sendSuccess(res, popularFeatures);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/analytics/funnel
 * Conversion funnel analytics
 */
router.get("/funnel", async (req, res, next) => {
  try {
    const { period = "30d" } = req.query;
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [pageViews, configEvents, previews, checkoutStarts, purchases] = await Promise.all([
      prisma.studioAnalytics.count({
        where: { event: "page_view", createdAt: { gte: startDate } },
      }),
      prisma.studioAnalytics.count({
        where: { event: "feature_toggle", createdAt: { gte: startDate } },
      }),
      prisma.previewSession.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.studioAnalytics.count({
        where: { event: "checkout_start", createdAt: { gte: startDate } },
      }),
      prisma.order.count({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
      }),
    ]);

    const funnel = [
      { stage: "Page Views", count: pageViews, percentage: 100 },
      { stage: "Configured", count: configEvents, percentage: pageViews > 0 ? Math.round((configEvents / pageViews) * 100) : 0 },
      { stage: "Previewed", count: previews, percentage: pageViews > 0 ? Math.round((previews / pageViews) * 100) : 0 },
      { stage: "Checkout Started", count: checkoutStarts, percentage: pageViews > 0 ? Math.round((checkoutStarts / pageViews) * 100) : 0 },
      { stage: "Purchased", count: purchases, percentage: pageViews > 0 ? Math.round((purchases / pageViews) * 100) : 0 },
    ];

    sendSuccess(res, {
      funnel,
      conversionRate: pageViews > 0 ? ((purchases / pageViews) * 100).toFixed(2) : "0",
      previewToCheckout: previews > 0 ? ((checkoutStarts / previews) * 100).toFixed(2) : "0",
      checkoutToPurchase: checkoutStarts > 0 ? ((purchases / checkoutStarts) * 100).toFixed(2) : "0",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/analytics/templates
 * Template performance analytics
 */
router.get("/templates", async (_req, res, next) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, price: true },
    });

    const templateStats = await Promise.all(
      templates.map(async (template) => {
        const [orderStats, previewCount] = await Promise.all([
          prisma.order.aggregate({
            where: { templateId: template.id, status: "COMPLETED" },
            _sum: { total: true },
            _count: { id: true },
          }),
          prisma.previewSession.count({
            where: { templateId: template.id },
          }),
        ]);

        return {
          ...template,
          revenue: orderStats._sum.total || 0,
          orderCount: orderStats._count.id,
          previewCount,
          conversionRate: previewCount > 0
            ? ((orderStats._count.id / previewCount) * 100).toFixed(2)
            : "0",
        };
      })
    );

    sendSuccess(res, templateStats.sort((a, b) => b.revenue - a.revenue));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/analytics/geo
 * Geographic distribution
 */
router.get("/geo", async (_req, res, next) => {
  try {
    // This would require IP geolocation - for now return placeholder
    // In production, you'd use a service like MaxMind or ipinfo.io

    const ordersByCountry = await prisma.studioAnalytics.groupBy({
      by: ["data"],
      _count: { id: true },
      where: {
        event: "purchase",
        data: { path: ["country"], not: { equals: {} } },
      },
    });

    sendSuccess(res, {
      note: "Geographic analytics requires IP geolocation service integration",
      data: ordersByCountry,
    });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };
