"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Eye,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import {
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
} from "@/components/ui";
import { AdminPageHeader, OrderStatusBadge } from "@/components/admin";
import type { OrderStatus } from "@/components/admin/status-badges";

interface DashboardStats {
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
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
  previews: {
    total: number;
    today: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerEmail: string;
    tier: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
    template?: { name: string };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    // For now, using mock data
    const mockStats: DashboardStats = {
      revenue: {
        total: 2459900, // in cents
        today: 34900,
        thisMonth: 459900,
        growth: 12.5,
      },
      orders: {
        total: 156,
        today: 3,
        pending: 5,
      },
      customers: {
        total: 89,
        newToday: 2,
      },
      previews: {
        total: 1247,
        today: 45,
      },
      recentOrders: [
        {
          id: "1",
          orderNumber: "ORD-001",
          customerEmail: "john@example.com",
          tier: "Pro",
          total: 14900,
          status: "COMPLETED",
          createdAt: new Date().toISOString(),
          template: { name: "LMS" },
        },
        {
          id: "2",
          orderNumber: "ORD-002",
          customerEmail: "jane@example.com",
          tier: "Business",
          total: 29900,
          status: "PENDING",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          orderNumber: "ORD-003",
          customerEmail: "bob@example.com",
          tier: "Starter",
          total: 4900,
          status: "COMPLETED",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
    };

    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
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

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Welcome to Starter Studio Admin Panel"
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
