"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Filter,
  ArrowUpDown,
  Eye,
  Ban,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  StatCard,
  Badge,
  Avatar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Select,
  Textarea,
} from "@/components/ui";
import { EmptySearch, EmptyList } from "@/components/ui";
import { AdminPageHeader, AdminFilters } from "@/components/admin";

// ============================================================================
// Types
// ============================================================================

interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "ACTIVE" | "BLOCKED";
  createdAt: string;
  ordersCount: number;
  totalSpent: number; // in cents
  lastOrderDate: string | null;
  blockReason?: string;
}

interface CustomerWithOrders extends Customer {
  orders: Order[];
}

interface Order {
  id: string;
  orderNumber: string;
  total: number; // in cents
  status: string;
  createdAt: string;
  templateName?: string;
  tier: string;
}

interface CustomerStats {
  total: number;
  active: number;
  blocked: number;
  newThisMonth: number;
}

type StatusFilter = "ALL" | "ACTIVE" | "BLOCKED";
type SortBy = "createdAt" | "ordersCount" | "totalSpent";
type SortOrder = "asc" | "desc";

// ============================================================================
// Mock Data
// ============================================================================

const generateMockCustomers = (): Customer[] => {
  const names = [
    "John Smith",
    "Emma Wilson",
    "Michael Brown",
    "Sarah Davis",
    "James Johnson",
    "Emily Taylor",
    "David Anderson",
    "Jessica Martinez",
    "Christopher Lee",
    "Amanda White",
    "Daniel Harris",
    "Ashley Clark",
    "Matthew Lewis",
    "Jennifer Walker",
    "Andrew Hall",
    "Stephanie Allen",
    "Joshua Young",
    "Nicole King",
    "Ryan Wright",
    "Megan Scott",
  ];

  return names.map((name, index) => {
    const isBlocked = index === 3 || index === 11;
    const daysAgo = Math.floor(Math.random() * 365);
    const ordersCount = Math.floor(Math.random() * 15);
    const totalSpent = ordersCount * (Math.floor(Math.random() * 20000) + 5000);
    const hasOrders = ordersCount > 0;
    const lastOrderDaysAgo = hasOrders ? Math.floor(Math.random() * 60) : null;

    return {
      id: `cust_${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      avatar: undefined,
      status: isBlocked ? "BLOCKED" : "ACTIVE",
      createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      ordersCount,
      totalSpent,
      lastOrderDate: lastOrderDaysAgo
        ? new Date(Date.now() - lastOrderDaysAgo * 86400000).toISOString()
        : null,
      blockReason: isBlocked ? "Suspicious activity detected" : undefined,
    };
  });
};

const generateMockOrders = (customerId: string): Order[] => {
  const count = Math.floor(Math.random() * 5) + 1;
  const tiers = ["Starter", "Pro", "Business"];
  const statuses = ["COMPLETED", "PENDING", "PROCESSING"];
  const templates = ["LMS", "SaaS", "E-commerce", "Portfolio", "Blog"];

  return Array.from({ length: count }, (_, i) => ({
    id: `order_${customerId}_${i + 1}`,
    orderNumber: `ORD-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
    total: Math.floor(Math.random() * 30000) + 5000,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(
      Date.now() - Math.floor(Math.random() * 90) * 86400000
    ).toISOString(),
    templateName: templates[Math.floor(Math.random() * templates.length)],
    tier: tiers[Math.floor(Math.random() * tiers.length)],
  }));
};

const mockCustomers = generateMockCustomers();

// ============================================================================
// Status Badge Component (using shared Badge)
// ============================================================================

function CustomerStatusBadge({ status }: { status: "ACTIVE" | "BLOCKED" }) {
  const isActive = status === "ACTIVE";

  return (
    <Badge
      variant={isActive ? "success" : "destructive"}
      className="inline-flex items-center gap-1"
    >
      {isActive ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <Ban className="h-3 w-3" />
      )}
      {isActive ? "Active" : "Blocked"}
    </Badge>
  );
}

// ============================================================================
// Order Status Badge Component
// ============================================================================

function OrderStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "success" | "warning" | "default" | "destructive" | "secondary"> = {
    COMPLETED: "success",
    PENDING: "warning",
    PROCESSING: "default",
    FAILED: "destructive",
    REFUNDED: "secondary",
  };

  return (
    <Badge variant={variantMap[status] || "secondary"}>
      {status}
    </Badge>
  );
}

