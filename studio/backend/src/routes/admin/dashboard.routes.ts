import { Router } from "express";
import { prisma } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";

const router = Router();

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
router.get("/stats", async (_req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Run all queries in parallel
    const [
      totalRevenue,
      todayRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalOrders,
      todayOrders,
      pendingOrders,
      totalCustomers,
      newCustomersToday,
      activeTemplates,
      totalPreviews,
      todayPreviews,
      recentOrders,
      topTemplates,
    ] = await Promise.all([
      // Revenue stats
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETED" },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETED", paidAt: { gte: today } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETED", paidAt: { gte: thisMonth } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETED", paidAt: { gte: lastMonth, lt: thisMonth } },
      }),
      // Order stats
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      // Customer stats
      prisma.studioUser.count(),
      prisma.studioUser.count({ where: { createdAt: { gte: today } } }),
      // Template stats
      prisma.template.count({ where: { isActive: true } }),
      // Preview stats
      prisma.previewSession.count(),
      prisma.previewSession.count({ where: { createdAt: { gte: today } } }),
      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          customerName: true,
          tier: true,
          total: true,
          status: true,
          createdAt: true,
          template: { select: { name: true } },
        },
      }),
      // Top templates
      prisma.order.groupBy({
        by: ["templateId"],
        _count: { id: true },
        _sum: { total: true },
        where: { status: "COMPLETED", templateId: { not: null } },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    // Calculate month-over-month growth
    const currentMonthRev = monthRevenue._sum.total || 0;
    const lastMonthRev = lastMonthRevenue._sum.total || 0;
    const revenueGrowth = lastMonthRev > 0
      ? ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100
      : 0;

    sendSuccess(res, {
      revenue: {
        total: totalRevenue._sum.total || 0,
        today: todayRevenue._sum.total || 0,
        thisMonth: currentMonthRev,
        lastMonth: lastMonthRev,
        growth: Math.round(revenueGrowth * 100) / 100,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        pending: pendingOrders,
      },
      customers: {
        total: totalCustomers,
        newToday: newCustomersToday,
      },
      templates: {
        active: activeTemplates,
      },
      previews: {
        total: totalPreviews,
        today: todayPreviews,
      },
      recentOrders,
      topTemplates,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/dashboard/revenue-chart
 * Get revenue data for chart (last 30 days)
 */
router.get("/revenue-chart", async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        paidAt: { gte: startDate },
      },
      select: {
        total: true,
        paidAt: true,
      },
      orderBy: { paidAt: "asc" },
    });

    // Group by date
    const revenueByDate = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split("T")[0];
      revenueByDate.set(key, 0);
    }

    // Sum revenue per day
    for (const order of orders) {
      if (order.paidAt) {
        const key = order.paidAt.toISOString().split("T")[0];
        revenueByDate.set(key, (revenueByDate.get(key) || 0) + order.total);
      }
    }

    // Convert to array
    const chartData = Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    sendSuccess(res, chartData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/dashboard/conversion-funnel
 * Get conversion funnel data
 */
router.get("/conversion-funnel", async (_req, res, next) => {
  try {
    const [pageViews, configures, previews, purchases] = await Promise.all([
      prisma.studioAnalytics.count({ where: { event: "page_view" } }),
      prisma.studioAnalytics.count({ where: { event: "feature_toggle" } }),
      prisma.previewSession.count(),
      prisma.order.count({ where: { status: "COMPLETED" } }),
    ]);

    sendSuccess(res, {
      funnel: [
        { stage: "Page Views", count: pageViews },
        { stage: "Configurations", count: configures },
        { stage: "Previews", count: previews },
        { stage: "Purchases", count: purchases },
      ],
      conversionRate: pageViews > 0 ? ((purchases / pageViews) * 100).toFixed(2) : "0",
    });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardRoutes };
