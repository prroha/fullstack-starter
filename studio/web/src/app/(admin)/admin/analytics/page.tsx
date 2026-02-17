"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  PieChart,
  Globe,
  MapPin,
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
import { adminApi, type RevenueAnalytics, type FeatureStats, type FunnelAnalytics, type TemplateStats, type AnalyticsPeriod, type GeoAnalytics } from "@/lib/api";
import { showError } from "@/lib/toast";
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
type Period = AnalyticsPeriod;
type ViewMode = "daily" | "weekly" | "monthly";

// Re-use types from API but also define what we need locally
interface KeyMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  conversionRate: number;
}

interface AnalyticsData {
  revenueData: RevenueAnalytics;
  featureData: FeatureStats[];
  funnelData: FunnelAnalytics;
  templateData: TemplateStats[];
  keyMetrics: KeyMetrics;
}

// Page-specific visualization components start below

// Helper to compute key metrics from API data
function computeKeyMetrics(revenueData: RevenueAnalytics, funnelData: FunnelAnalytics): KeyMetrics {
  const totalRevenue = revenueData.byTier.reduce((s, t) => s + t.revenue, 0);
  const totalOrders = revenueData.byTier.reduce((s, t) => s + t.orderCount, 0);
  return {
    totalRevenue,
    totalOrders,
    avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    conversionRate: parseFloat(funnelData.conversionRate) || 0,
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

function ConversionFunnel({ data }: { data: FunnelAnalytics }) {
  const colors = [
    "bg-primary",
    "bg-primary/80",
    "bg-primary/60",
    "bg-primary/40",
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {data.funnel.map((stage: { stage: string; count: number; percentage: number }, idx: number) => {
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
                  <span className="text-primary-foreground text-sm font-medium">
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
          <p className="text-2xl font-bold text-primary/80">
            {data.previewToCheckout}%
          </p>
          <p className="text-xs text-muted-foreground">Preview to Checkout</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary/60">
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
    "bg-primary",
    "bg-primary/80",
    "bg-success",
    "bg-warning",
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


export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<GeoAnalytics | null>(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch all analytics data in parallel
      const [revenueData, featureData, funnelData, templateData, geoResult] = await Promise.all([
        adminApi.getRevenue(period),
        adminApi.getFeatureStats(),
        adminApi.getFunnel(period),
        adminApi.getTemplateStats(),
        adminApi.getGeoAnalytics(period).catch(() => null),
      ]);

      setGeoData(geoResult);

      // Compute key metrics from the data
      const keyMetrics = computeKeyMetrics(revenueData, funnelData);

      setData({
        revenueData,
        featureData,
        funnelData,
        templateData,
        keyMetrics,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load analytics";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async (reportType: "revenue" | "funnel" | "features" | "templates") => {
    setExporting(true);
    try {
      const url = adminApi.getAnalyticsPdfExportUrl(reportType, period);
      await downloadFile(url);
    } catch (err) {
      console.error("Export failed:", err);
      showError("Failed to export PDF. Please try again.");
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

  if (error || !data) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Analytics"
          description="Track revenue, conversions, and performance metrics"
        />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">{error || "Failed to load analytics data"}</p>
          <Button onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const { revenueData, featureData, funnelData, templateData, keyMetrics } = data;

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
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            onClick={() =>
              option.value !== "custom" && setPeriod(option.value)
            }
            disabled={option.value === "custom"}
            className={cn(
              "rounded-md",
              period === option.value
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </Button>
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
          icon={<DollarSign className="h-6 w-6" />}
          size="lg"
        />
        <StatCard
          label="Total Orders"
          value={formatNumber(keyMetrics.totalOrders)}
          icon={<ShoppingCart className="h-6 w-6" />}
          size="lg"
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(keyMetrics.avgOrderValue)}
          icon={<BarChart3 className="h-6 w-6" />}
          size="lg"
        />
        <StatCard
          label="Conversion Rate"
          value={formatPercentage(keyMetrics.conversionRate)}
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
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "rounded capitalize",
                    viewMode === mode
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode}
                </Button>
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
                Top countries by revenue and visits
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!geoData || !geoData.hasData ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No geographic data available yet.</p>
              <p className="text-sm mt-1">
                Geographic data is collected from analytics events with country information.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatNumber(geoData.totalCountries)}</p>
                  <p className="text-xs text-muted-foreground">Countries</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatNumber(geoData.totalVisits)}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(geoData.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Conv. Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geoData.countries.slice(0, 10).map((country) => (
                    <TableRow key={country.country}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{country.country}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(country.visits)}</TableCell>
                      <TableCell>{formatNumber(country.purchases)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(country.revenue)}</TableCell>
                      <TableCell>{country.conversionRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
