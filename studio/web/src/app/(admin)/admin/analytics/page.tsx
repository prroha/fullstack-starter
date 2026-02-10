"use client";

import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  PieChart,
  Globe,
  ArrowDown,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
} from "@/lib/utils";
import { downloadFile } from "@/lib/export";
import { adminApi } from "@/lib/api";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  StatCard,
  DropdownMenu,
} from "@/components/ui";
import { AdminPageHeader } from "@/components/admin";

// Types
type Period = "7d" | "30d" | "90d" | "custom";
type ViewMode = "daily" | "weekly" | "monthly";

interface RevenueData {
  byTier: Array<{ tier: string; revenue: number; orderCount: number }>;
  byTemplate: Array<{
    templateId: string;
    templateName: string;
    revenue: number;
    orderCount: number;
  }>;
  daily: Array<{ date: string; revenue: number; orders: number }>;
}

interface FeatureData {
  slug: string;
  name: string;
  price: number;
  purchaseCount: number;
  percentage: number;
}

interface FunnelData {
  funnel: Array<{ stage: string; count: number; percentage: number }>;
  conversionRate: string;
  previewToCheckout: string;
  checkoutToPurchase: string;
}

interface TemplateData {
  id: string;
  name: string;
  slug: string;
  price: number;
  revenue: number;
  orderCount: number;
  previewCount: number;
  conversionRate: string;
  avgRating?: number;
}

interface GeoData {
  country: string;
  orders: number;
  revenue: number;
}

interface KeyMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  conversionRate: number;
  revenueTrend: number;
  ordersTrend: number;
  aovTrend: number;
  conversionTrend: number;
}

