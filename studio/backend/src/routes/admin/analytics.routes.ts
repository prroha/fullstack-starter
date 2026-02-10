import { Router } from "express";
import PDFDocument from "pdfkit";
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

/**
 * GET /api/admin/analytics/export/pdf
 * Export analytics report as PDF
 * Query params: type (revenue|funnel|features|templates), period (7d|30d|90d|1y)
 */
router.get("/export/pdf", async (req, res, next) => {
  try {
    const { type = "revenue", period = "30d" } = req.query;
    const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "1y" ? 365 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const periodLabel = period === "7d" ? "Last 7 Days"
      : period === "90d" ? "Last 90 Days"
      : period === "1y" ? "Last Year"
      : "Last 30 Days";

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    const filename = `analytics-${type}-${period}-${new Date().toISOString().split("T")[0]}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to format currency
    const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

    // Helper function to draw a table
    const drawTable = (headers: string[], rows: string[][], startY: number, colWidths: number[]) => {
      const rowHeight = 25;
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);
      let y = startY;

      // Draw header background
      doc.fillColor("#f3f4f6").rect(50, y, tableWidth, rowHeight).fill();

      // Draw header text
      doc.fillColor("#374151").fontSize(10).font("Helvetica-Bold");
      let x = 50;
      headers.forEach((header, i) => {
        doc.text(header, x + 5, y + 8, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });
      y += rowHeight;

      // Draw rows
      doc.font("Helvetica").fillColor("#1f2937");
      rows.forEach((row, rowIndex) => {
        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.fillColor("#f9fafb").rect(50, y, tableWidth, rowHeight).fill();
        }

        doc.fillColor("#1f2937");
        x = 50;
        row.forEach((cell, i) => {
          doc.text(cell, x + 5, y + 8, { width: colWidths[i] - 10 });
          x += colWidths[i];
        });
        y += rowHeight;
      });

      return y;
    };

    // Add title
    doc.fontSize(24).font("Helvetica-Bold").fillColor("#111827");
    doc.text("Analytics Report", { align: "center" });
    doc.moveDown(0.5);

    // Add report type and period
    doc.fontSize(14).font("Helvetica").fillColor("#6b7280");
    const reportTypeLabel = type === "revenue" ? "Revenue Report"
      : type === "funnel" ? "Conversion Funnel Report"
      : type === "features" ? "Feature Popularity Report"
      : "Template Performance Report";
    doc.text(`${reportTypeLabel} - ${periodLabel}`, { align: "center" });
    doc.moveDown(2);

    if (type === "revenue") {
      // Fetch revenue data
      const revenueByTier = await prisma.order.groupBy({
        by: ["tier"],
        _sum: { total: true },
        _count: { id: true },
        where: { status: "COMPLETED", paidAt: { gte: startDate } },
      });

      const revenueByTemplate = await prisma.order.groupBy({
        by: ["templateId"],
        _sum: { total: true },
        _count: { id: true },
        where: { status: "COMPLETED", paidAt: { gte: startDate }, templateId: { not: null } },
      });

      const templateIds = revenueByTemplate.map(r => r.templateId).filter(Boolean) as string[];
      const templates = await prisma.template.findMany({
        where: { id: { in: templateIds } },
        select: { id: true, name: true },
      });

      const totalRevenue = revenueByTier.reduce((sum, r) => sum + (r._sum.total || 0), 0);
      const totalOrders = revenueByTier.reduce((sum, r) => sum + r._count.id, 0);

      // Summary section
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Summary");
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica").fillColor("#374151");
      doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`);
      doc.text(`Total Orders: ${totalOrders}`);
      doc.text(`Average Order Value: ${totalOrders > 0 ? formatCurrency(Math.round(totalRevenue / totalOrders)) : "$0.00"}`);
      doc.moveDown(1.5);

      // Revenue by Tier
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Revenue by Tier");
      doc.moveDown(0.5);

      const tierHeaders = ["Tier", "Revenue", "Orders"];
      const tierRows = revenueByTier.map(r => [
        r.tier,
        formatCurrency(r._sum.total || 0),
        r._count.id.toString(),
      ]);
      let currentY = drawTable(tierHeaders, tierRows, doc.y, [200, 150, 100]);
      doc.y = currentY + 20;
      doc.moveDown(1);

      // Revenue by Template
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Revenue by Template");
      doc.moveDown(0.5);

      const templateHeaders = ["Template", "Revenue", "Orders"];
      const templateRows = revenueByTemplate.map(r => [
        templates.find(t => t.id === r.templateId)?.name || "Unknown",
        formatCurrency(r._sum.total || 0),
        r._count.id.toString(),
      ]);
      drawTable(templateHeaders, templateRows, doc.y, [250, 150, 100]);

    } else if (type === "funnel") {
      // Fetch funnel data
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

      const conversionRate = pageViews > 0 ? ((purchases / pageViews) * 100).toFixed(2) : "0";
      const previewToCheckout = previews > 0 ? ((checkoutStarts / previews) * 100).toFixed(2) : "0";
      const checkoutToPurchase = checkoutStarts > 0 ? ((purchases / checkoutStarts) * 100).toFixed(2) : "0";

      // Conversion metrics
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Conversion Metrics");
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica").fillColor("#374151");
      doc.text(`Overall Conversion Rate: ${conversionRate}%`);
      doc.text(`Preview to Checkout: ${previewToCheckout}%`);
      doc.text(`Checkout to Purchase: ${checkoutToPurchase}%`);
      doc.moveDown(1.5);

      // Funnel stages
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Funnel Stages");
      doc.moveDown(0.5);

      const funnelHeaders = ["Stage", "Count", "% of Total"];
      const funnelRows = [
        ["Page Views", pageViews.toString(), "100%"],
        ["Configured", configEvents.toString(), pageViews > 0 ? `${((configEvents / pageViews) * 100).toFixed(1)}%` : "0%"],
        ["Previewed", previews.toString(), pageViews > 0 ? `${((previews / pageViews) * 100).toFixed(1)}%` : "0%"],
        ["Checkout Started", checkoutStarts.toString(), pageViews > 0 ? `${((checkoutStarts / pageViews) * 100).toFixed(1)}%` : "0%"],
        ["Purchased", purchases.toString(), pageViews > 0 ? `${((purchases / pageViews) * 100).toFixed(1)}%` : "0%"],
      ];
      drawTable(funnelHeaders, funnelRows, doc.y, [200, 150, 150]);

    } else if (type === "features") {
      // Fetch feature data
      const orders = await prisma.order.findMany({
        where: { status: "COMPLETED", paidAt: { gte: startDate } },
        select: { selectedFeatures: true },
      });

      const featureCounts = new Map<string, number>();
      for (const order of orders) {
        for (const feature of order.selectedFeatures) {
          featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
        }
      }

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
            percentage: orders.length > 0 ? Math.round((count / orders.length) * 100) : 0,
          };
        })
        .sort((a, b) => b.purchaseCount - a.purchaseCount);

      // Summary
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Summary");
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica").fillColor("#374151");
      doc.text(`Total Orders Analyzed: ${orders.length}`);
      doc.text(`Unique Features Selected: ${popularFeatures.length}`);
      doc.moveDown(1.5);

      // Feature popularity table
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Feature Popularity");
      doc.moveDown(0.5);

      const featureHeaders = ["Feature", "Price", "Times Selected", "% of Orders"];
      const featureRows = popularFeatures.slice(0, 15).map(f => [
        f.name,
        formatCurrency(f.price),
        f.purchaseCount.toString(),
        `${f.percentage}%`,
      ]);
      drawTable(featureHeaders, featureRows, doc.y, [180, 80, 120, 100]);

    } else if (type === "templates") {
      // Fetch template data
      const templatesData = await prisma.template.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, price: true },
      });

      const templateStats = await Promise.all(
        templatesData.map(async (template) => {
          const [orderStats, previewCount] = await Promise.all([
            prisma.order.aggregate({
              where: { templateId: template.id, status: "COMPLETED", paidAt: { gte: startDate } },
              _sum: { total: true },
              _count: { id: true },
            }),
            prisma.previewSession.count({
              where: { templateId: template.id, createdAt: { gte: startDate } },
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

      const sortedStats = templateStats.sort((a, b) => b.revenue - a.revenue);
      const totalRevenue = sortedStats.reduce((sum, t) => sum + t.revenue, 0);
      const totalOrders = sortedStats.reduce((sum, t) => sum + t.orderCount, 0);

      // Summary
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Summary");
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica").fillColor("#374151");
      doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`);
      doc.text(`Total Orders: ${totalOrders}`);
      doc.text(`Active Templates: ${sortedStats.length}`);
      doc.moveDown(1.5);

      // Template performance table
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827");
      doc.text("Template Performance");
      doc.moveDown(0.5);

      const templateHeaders = ["Template", "Revenue", "Orders", "Previews", "Conv %"];
      const templateRows = sortedStats.map(t => [
        t.name,
        formatCurrency(t.revenue),
        t.orderCount.toString(),
        t.previewCount.toString(),
        `${t.conversionRate}%`,
      ]);
      drawTable(templateHeaders, templateRows, doc.y, [160, 100, 70, 80, 70]);
    }

    // Add footer with generation date
    doc.moveDown(2);
    doc.fontSize(10).font("Helvetica").fillColor("#9ca3af");
    doc.text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };
