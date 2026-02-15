"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Eye,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import { showError } from "@/lib/toast";
import { adminApi, type DashboardStats, ApiError } from "@/lib/api";
import {
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  Button,
} from "@/components/ui";
import { AdminPageHeader, OrderStatusBadge } from "@/components/admin";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load dashboard";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Dashboard"
          description="Welcome to Xitolaunch Admin Panel"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background rounded-lg border p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Dashboard"
          description="Welcome to Xitolaunch Admin Panel"
        />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">{error || "Failed to load dashboard data"}</p>
          <Button onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Welcome to Xitolaunch Admin Panel"
        actions={
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Stats Grid */}
      <section aria-label="Dashboard statistics" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.revenue.total)}
          change={stats.revenue.growth}
          trend={stats.revenue.growth >= 0 ? "up" : "down"}
          trendLabel="vs last month"
          icon={<DollarSign className="h-5 w-5" aria-hidden="true" />}
          size="lg"
        />
        <StatCard
          label="Orders"
          value={formatNumber(stats.orders.total)}
          trendLabel={`${stats.orders.pending} pending`}
          icon={<ShoppingCart className="h-5 w-5" aria-hidden="true" />}
          size="lg"
        />
        <StatCard
          label="Customers"
          value={formatNumber(stats.customers.total)}
          trendLabel={`${stats.customers.newToday} new today`}
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          size="lg"
        />
        <StatCard
          label="Previews"
          value={formatNumber(stats.previews.total)}
          trendLabel={`${stats.previews.today} today`}
          icon={<Eye className="h-5 w-5" aria-hidden="true" />}
          size="lg"
        />
      </section>

      {/* Recent Orders */}
      <Card>
        <div className="p-4 border-b">
          <h2 id="recent-orders-heading" className="font-semibold">Recent Orders</h2>
        </div>
        <Table aria-labelledby="recent-orders-heading">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Tier / Template</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.recentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.customerEmail}
                </TableCell>
                <TableCell>
                  {order.tier}
                  {order.template && (
                    <span className="text-muted-foreground">
                      {" "}
                      / {order.template.name}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Quick Actions */}
      <nav aria-label="Quick actions" className="grid gap-4 md:grid-cols-3">
        <a
          href="/admin/templates"
          className="p-4 bg-background border rounded-lg hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <h3 className="font-medium">Manage Templates</h3>
          <p className="text-sm text-muted-foreground">
            Add, edit, or configure template presets
          </p>
        </a>
        <a
          href="/admin/features"
          className="p-4 bg-background border rounded-lg hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <h3 className="font-medium">Manage Features</h3>
          <p className="text-sm text-muted-foreground">
            Configure available features and pricing
          </p>
        </a>
        <a
          href="/admin/analytics"
          className="p-4 bg-background border rounded-lg hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <h3 className="font-medium">View Analytics</h3>
          <p className="text-sm text-muted-foreground">
            See conversion funnels and revenue reports
          </p>
        </a>
      </nav>
    </div>
  );
}