// Mock data generator
function generateMockData(period: Period) {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const baseMultiplier = days / 30;

  // Generate daily revenue data
  const daily: Array<{ date: string; revenue: number; orders: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayVariation = 0.5 + Math.random();
    const weekendFactor = [0, 6].includes(date.getDay()) ? 0.6 : 1;
    const revenue = Math.round(
      (15000 + Math.random() * 25000) * dayVariation * weekendFactor
    );
    const orders = Math.round(
      (3 + Math.random() * 8) * dayVariation * weekendFactor
    );
    daily.push({
      date: date.toISOString().split("T")[0],
      revenue,
      orders,
    });
  }

  const revenueData: RevenueData = {
    byTier: [
      {
        tier: "Enterprise",
        revenue: Math.round(489900 * baseMultiplier),
        orderCount: Math.round(12 * baseMultiplier),
      },
      {
        tier: "Business",
        revenue: Math.round(359400 * baseMultiplier),
        orderCount: Math.round(18 * baseMultiplier),
      },
      {
        tier: "Pro",
        revenue: Math.round(223500 * baseMultiplier),
        orderCount: Math.round(45 * baseMultiplier),
      },
      {
        tier: "Starter",
        revenue: Math.round(68600 * baseMultiplier),
        orderCount: Math.round(28 * baseMultiplier),
      },
    ],
    byTemplate: [
      {
        templateId: "1",
        templateName: "SaaS Starter",
        revenue: Math.round(356700 * baseMultiplier),
        orderCount: Math.round(42 * baseMultiplier),
      },
      {
        templateId: "2",
        templateName: "E-commerce Pro",
        revenue: Math.round(289400 * baseMultiplier),
        orderCount: Math.round(31 * baseMultiplier),
      },
      {
        templateId: "3",
        templateName: "LMS Platform",
        revenue: Math.round(198200 * baseMultiplier),
        orderCount: Math.round(18 * baseMultiplier),
      },
      {
        templateId: "4",
        templateName: "Blog & CMS",
        revenue: Math.round(156800 * baseMultiplier),
        orderCount: Math.round(24 * baseMultiplier),
      },
    ],
    daily,
  };

  const featureData: FeatureData[] = [
    {
      slug: "auth",
      name: "Authentication",
      price: 4900,
      purchaseCount: Math.round(89 * baseMultiplier),
      percentage: 92,
    },
    {
      slug: "payments",
      name: "Payment Integration",
      price: 7900,
      purchaseCount: Math.round(76 * baseMultiplier),
      percentage: 78,
    },
    {
      slug: "analytics",
      name: "Analytics Dashboard",
      price: 5900,
      purchaseCount: Math.round(65 * baseMultiplier),
      percentage: 67,
    },
    {
      slug: "notifications",
      name: "Push Notifications",
      price: 3900,
      purchaseCount: Math.round(54 * baseMultiplier),
      percentage: 56,
    },
    {
      slug: "file-upload",
      name: "File Upload & Storage",
      price: 4900,
      purchaseCount: Math.round(48 * baseMultiplier),
      percentage: 49,
    },
    {
      slug: "real-time",
      name: "Real-time Updates",
      price: 6900,
      purchaseCount: Math.round(42 * baseMultiplier),
      percentage: 43,
    },
    {
      slug: "admin-dashboard",
      name: "Admin Dashboard",
      price: 8900,
      purchaseCount: Math.round(38 * baseMultiplier),
      percentage: 39,
    },
    {
      slug: "multi-tenant",
      name: "Multi-tenancy",
      price: 12900,
      purchaseCount: Math.round(28 * baseMultiplier),
      percentage: 29,
    },
  ];

  const funnelData: FunnelData = {
    funnel: [
      {
        stage: "Visitors",
        count: Math.round(12450 * baseMultiplier),
        percentage: 100,
      },
      {
        stage: "Previews",
        count: Math.round(3456 * baseMultiplier),
        percentage: 28,
      },
      {
        stage: "Checkouts",
        count: Math.round(892 * baseMultiplier),
        percentage: 7.2,
      },
      {
        stage: "Purchases",
        count: Math.round(103 * baseMultiplier),
        percentage: 0.83,
      },
    ],
    conversionRate: "0.83",
    previewToCheckout: "25.8",
    checkoutToPurchase: "11.5",
  };

  const templateData: TemplateData[] = [
    {
      id: "1",
      name: "SaaS Starter Kit",
      slug: "saas-starter",
      price: 14900,
      revenue: Math.round(356700 * baseMultiplier),
      orderCount: Math.round(42 * baseMultiplier),
      previewCount: Math.round(1245 * baseMultiplier),
      conversionRate: "3.37",
      avgRating: 4.8,
    },
    {
      id: "2",
      name: "E-commerce Pro",
      slug: "ecommerce-pro",
      price: 19900,
      revenue: Math.round(289400 * baseMultiplier),
      orderCount: Math.round(31 * baseMultiplier),
      previewCount: Math.round(987 * baseMultiplier),
      conversionRate: "3.14",
      avgRating: 4.6,
    },
    {
      id: "3",
      name: "LMS Platform",
      slug: "lms-platform",
      price: 24900,
      revenue: Math.round(198200 * baseMultiplier),
      orderCount: Math.round(18 * baseMultiplier),
      previewCount: Math.round(654 * baseMultiplier),
      conversionRate: "2.75",
      avgRating: 4.9,
    },
    {
      id: "4",
      name: "Blog & CMS",
      slug: "blog-cms",
      price: 9900,
      revenue: Math.round(156800 * baseMultiplier),
      orderCount: Math.round(24 * baseMultiplier),
      previewCount: Math.round(876 * baseMultiplier),
      conversionRate: "2.74",
      avgRating: 4.5,
    },
    {
      id: "5",
      name: "Marketplace",
      slug: "marketplace",
      price: 29900,
      revenue: Math.round(119600 * baseMultiplier),
      orderCount: Math.round(8 * baseMultiplier),
      previewCount: Math.round(432 * baseMultiplier),
      conversionRate: "1.85",
      avgRating: 4.7,
    },
  ];

  const geoData: GeoData[] = [
    {
      country: "United States",
      orders: Math.round(45 * baseMultiplier),
      revenue: Math.round(489500 * baseMultiplier),
    },
    {
      country: "United Kingdom",
      orders: Math.round(18 * baseMultiplier),
      revenue: Math.round(167800 * baseMultiplier),
    },
    {
      country: "Germany",
      orders: Math.round(14 * baseMultiplier),
      revenue: Math.round(134200 * baseMultiplier),
    },
    {
      country: "Canada",
      orders: Math.round(12 * baseMultiplier),
      revenue: Math.round(98400 * baseMultiplier),
    },
    {
      country: "Australia",
      orders: Math.round(9 * baseMultiplier),
      revenue: Math.round(78600 * baseMultiplier),
    },
    {
      country: "France",
      orders: Math.round(7 * baseMultiplier),
      revenue: Math.round(62400 * baseMultiplier),
    },
    {
      country: "Netherlands",
      orders: Math.round(5 * baseMultiplier),
      revenue: Math.round(45800 * baseMultiplier),
    },
    {
      country: "India",
      orders: Math.round(8 * baseMultiplier),
      revenue: Math.round(34200 * baseMultiplier),
    },
  ];

  const totalRevenue = revenueData.byTier.reduce((s, t) => s + t.revenue, 0);
  const totalOrders = revenueData.byTier.reduce((s, t) => s + t.orderCount, 0);

  const keyMetrics: KeyMetrics = {
    totalRevenue,
    totalOrders,
    avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    conversionRate: 0.83,
    revenueTrend: 12.5,
    ordersTrend: 8.3,
    aovTrend: 3.9,
    conversionTrend: -1.2,
  };

  return {
    revenueData,
    featureData,
    funnelData,
    templateData,
    geoData,
    keyMetrics,
  };
}

