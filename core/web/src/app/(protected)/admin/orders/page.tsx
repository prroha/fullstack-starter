"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Button,
  Input,
  Badge,
  SkeletonTable,
  ExportCsvButton,
  Text,
  Select,
  Modal,
  Label,
  Icon,
} from "@/components/ui";
import { Alert } from "@/components/feedback";
import { EmptySearch, EmptyList } from "@/components/shared";
import { toast } from "sonner";
import { api, Order, OrderStatus, OrderStats } from "@/lib/api";
import type { PaginationInfo } from "@/types/api";

// =====================================================
// Utility Functions
// =====================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =====================================================
// Stats Card Component
// =====================================================

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Status Badge Component
// =====================================================

const statusConfig: Record<
  OrderStatus,
  { variant: "default" | "secondary" | "destructive" | "warning" | "success"; label: string }
> = {
  PENDING: { variant: "warning", label: "Pending" },
  COMPLETED: { variant: "success", label: "Completed" },
  REFUNDED: { variant: "secondary", label: "Refunded" },
  FAILED: { variant: "destructive", label: "Failed" },
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// =====================================================
// Order Row Component
// =====================================================

function OrderRow({
  order,
  onViewDetails,
}: {
  order: Order;
  onViewDetails: (order: Order) => void;
}) {
  const itemsSummary =
    order.items.length === 1
      ? order.items[0].name
      : `${order.items[0].name} +${order.items.length - 1} more`;

  return (
    <tr
      className="border-b hover:bg-muted/50 cursor-pointer"
      onClick={() => onViewDetails(order)}
    >
      <td className="px-4 py-3">
        <Text className="font-medium font-mono text-sm">{order.orderNumber}</Text>
      </td>
      <td className="px-4 py-3">
        <div>
          <Text as="p" className="font-medium">
            {order.customer.name}
          </Text>
          <Text variant="caption" color="muted">
            {order.customer.email}
          </Text>
        </div>
      </td>
      <td className="px-4 py-3">
        <Text size="sm" color="muted">
          {itemsSummary}
        </Text>
      </td>
      <td className="px-4 py-3">
        <Text className="font-medium">{formatCurrency(order.total)}</Text>
      </td>
      <td className="px-4 py-3">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="px-4 py-3">
        <Text variant="caption" color="muted">
          {formatDate(order.createdAt)}
        </Text>
      </td>
    </tr>
  );
}

// =====================================================
// Order Details Modal
// =====================================================

function OrderDetailsModal({
  order,
  onClose,
  onStatusUpdate,
  isUpdating,
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  isUpdating: boolean;
}) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);

  const statusOptions = [
    { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "REFUNDED", label: "Refunded" },
    { value: "FAILED", label: "Failed" },
  ];

  const handleStatusChange = () => {
    if (newStatus !== order.status) {
      onStatusUpdate(order.id, newStatus);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Order ${order.orderNumber}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleStatusChange}
            isLoading={isUpdating}
            disabled={newStatus === order.status}
          >
            Update Status
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="User" size="sm" />
            <Text as="span" className="font-medium">
              Customer Information
            </Text>
          </div>
          <div className="pl-6 space-y-1">
            <Text as="p" size="sm">
              <Text as="span" color="muted">
                Name:
              </Text>{" "}
              {order.customer.name}
            </Text>
            <Text as="p" size="sm">
              <Text as="span" color="muted">
                Email:
              </Text>{" "}
              {order.customer.email}
            </Text>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="Package" size="sm" />
            <Text as="span" className="font-medium">
              Items
            </Text>
          </div>
          <div className="pl-6">
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="CreditCard" size="sm" />
            <Text as="span" className="font-medium">
              Payment Details
            </Text>
          </div>
          <div className="pl-6 space-y-1">
            <Text as="p" size="sm">
              <Text as="span" color="muted">
                Method:
              </Text>{" "}
              {order.paymentMethod || "N/A"}
            </Text>
            {order.paymentId && (
              <Text as="p" size="sm">
                <Text as="span" color="muted">
                  Transaction ID:
                </Text>{" "}
                <span className="font-mono">{order.paymentId}</span>
              </Text>
            )}
            <Text as="p" size="sm">
              <Text as="span" color="muted">
                Created:
              </Text>{" "}
              {formatDateTime(order.createdAt)}
            </Text>
            <Text as="p" size="sm">
              <Text as="span" color="muted">
                Updated:
              </Text>{" "}
              {formatDateTime(order.updatedAt)}
            </Text>
          </div>
        </div>

        {/* Status Update */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="RefreshCw" size="sm" />
            <Text as="span" className="font-medium">
              Update Status
            </Text>
          </div>
          <div className="pl-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="status-select">Current:</Label>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex-1">
                <Select
                  options={statusOptions}
                  value={newStatus}
                  onChange={(value) => setNewStatus(value as OrderStatus)}
                  placeholder="Select new status"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// =====================================================
// Pagination Component
// =====================================================

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) =>
      p === 1 ||
      p === pagination.totalPages ||
      Math.abs(p - pagination.page) <= 1
  );

  return (
    <div className="flex items-center justify-between px-2">
      <Text variant="caption" color="muted">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total} orders
      </Text>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrev}
        >
          Previous
        </Button>
        {visiblePages.map((page, index) => {
          const prevPage = visiblePages[index - 1];
          const showEllipsis = prevPage && page - prevPage > 1;

          return (
            <div key={page} className="flex items-center">
              {showEllipsis && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              <Button
                variant={page === pagination.page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-9"
              >
                {page}
              </Button>
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// Main Admin Orders Page
// =====================================================

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.getOrderStats();
        if (response.data) {
          setStats(response.data);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    loadStats();
  }, []);

  const loadOrders = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getOrders({
          page,
          limit: 10,
          status: statusFilter || undefined,
          search: searchDebounced || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        setOrders(response.data?.items || []);
        setPagination(response.data?.pagination || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    },
    [searchDebounced, statusFilter, startDate, endDate]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handlePageChange = (page: number) => {
    loadOrders(page);
  };

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      setIsUpdating(true);
      const response = await api.updateOrderStatus(orderId, status);
      if (response.data?.order) {
        const updatedOrder = response.data.order;
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updatedOrder : o))
        );
        setSelectedOrder(updatedOrder);
        toast.success(`Order status updated to ${statusConfig[status].label}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCsv = async () => {
    // Generate CSV content
    const headers = ["Order ID", "Customer", "Email", "Items", "Total", "Status", "Date"];
    const rows = orders.map((order) => [
      order.orderNumber,
      order.customer.name,
      order.customer.email,
      order.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
      order.total.toFixed(2),
      order.status,
      formatDate(order.createdAt),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearch("");
    setSearchDebounced("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = searchDebounced || statusFilter || startDate || endDate;

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "REFUNDED", label: "Refunded" },
    { value: "FAILED", label: "Failed" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <Text color="muted">Manage orders and revenue</Text>
        </div>
        <ExportCsvButton
          label="Export Orders"
          onExport={handleExportCsv}
          onSuccess={() => toast.success("Orders exported successfully")}
          onError={(error) => toast.error(error.message || "Export failed")}
        />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            description="All time earnings"
            icon={<Icon name="DollarSign" size="md" />}
          />
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            description="All orders placed"
            icon={<Icon name="ShoppingCart" size="md" />}
          />
          <StatsCard
            title="Avg Order Value"
            value={formatCurrency(stats.avgOrderValue)}
            description="Per order average"
            icon={<Icon name="TrendingUp" size="md" />}
          />
          <StatsCard
            title="Recent Orders"
            value={stats.recentOrders}
            description="Last 7 days"
            icon={<Icon name="Clock" size="md" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="search"
              placeholder="Search by order ID, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as "" | OrderStatus)}
            />
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">From:</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">To:</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Orders Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={10} columns={6} />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6">
            {hasActiveFilters ? (
              <EmptySearch
                searchQuery={searchDebounced}
                action={{
                  label: "Clear filters",
                  onClick: clearFilters,
                  variant: "outline",
                }}
              />
            ) : (
              <EmptyList
                title="No orders yet"
                description="Orders will appear here once customers start making purchases."
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onViewDetails={setSelectedOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t p-4">
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}
