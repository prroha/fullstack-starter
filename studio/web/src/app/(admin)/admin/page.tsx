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
import { API_CONFIG } from "@/lib/constants";
import { showError } from "@/lib/toast";
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
import type { OrderStatus } from "@/components/admin/status-badges";

interface DashboardStats {
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    today: number;
    pending: number;
  };
  customers: {
    total: number;
    newToday: number;
  };
  templates: {
    active: number;
  };
  previews: {
    total: number;
    today: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerEmail: string;
    customerName: string | null;
    tier: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
    template?: { name: string } | null;
  }>;
  topTemplates: Array<{
    templateId: string | null;
    _count: { id: number };
    _sum: { total: number | null };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/dashboard/stats`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard";
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
          description="Welcome to Starter Studio Admin Panel"
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
          description="Welcome to Starter Studio Admin Panel"
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
        description="Welcome to Starter Studio Admin Panel"
        actions={
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.revenue.total)}
          change={stats.revenue.growth}
          trend={stats.revenue.growth >= 0 ? "up" : "down"}
          trendLabel="vs last month"
          icon={<DollarSign className="h-5 w-5" />}
          size="lg"
        />
        <StatCard
          label="Orders"
          value={formatNumber(stats.orders.total)}
          trendLabel={`${stats.orders.pending} pending`}
          icon={<ShoppingCart className="h-5 w-5" />}
          size="lg"
        />
        <StatCard
          label="Customers"
          value={formatNumber(stats.customers.total)}
          trendLabel={`${stats.customers.newToday} new today`}
          icon={<Users className="h-5 w-5" />}
          size="lg"
        />
        <StatCard
          label="Previews"
          value={formatNumber(stats.previews.total)}
          trendLabel={`${stats.previews.today} today`}
          icon={<Eye className="h-5 w-5" />}
          size="lg"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Orders</h2>
        </div>
        <Table>
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
      <div className="grid gap-4 md:grid-cols-3">
        <a
          href="/admin/templates"
          className="p-4 bg-background border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="font-medium">Manage Templates</h3>
          <p className="text-sm text-muted-foreground">
            Add, edit, or configure template presets
          </p>
        </a>
        <a
          href="/admin/features"
          className="p-4 bg-background border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="font-medium">Manage Features</h3>
          <p className="text-sm text-muted-foreground">
            Configure available features and pricing
          </p>
        </a>
        <a
          href="/admin/analytics"
          className="p-4 bg-background border rounded-lg hover:border-primary transition-colors"
        >
          <h3 className="font-medium">View Analytics</h3>
          <p className="text-sm text-muted-foreground">
            See conversion funnels and revenue reports
          </p>
        </a>
      </div>
    </div>
  );
}