// Page-specific visualization components

function BarChart({
  data,
  viewMode,
}: {
  data: Array<{ date: string; revenue: number; orders: number }>;
  viewMode: ViewMode;
}) {
  const aggregatedData = useMemo(() => {
    if (viewMode === "daily") return data;

    const groups = new Map<
      string,
      { revenue: number; orders: number; dates: string[] }
    >();

    data.forEach((item) => {
      const date = new Date(item.date);
      let key: string;

      if (viewMode === "weekly") {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      const existing = groups.get(key) || { revenue: 0, orders: 0, dates: [] };
      groups.set(key, {
        revenue: existing.revenue + item.revenue,
        orders: existing.orders + item.orders,
        dates: [...existing.dates, item.date],
      });
    });

    return Array.from(groups.entries()).map(([date, values]) => ({
      date,
      revenue: values.revenue,
      orders: values.orders,
    }));
  }, [data, viewMode]);

  const maxRevenue = Math.max(...aggregatedData.map((d) => d.revenue));
  const displayData =
    viewMode === "daily" ? aggregatedData.slice(-14) : aggregatedData;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-48">
        {displayData.map((item, idx) => {
          const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div
                className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer min-h-[4px]"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${formatCurrency(item.revenue)} - ${item.orders} orders`}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {formatCurrency(item.revenue)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground overflow-hidden">
        {displayData.length <= 7 ? (
          displayData.map((item, idx) => (
            <span key={idx} className="truncate">
              {viewMode === "monthly"
                ? new Date(item.date + "-01").toLocaleDateString("en-US", {
                    month: "short",
                  })
                : new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
            </span>
          ))
        ) : (
          <>
            <span>
              {new Date(displayData[0].date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <span>
              {new Date(
                displayData[displayData.length - 1].date
              ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function ConversionFunnel({ data }: { data: FunnelData }) {
  const colors = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {data.funnel.map((stage, idx) => {
          const widthPercent = stage.percentage;
          const nextStage = data.funnel[idx + 1];
          const dropOff = nextStage
            ? ((stage.count - nextStage.count) / stage.count) * 100
            : 0;

          return (
            <div key={stage.stage} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <span className="text-muted-foreground">
                  {formatNumber(stage.count)} ({formatPercentage(stage.percentage)})
                </span>
              </div>
              <div className="relative">
                <div
                  className={cn(
                    "h-10 rounded transition-all flex items-center justify-center",
                    colors[idx % colors.length]
                  )}
                  style={{ width: `${Math.max(widthPercent, 5)}%` }}
                >
                  <span className="text-white text-sm font-medium">
                    {formatNumber(stage.count)}
                  </span>
                </div>
              </div>
              {nextStage && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                  <ArrowDown className="h-3 w-3" />
                  <span>
                    {formatPercentage(dropOff)} drop-off (
                    {formatNumber(stage.count - nextStage.count)} users)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {data.conversionRate}%
          </p>
          <p className="text-xs text-muted-foreground">Overall Conversion</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {data.previewToCheckout}%
          </p>
          <p className="text-xs text-muted-foreground">Preview to Checkout</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-violet-600">
            {data.checkoutToPurchase}%
          </p>
          <p className="text-xs text-muted-foreground">Checkout to Purchase</p>
        </div>
      </div>
    </div>
  );
}

function TierDistribution({
  data,
}: {
  data: Array<{ tier: string; revenue: number; orderCount: number }>;
}) {
  const total = data.reduce((s, t) => s + t.revenue, 0);
  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal stacked bar */}
      <div className="h-8 rounded-lg overflow-hidden flex">
        {data.map((tier, idx) => {
          const percent = total > 0 ? (tier.revenue / total) * 100 : 0;
          return (
            <div
              key={tier.tier}
              className={cn(colors[idx % colors.length], "transition-all")}
              style={{ width: `${percent}%` }}
              title={`${tier.tier}: ${formatCurrency(tier.revenue)}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((tier, idx) => {
          const percent = total > 0 ? (tier.revenue / total) * 100 : 0;
          return (
            <div key={tier.tier} className="flex items-center gap-2">
              <div
                className={cn("w-3 h-3 rounded", colors[idx % colors.length])}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium truncate">
                    {tier.tier}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatPercentage(percent, 0)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(tier.revenue)} ({tier.orderCount} orders)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            "w-4 h-4",
            star <= Math.round(rating)
              ? "text-yellow-500 fill-current"
              : "text-gray-300"
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-muted-foreground ml-1">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ReturnType<typeof generateMockData> | null>(
    null
  );

  const loadData = (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setData(generateMockData(period));
      setLoading(false);
      setRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async (reportType: "revenue" | "funnel" | "features" | "templates") => {
    setExporting(true);
    try {
      const exportPeriod = period === "custom" ? "30d" : period;
      const url = adminApi.getAnalyticsPdfExportUrl(reportType, exportPeriod);
      await downloadFile(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-background rounded-lg border p-6 animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { revenueData, featureData, funnelData, templateData, geoData, keyMetrics } =
    data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Analytics"
        description="Track revenue, conversions, and performance metrics"
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Refresh data"
            >
              <RefreshCw
                className={cn("h-5 w-5", refreshing && "animate-spin")}
              />
            </Button>
            <DropdownMenu
              trigger={
                <Button variant="outline" size="sm" disabled={exporting}>
                  <Download className={cn("h-4 w-4 mr-2", exporting && "animate-pulse")} />
                  {exporting ? "Exporting..." : "Export PDF"}
                </Button>
              }
              content={[
                { key: "revenue", label: "Revenue Report", onClick: () => handleExportPdf("revenue") },
                { key: "funnel", label: "Conversion Funnel Report", onClick: () => handleExportPdf("funnel") },
                { key: "features", label: "Feature Popularity Report", onClick: () => handleExportPdf("features") },
                { key: "templates", label: "Template Performance Report", onClick: () => handleExportPdf("templates") },
              ]}
            />
          </>
        }
      />

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-muted rounded-lg w-fit">
        {(
          [
            { value: "7d", label: "Last 7 Days" },
            { value: "30d", label: "Last 30 Days" },
            { value: "90d", label: "Last 90 Days" },
            { value: "custom", label: "Custom" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            onClick={() =>
              option.value !== "custom" && setPeriod(option.value)
            }
            disabled={option.value === "custom"}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              period === option.value
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground",
              option.value === "custom" && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.label}
          </button>
        ))}
        <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDate(
              new Date(
                Date.now() -
                  (period === "7d"
                    ? 7
                    : period === "90d"
                      ? 90
                      : 30) *
                    24 *
                    60 *
                    60 *
                    1000
              )
            )}{" "}
            - {formatDate(new Date())}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(keyMetrics.totalRevenue)}
          change={keyMetrics.revenueTrend}
          trendLabel="vs previous period"
          icon={<DollarSign className="h-6 w-6" />}
          size="lg"
        />
        <StatCard
          label="Total Orders"
          value={formatNumber(keyMetrics.totalOrders)}
          change={keyMetrics.ordersTrend}
          trendLabel="vs previous period"
          icon={<ShoppingCart className="h-6 w-6" />}
          size="lg"
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(keyMetrics.avgOrderValue)}
          change={keyMetrics.aovTrend}
          trendLabel="vs previous period"
          icon={<BarChart3 className="h-6 w-6" />}
          size="lg"
        />
        <StatCard
          label="Conversion Rate"
          value={formatPercentage(keyMetrics.conversionRate)}
          change={keyMetrics.conversionTrend}
          trendLabel="vs previous period"
          icon={<TrendingUp className="h-6 w-6" />}
          size="lg"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold">Revenue Over Time</h2>
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              {(["daily", "weekly", "monthly"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded transition-colors capitalize",
                    viewMode === mode
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BarChart data={revenueData.daily} viewMode={viewMode} />
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Conversion Funnel</h2>
          </CardHeader>
          <CardContent>
            <ConversionFunnel data={funnelData} />
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Revenue by Tier</h2>
            </div>
          </CardHeader>
          <CardContent>
            <TierDistribution data={revenueData.byTier} />
          </CardContent>
        </Card>
      </div>

      {/* Popular Features Table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Popular Features</h2>
          <p className="text-sm text-muted-foreground">
            Features most frequently selected in orders
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature Name</TableHead>
                <TableHead>Times Selected</TableHead>
                <TableHead>Revenue Generated</TableHead>
                <TableHead>% of Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureData.map((feature) => (
                <TableRow key={feature.slug}>
                  <TableCell>
                    <span className="font-medium">{feature.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatCurrency(feature.price)}
                    </span>
                  </TableCell>
                  <TableCell>{formatNumber(feature.purchaseCount)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(feature.purchaseCount * feature.price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${feature.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {feature.percentage}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Performance Table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Template Performance</h2>
          <p className="text-sm text-muted-foreground">
            Sales and conversion metrics by template
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Sales Count</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Previews</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Avg Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateData.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{template.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(template.price)} base price
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatNumber(template.orderCount)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(template.revenue)}
                  </TableCell>
                  <TableCell>{formatNumber(template.previewCount)}</TableCell>
                  <TableCell>{template.conversionRate}%</TableCell>
                  <TableCell>
                    {template.avgRating && (
                      <StarRating rating={template.avgRating} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Geographic Distribution</h2>
              <p className="text-sm text-muted-foreground">
                Top countries by revenue
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {geoData.map((country, idx) => {
              const maxRevenue = geoData[0].revenue;
              const percent = (country.revenue / maxRevenue) * 100;
              return (
                <div key={country.country} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {idx + 1}. {country.country}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatNumber(country.orders)} orders</span>
                    <span>{formatCurrency(country.revenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <div className="bg-muted/50 rounded-lg border p-4 text-center text-sm text-muted-foreground">
        Data shown is for the selected period:{" "}
        <span className="font-medium text-foreground">
          {period === "7d"
            ? "Last 7 Days"
            : period === "90d"
              ? "Last 90 Days"
              : "Last 30 Days"}
        </span>
        . Last updated: {formatDate(new Date())}
      </div>
    </div>
  );
}
