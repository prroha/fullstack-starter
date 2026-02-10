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
import { formatCurrency, formatNumber, formatDateTime, formatDate } from "@/lib/utils";
import { API_CONFIG } from "@/lib/constants";
import { showSuccess, showError, showLoading, dismissToast } from "@/lib/toast";

// Shared UI components
import { Button, Modal, StatCard, DropdownMenu } from "@/components/ui";
import { EmptyList } from "@/components/ui";
import { EmptyState } from "@core/components/shared";
import { AdminPageHeader, OrderStatusBadge, AdminTableSkeleton } from "@/components/admin";

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
        <section className="border rounded-lg p-4 space-y-2" aria-labelledby="customer-info-heading">
          <h3 id="customer-info-heading" className="font-medium">Customer Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{order.customerEmail}</span>
            <span className="text-muted-foreground">Name</span>
            <span>{order.customerName || "-"}</span>
          </div>
        </section>

        {/* Order Info */}
        <section className="border rounded-lg p-4 space-y-2" aria-labelledby="order-details-heading">
          <h3 id="order-details-heading" className="font-medium">Order Details</h3>
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
        </section>

        {/* Payment Info */}
        <section className="border rounded-lg p-4 space-y-2" aria-labelledby="payment-info-heading">
          <h3 id="payment-info-heading" className="font-medium">Payment Information</h3>
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
        </section>

        {/* License Info */}
        {order.license && (
          <section className="border rounded-lg p-4 space-y-2" aria-labelledby="license-info-heading">
            <h3 id="license-info-heading" className="font-medium">License Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">License Status</span>
              <span>{order.license.status}</span>
              <span className="text-muted-foreground">Downloads</span>
              <span>{order.license.downloadCount}</span>
            </div>
          </section>
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
          <label htmlFor="order-status-select" className="block text-sm font-medium mb-2">
            Order: {order.orderNumber}
          </label>
          <select
            id="order-status-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Select order status"
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
        <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg" role="alert">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" aria-hidden="true" />
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
  const [error, setError] = useState<string | null>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (filters.status) params.set("status", filters.status);
      if (filters.tier) params.set("tier", filters.tier);
      if (filters.search) params.set("search", filters.search);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/orders?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.data?.items || data.data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch orders";
      setError(errorMessage);
      showError("Failed to load orders", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/orders/stats`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
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
    const loadingId = showLoading("Updating order status...");
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to update status");
      }

      // Update local state on success
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      dismissToast(loadingId);
      showSuccess("Order status updated");
    } catch (err) {
      console.error("Failed to update order status:", err);
      dismissToast(loadingId);
      showError("Failed to update order status", err instanceof Error ? err.message : undefined);
      throw err;
    }
  };

  // Handle refund
  const handleRefund = async (orderId: string) => {
    const loadingId = showLoading("Processing refund...");
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/orders/${orderId}/refund`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to process refund");
      }

      // Update local state on success
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "REFUNDED" } : o))
      );
      fetchStats();
      dismissToast(loadingId);
      showSuccess("Refund processed successfully");
    } catch (err) {
      console.error("Failed to process refund:", err);
      dismissToast(loadingId);
      showError("Failed to process refund", err instanceof Error ? err.message : undefined);
      throw err;
    }
  };

  // Handle regenerate download
  const handleRegenerateDownload = async (orderId: string) => {
    const loadingId = showLoading("Regenerating download link...");
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/orders/${orderId}/regenerate-download`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to regenerate download link");
      }

      dismissToast(loadingId);
      showSuccess("Download link regenerated successfully");
    } catch (err) {
      console.error("Failed to regenerate download link:", err);
      dismissToast(loadingId);
      showError("Failed to regenerate download link", err instanceof Error ? err.message : undefined);
    }
  };

  // Handle download package
  const handleDownloadPackage = async (orderId: string) => {
    const loadingId = showLoading("Preparing download...");
    try {
      const downloadUrl = `${API_CONFIG.BASE_URL}/orders/${orderId}/download`;

      // Use fetch to get the file with credentials
      const response = await fetch(downloadUrl, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Download failed");
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `starter-studio-${orderId}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          filename = match[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      dismissToast(loadingId);
      showSuccess("Download started");
    } catch (error) {
      console.error("Download error:", error);
      dismissToast(loadingId);
      showError("Download failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  // Handle export
  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.tier) params.set("tier", filters.tier);
    if (filters.search) params.set("search", filters.search);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    const queryString = params.toString();
    const exportUrl = `${API_CONFIG.BASE_URL}/admin/orders/export/csv${queryString ? `?${queryString}` : ""}`;
    window.location.href = exportUrl;
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
      <AdminTableSkeleton
        columns={7}
        rows={5}
        statsCount={4}
        filterCount={4}
      />
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4" role="search" aria-label="Filter orders">
        {/* Search - Full width on mobile */}
        <div className="relative w-full sm:flex-1 sm:min-w-[240px]">
          <label htmlFor="orders-search" className="sr-only">Search orders</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            id="orders-search"
            type="search"
            placeholder="Search by order number or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        {/* Filters row - Stack on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Status Filter */}
          <div className="w-full sm:w-auto">
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg bg-background sm:min-w-[150px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          <div className="w-full sm:w-auto">
            <label htmlFor="tier-filter" className="sr-only">Filter by tier</label>
            <select
              id="tier-filter"
              value={filters.tier}
              onChange={(e) => handleFilterChange("tier", e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border rounded-lg bg-background sm:min-w-[120px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range - Stack on mobile */}
        <fieldset className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <legend className="sr-only">Date range filter</legend>
          <label htmlFor="date-from" className="sr-only">From date</label>
          <input
            id="date-from"
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Start date"
          />
          <span className="hidden sm:block text-muted-foreground" aria-hidden="true">to</span>
          <label htmlFor="date-to" className="sr-only">To date</label>
          <input
            id="date-to"
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="End date"
          />
        </fieldset>
      </div>

      {/* Stats Row */}
      {stats && (
        <section aria-label="Order statistics" aria-live="polite">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total Orders"
              value={formatNumber(stats.total)}
              icon={<ShoppingCart className="h-5 w-5" aria-hidden="true" />}
              trendLabel={`${stats.completed} completed`}
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(stats.revenue)}
              icon={<DollarSign className="h-5 w-5" aria-hidden="true" />}
            />
            <StatCard
              label="Avg Order Value"
              value={formatCurrency(stats.averageOrderValue)}
              icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
            />
            <StatCard
              label="Pending Orders"
              value={formatNumber(stats.pending)}
              icon={<Clock className="h-5 w-5" aria-hidden="true" />}
              trendLabel={`${stats.refunded} refunded`}
            />
          </div>
        </section>
      )}

      {/* Data Table */}
      <div className="bg-background rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Order Number
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Tier / Template
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
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
                        <p className="text-sm truncate max-w-[200px]">{order.customerEmail}</p>
                        {order.customerName && (
                          <p className="text-xs text-muted-foreground">
                            {order.customerName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">
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
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu
                        trigger={
                          <button
                            className="p-2 hover:bg-muted rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            aria-label={`Actions for order ${order.orderNumber}`}
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
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
                            key: "download-package",
                            label: "Download Package",
                            onClick: () => handleDownloadPackage(order.id),
                            disabled: order.status !== "COMPLETED",
                          },
                          {
                            key: "regenerate-download",
                            label: "Regenerate Download Link",
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} orders
            </div>
            <nav className="flex items-center justify-center sm:justify-end gap-2" aria-label="Pagination">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="p-2 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="text-sm" aria-current="page">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Go to next page"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
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
