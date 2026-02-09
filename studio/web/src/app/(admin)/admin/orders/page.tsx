"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Download,
  MoreHorizontal,
  DollarSign,
  ShoppingCart,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, formatDateTime, formatDate } from "@/lib/utils";

// Shared UI components
import { Button, Modal, StatCard, DropdownMenu } from "@/components/ui";
import { EmptyList } from "@/components/ui";
import { EmptyState } from "@core/components/shared";
import { AdminPageHeader, OrderStatusBadge } from "@/components/admin";

// Types
interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  tier: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  stripePaymentIntentId: string | null;
  template?: { name: string; slug: string } | null;
  coupon?: { code: string } | null;
  license?: { id: string; status: string; downloadCount: number } | null;
}

type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";

interface OrderStats {
  total: number;
  completed: number;
  pending: number;
  refunded: number;
  revenue: number;
  averageOrderValue: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  search: string;
  status: string;
  tier: string;
  from: string;
  to: string;
}

// Constants
const ORDER_STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TIERS: { value: string; label: string }[] = [
  { value: "", label: "All Tiers" },
  { value: "Starter", label: "Starter" },
  { value: "Pro", label: "Pro" },
  { value: "Business", label: "Business" },
  { value: "Enterprise", label: "Enterprise" },
];