// ============================================================================
// Block Confirmation Dialog Component
// ============================================================================

function BlockConfirmDialog({
  customer,
  isOpen,
  onClose,
  onConfirm,
  isBlocking,
}: {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isBlocking: boolean;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const isBlockAction = customer.status === "ACTIVE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
              isBlockAction ? "bg-destructive/10" : "bg-success/10"
            )}
          >
            {isBlockAction ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle className="h-5 w-5 text-success" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {isBlockAction ? "Block Customer" : "Unblock Customer"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isBlockAction
                ? `Are you sure you want to block ${customer.name}? They will no longer be able to make purchases.`
                : `Are you sure you want to unblock ${customer.name}? They will be able to make purchases again.`}
            </p>

            {isBlockAction && (
              <div className="mt-4">
                <label
                  htmlFor="block-reason"
                  className="text-sm font-medium block mb-1.5"
                >
                  Reason (optional)
                </label>
                <Textarea
                  id="block-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for blocking..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isBlocking}
                className="flex-1 px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(reason)}
                disabled={isBlocking}
                className={cn(
                  "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                  isBlockAction
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-success text-success-foreground hover:bg-success/90"
                )}
              >
                {isBlocking && <Loader2 className="h-4 w-4 animate-spin" />}
                {isBlockAction ? "Block Customer" : "Unblock Customer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Customer Details Drawer Component
// ============================================================================

function CustomerDetailsDrawer({
  customer,
  isOpen,
  onClose,
  onBlockToggle,
}: {
  customer: CustomerWithOrders | null;
  isOpen: boolean;
  onClose: () => void;
  onBlockToggle: (customer: Customer) => void;
}) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-background w-full max-w-lg h-full overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Customer Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-start gap-4">
            <Avatar name={customer.name} src={customer.avatar} size="xl" />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold truncate">{customer.name}</h3>
              <p className="text-muted-foreground truncate">{customer.email}</p>
              <div className="mt-2">
                <CustomerStatusBadge status={customer.status} />
              </div>
            </div>
          </div>

          {/* Block Reason */}
          {customer.status === "BLOCKED" && customer.blockReason && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Block Reason
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {customer.blockReason}
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Registered</span>
              </div>
              <p className="font-medium">{formatDate(customer.createdAt)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-xs">Total Orders</span>
              </div>
              <p className="font-medium">{customer.ordersCount}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Spent</span>
              </div>
              <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Last Order</span>
              </div>
              <p className="font-medium">
                {customer.lastOrderDate
                  ? formatDate(customer.lastOrderDate)
                  : "Never"}
              </p>
            </div>
          </div>

          {/* Order History */}
          <div>
            <h4 className="font-semibold mb-3">Order History</h4>
            {customer.orders.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-muted/50 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.tier}
                        {order.templateName && ` - ${order.templateName}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(order.total)}
                      </p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-4">
            <button
              onClick={() => onBlockToggle(customer)}
              className={cn(
                "w-full px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
                customer.status === "ACTIVE"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-success text-success-foreground hover:bg-success/90"
              )}
            >
              {customer.status === "ACTIVE" ? (
                <>
                  <Ban className="h-4 w-4" />
                  Block Customer
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Unblock Customer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-background rounded-lg border animate-pulse"
        >
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-3 bg-muted rounded w-48" />
          </div>
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-6 bg-muted rounded-full w-16" />
          <div className="h-8 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function CustomersPage() {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithOrders | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [blockDialogCustomer, setBlockDialogCustomer] =
    useState<Customer | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const itemsPerPage = 10;

  // Fetch customers (mock)
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCustomers(mockCustomers);
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  // Calculate stats
  const stats: CustomerStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: customers.length,
      active: customers.filter((c) => c.status === "ACTIVE").length,
      blocked: customers.filter((c) => c.status === "BLOCKED").length,
      newThisMonth: customers.filter(
        (c) => new Date(c.createdAt) >= startOfMonth
      ).length,
    };
  }, [customers]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "ordersCount":
          comparison = a.ordersCount - b.ordersCount;
          break;
        case "totalSpent":
          comparison = a.totalSpent - b.totalSpent;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [customers, searchQuery, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy, sortOrder]);

  // Handlers
  const handleViewCustomer = useCallback(async (customer: Customer) => {
    setIsLoadingDetails(true);
    setIsDrawerOpen(true);

    // Simulate API call to fetch customer details with orders
    await new Promise((resolve) => setTimeout(resolve, 300));

    const orders = generateMockOrders(customer.id);
    setSelectedCustomer({ ...customer, orders });
    setIsLoadingDetails(false);
  }, []);

  const handleBlockToggle = useCallback((customer: Customer) => {
    setBlockDialogCustomer(customer);
    setIsBlockDialogOpen(true);
  }, []);

  const handleConfirmBlockToggle = useCallback(
    async (reason: string) => {
      if (!blockDialogCustomer) return;

      setIsBlocking(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newStatus =
        blockDialogCustomer.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";

      // Update customer in list
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === blockDialogCustomer.id
            ? {
                ...c,
                status: newStatus,
                blockReason: newStatus === "BLOCKED" ? reason || undefined : undefined,
              }
            : c
        )
      );

      // Update selected customer if drawer is open
      if (selectedCustomer?.id === blockDialogCustomer.id) {
        setSelectedCustomer((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                blockReason: newStatus === "BLOCKED" ? reason || undefined : undefined,
              }
            : null
        );
      }

      setIsBlocking(false);
      setIsBlockDialogOpen(false);
      setBlockDialogCustomer(null);
    },
    [blockDialogCustomer, selectedCustomer]
  );

  const handleSortChange = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "ALL";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Customers"
        description="Manage and monitor your customer base"
      />

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<UserCheck className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          label="Blocked"
          value={stats.blocked}
          icon={<UserX className="h-5 w-5" />}
          variant="error"
        />
        <StatCard
          label="New This Month"
          value={stats.newThisMonth}
          icon={<UserPlus className="h-5 w-5" />}
          variant="info"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-background rounded-lg border p-4">
        <AdminFilters
          search={searchQuery}
          searchPlaceholder="Search by name or email..."
          onSearchChange={setSearchQuery}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        >
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={[
                { value: "ALL", label: "All Status" },
                { value: "ACTIVE", label: "Active" },
                { value: "BLOCKED", label: "Blocked" },
              ]}
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortBy}
              onChange={(value) => handleSortChange(value as SortBy)}
              options={[
                { value: "createdAt", label: "Registration Date" },
                { value: "ordersCount", label: "Order Count" },
                { value: "totalSpent", label: "Total Spent" },
              ]}
            />
            <button
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="p-2 border rounded-md hover:bg-accent transition-colors"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              <ArrowUpDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  sortOrder === "asc" && "rotate-180"
                )}
              />
            </button>
          </div>
        </AdminFilters>
      </div>

      {/* Data Table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredCustomers.length === 0 ? (
        hasActiveFilters ? (
          <EmptySearch
            searchQuery={searchQuery}
            action={{
              label: "Clear filters",
              onClick: handleClearFilters,
              variant: "outline",
            }}
          />
        ) : (
          <EmptyList
            title="No customers yet"
            description="When customers make their first purchase, they will appear here."
          />
        )
      ) : (
        <div className="bg-background rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} src={customer.avatar} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{customer.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.ordersCount}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.lastOrderDate
                        ? formatDate(customer.lastOrderDate)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <CustomerStatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="p-2 hover:bg-accent rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleBlockToggle(customer)}
                          className={cn(
                            "p-2 rounded-md transition-colors",
                            customer.status === "ACTIVE"
                              ? "hover:bg-destructive/10 text-destructive"
                              : "hover:bg-success/10 text-success"
                          )}
                          title={
                            customer.status === "ACTIVE" ? "Block" : "Unblock"
                          }
                        >
                          {customer.status === "ACTIVE" ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}{" "}
                of {filteredCustomers.length} customers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm px-3 py-1 bg-muted rounded-md">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Details Drawer */}
      <CustomerDetailsDrawer
        customer={selectedCustomer}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCustomer(null);
        }}
        onBlockToggle={handleBlockToggle}
      />

      {/* Block Confirmation Dialog */}
      <BlockConfirmDialog
        customer={blockDialogCustomer}
        isOpen={isBlockDialogOpen}
        onClose={() => {
          setIsBlockDialogOpen(false);
          setBlockDialogCustomer(null);
        }}
        onConfirm={handleConfirmBlockToggle}
        isBlocking={isBlocking}
      />
    </div>
  );
}