// Order Details Modal
function OrderDetailsModal({
  order,
  open,
  onClose,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!order) return null;

  return (
    <Modal isOpen={open} onClose={onClose} title={`Order ${order.orderNumber}`} size="lg">
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Customer Info */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-medium">Customer Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{order.customerEmail}</span>
            <span className="text-muted-foreground">Name</span>
            <span>{order.customerName || "-"}</span>
          </div>
        </div>

        {/* Order Info */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-medium">Order Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Tier</span>
            <span>{order.tier}</span>
            <span className="text-muted-foreground">Template</span>
            <span>{order.template?.name || "Custom"}</span>
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatCurrency(order.total)}</span>
            {order.coupon && (
              <>
                <span className="text-muted-foreground">Coupon</span>
                <span className="text-success">{order.coupon.code}</span>
              </>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-medium">Payment Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Created</span>
            <span>{formatDateTime(order.createdAt)}</span>
            <span className="text-muted-foreground">Paid At</span>
            <span>{order.paidAt ? formatDateTime(order.paidAt) : "-"}</span>
            <span className="text-muted-foreground">Stripe ID</span>
            <span className="font-mono text-xs truncate">
              {order.stripePaymentIntentId || "-"}
            </span>
          </div>
        </div>

        {/* License Info */}
        {order.license && (
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-medium">License Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">License Status</span>
              <span>{order.license.status}</span>
              <span className="text-muted-foreground">Downloads</span>
              <span>{order.license.downloadCount}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Status Update Modal
function StatusUpdateModal({
  order,
  open,
  onClose,
  onUpdate,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (orderId: string, status: OrderStatus) => void;
}) {
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(order.id, status);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Update Order Status"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || status === order.status}
          >
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Order: {order.orderNumber}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            {ORDER_STATUSES.filter(s => s.value).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

// Refund Confirmation Modal
function RefundConfirmModal({
  order,
  open,
  onClose,
  onConfirm,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(order.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Confirm Refund"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing..." : "Process Refund"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">This action cannot be undone</p>
            <p className="text-sm text-muted-foreground mt-1">
              Processing a refund will change the order status to REFUNDED and revoke any associated licenses.
            </p>
          </div>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Order</span>
            <span className="font-medium">{order.orderNumber}</span>
            <span className="text-muted-foreground">Customer</span>
            <span>{order.customerEmail}</span>
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Main Orders Page
export default function OrdersPage() {
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    tier: "",
    from: "",
    to: "",
  });

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  // Mock data generator
  const generateMockOrders = useCallback((page: number, filters: Filters): Order[] => {
    const mockOrders: Order[] = [
      {
        id: "1",
        orderNumber: "ORD-2024-001",
        customerEmail: "john.doe@example.com",
        customerName: "John Doe",
        tier: "Pro",
        total: 14900,
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        stripePaymentIntentId: "pi_1234567890",
        template: { name: "LMS Template", slug: "lms" },
        license: { id: "lic-1", status: "ACTIVE", downloadCount: 3 },
      },
      {
        id: "2",
        orderNumber: "ORD-2024-002",
        customerEmail: "jane.smith@example.com",
        customerName: "Jane Smith",
        tier: "Business",
        total: 29900,
        status: "PENDING",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        paidAt: null,
        stripePaymentIntentId: null,
        template: { name: "E-Commerce", slug: "ecommerce" },
      },
      {
        id: "3",
        orderNumber: "ORD-2024-003",
        customerEmail: "bob.wilson@example.com",
        customerName: "Bob Wilson",
        tier: "Starter",
        total: 4900,
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        paidAt: new Date(Date.now() - 172800000).toISOString(),
        stripePaymentIntentId: "pi_0987654321",
        template: { name: "Blog Template", slug: "blog" },
        license: { id: "lic-2", status: "ACTIVE", downloadCount: 1 },
      },
      {
        id: "4",
        orderNumber: "ORD-2024-004",
        customerEmail: "alice.johnson@example.com",
        customerName: "Alice Johnson",
        tier: "Enterprise",
        total: 99900,
        status: "PROCESSING",
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        paidAt: null,
        stripePaymentIntentId: "pi_1111111111",
        template: { name: "SaaS Starter", slug: "saas" },
      },
      {
        id: "5",
        orderNumber: "ORD-2024-005",
        customerEmail: "charlie.brown@example.com",
        customerName: "Charlie Brown",
        tier: "Pro",
        total: 14900,
        status: "FAILED",
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        paidAt: null,
        stripePaymentIntentId: null,
      },
      {
        id: "6",
        orderNumber: "ORD-2024-006",
        customerEmail: "diana.prince@example.com",
        customerName: "Diana Prince",
        tier: "Business",
        total: 29900,
        status: "REFUNDED",
        createdAt: new Date(Date.now() - 432000000).toISOString(),
        paidAt: new Date(Date.now() - 432000000).toISOString(),
        stripePaymentIntentId: "pi_2222222222",
        template: { name: "Agency Template", slug: "agency" },
        license: { id: "lic-3", status: "REVOKED", downloadCount: 2 },
      },
      {
        id: "7",
        orderNumber: "ORD-2024-007",
        customerEmail: "edward.stark@example.com",
        customerName: "Edward Stark",
        tier: "Pro",
        total: 14900,
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 518400000).toISOString(),
        paidAt: new Date(Date.now() - 518400000).toISOString(),
        stripePaymentIntentId: "pi_3333333333",
        template: { name: "Portfolio", slug: "portfolio" },
        license: { id: "lic-4", status: "ACTIVE", downloadCount: 5 },
      },
      {
        id: "8",
        orderNumber: "ORD-2024-008",
        customerEmail: "fiona.green@example.com",
        customerName: "Fiona Green",
        tier: "Starter",
        total: 4900,
        status: "CANCELLED",
        createdAt: new Date(Date.now() - 604800000).toISOString(),
        paidAt: null,
        stripePaymentIntentId: null,
      },
    ];

    // Apply filters
    let filtered = [...mockOrders];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchLower) ||
          o.customerEmail.toLowerCase().includes(searchLower) ||
          o.customerName?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((o) => o.status === filters.status);
    }

    if (filters.tier) {
      filtered = filtered.filter((o) => o.tier === filters.tier);
    }

    return filtered;
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/orders?page=${pagination.page}&limit=${pagination.limit}&status=${filters.status}&tier=${filters.tier}&search=${filters.search}&from=${filters.from}&to=${filters.to}`);
      // const data = await response.json();
      // setOrders(data.data);
      // setPagination(data.pagination);

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockOrders = generateMockOrders(pagination.page, filters);
      setOrders(mockOrders);
      setPagination((prev) => ({
        ...prev,
        total: mockOrders.length,
        totalPages: Math.ceil(mockOrders.length / prev.limit),
      }));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, generateMockOrders]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/orders/stats');
      // const data = await response.json();
      // setStats(data.data);

      // Mock implementation
      setStats({
        total: 156,
        completed: 89,
        pending: 12,
        refunded: 8,
        revenue: 1245600,
        averageOrderValue: 14000,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // Handle filter change
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/admin/orders/${orderId}/status`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status: newStatus }),
    // });

    // Mock implementation
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Handle refund
  const handleRefund = async (orderId: string) => {
    // TODO: Replace with actual API call
    // await fetch(`/api/admin/orders/${orderId}/refund`, {
    //   method: 'POST',
    // });

    // Mock implementation
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "REFUNDED" } : o))
    );
    fetchStats();
  };

  // Handle regenerate download
  const handleRegenerateDownload = async (orderId: string) => {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/admin/orders/${orderId}/regenerate-download`, {
    //   method: 'POST',
    // });
    // const data = await response.json();
    // alert(`New download token: ${data.data.downloadToken}`);

    // Mock implementation
    alert("Download link regenerated successfully!");
  };

  // Handle export
  const handleExport = async () => {
    // TODO: Replace with actual API call
    // window.location.href = `/api/admin/orders/export/csv?status=${filters.status}&tier=${filters.tier}&from=${filters.from}&to=${filters.to}`;

    // Mock implementation
    alert("Export functionality will download a CSV file with filtered orders");
  };

  // View order details
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  // Open status modal
  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalOpen(true);
  };

  // Open refund modal
  const handleOpenRefundModal = (order: Order) => {
    setSelectedOrder(order);
    setRefundModalOpen(true);
  };

  // Loading skeleton
  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-32 animate-pulse" />
          <div className="h-10 bg-muted rounded w-28 animate-pulse" />
        </div>

        {/* Filter bar skeleton */}
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded w-40 animate-pulse" />
          ))}
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background rounded-lg border p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-6 bg-muted rounded w-20" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-background rounded-lg border">
          <div className="p-4 border-b">
            <div className="h-5 bg-muted rounded w-32 animate-pulse" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b flex gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded flex-1 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Orders"
        description="Manage and track all customer orders"
        actions={
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order number or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-4 py-2 border rounded-lg bg-background min-w-[150px]"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Tier Filter */}
        <select
          value={filters.tier}
          onChange={(e) => handleFilterChange("tier", e.target.value)}
          className="px-4 py-2 border rounded-lg bg-background min-w-[120px]"
        >
          {TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background"
            placeholder="From"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background"
            placeholder="To"
          />
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Total Orders"
            value={formatNumber(stats.total)}
            icon={<ShoppingCart className="h-5 w-5" />}
            trendLabel={`${stats.completed} completed`}
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.revenue)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            label="Avg Order Value"
            value={formatCurrency(stats.averageOrderValue)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            label="Pending Orders"
            value={formatNumber(stats.pending)}
            icon={<Clock className="h-5 w-5" />}
            trendLabel={`${stats.refunded} refunded`}
          />
        </div>
      )}

      {/* Data Table */}
      <div className="bg-background rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Order Number
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Tier / Template
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <EmptyState
                      title="No orders found"
                      description="Try adjusting your filters"
                      variant="noResults"
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm">{order.customerEmail}</p>
                        {order.customerName && (
                          <p className="text-xs text-muted-foreground">
                            {order.customerName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium">{order.tier}</span>
                      {order.template && (
                        <span className="text-muted-foreground">
                          {" / "}{order.template.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu
                        trigger={
                          <button className="p-2 hover:bg-muted rounded">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                        content={[
                          {
                            key: "view-details",
                            label: "View Details",
                            onClick: () => handleViewDetails(order),
                          },
                          {
                            key: "update-status",
                            label: "Update Status",
                            onClick: () => handleOpenStatusModal(order),
                          },
                          {
                            key: "regenerate-download",
                            label: "Regenerate Download",
                            onClick: () => handleRegenerateDownload(order.id),
                            disabled: order.status !== "COMPLETED",
                          },
                          {
                            key: "process-refund",
                            label: "Process Refund",
                            onClick: () => handleOpenRefundModal(order),
                            destructive: true,
                            disabled: order.status !== "COMPLETED",
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="p-2 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderDetailsModal
        order={selectedOrder}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
      />

      <StatusUpdateModal
        order={selectedOrder}
        open={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedOrder(null);
        }}
        onUpdate={handleStatusUpdate}
      />

      <RefundConfirmModal
        order={selectedOrder}
        open={refundModalOpen}
        onClose={() => {
          setRefundModalOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleRefund}
      />
    </div>
  );
}
