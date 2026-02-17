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
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import { adminApi, ApiError, type Customer as ApiCustomer, type PaginationInfo } from "@/lib/api";
import {
  Button,
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
import { AdminPageHeader, AdminFilters, AdminTableSkeleton, AdminPagination } from "@/components/admin";

// ============================================================================
// Types
// ============================================================================

interface Customer {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: number;
  totalSpent: number; // in cents
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
  template?: { name: string } | null;
  tier: string;
  license?: { status: string; downloadCount: number } | null;
}

interface CustomerStats {
  total: number;
  active: number;
  blocked: number;
  newThisMonth: number;
}

type StatusFilter = "ALL" | "ACTIVE" | "BLOCKED";
type SortBy = "createdAt" | "orderCount" | "totalSpent";
type SortOrder = "asc" | "desc";

// ============================================================================
// Status Badge Component (using shared Badge)
// ============================================================================

function CustomerStatusBadge({ isBlocked }: { isBlocked: boolean }) {
  const isActive = !isBlocked;

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

  const isBlockAction = !customer.isBlocked;

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
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isBlocking}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant={isBlockAction ? "destructive" : "default"}
                onClick={() => onConfirm(reason)}
                disabled={isBlocking}
                isLoading={isBlocking}
                className={cn(
                  "flex-1",
                  !isBlockAction && "bg-success text-success-foreground hover:bg-success/90"
                )}
              >
                {isBlockAction ? "Block Customer" : "Unblock Customer"}
              </Button>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close customer details"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-start gap-4">
            <Avatar name={customer.name || customer.email} src={customer.avatarUrl || undefined} size="xl" />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold truncate">{customer.name || "—"}</h3>
              <p className="text-muted-foreground truncate">{customer.email}</p>
              <div className="mt-2">
                <CustomerStatusBadge isBlocked={customer.isBlocked} />
              </div>
            </div>
          </div>

          {/* Blocked indicator */}
          {customer.isBlocked && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Customer is blocked
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
              <p className="font-medium">{customer.orderCount}</p>
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
                <span className="text-xs">Last Login</span>
              </div>
              <p className="font-medium">
                {customer.lastLoginAt
                  ? formatDate(customer.lastLoginAt)
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
                        {order.template?.name && ` - ${order.template.name}`}
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
            <Button
              variant={!customer.isBlocked ? "destructive" : "default"}
              onClick={() => onBlockToggle(customer)}
              className={cn(
                "w-full",
                customer.isBlocked && "bg-success text-success-foreground hover:bg-success/90"
              )}
            >
              {!customer.isBlocked ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Block Customer
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Unblock Customer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function CustomersTableSkeleton() {
  return (
    <AdminTableSkeleton
      columns={7}
      rows={5}
      statsCount={4}
      filterCount={2}
    />
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
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithOrders | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [blockDialogCustomer, setBlockDialogCustomer] =
    useState<Customer | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const itemsPerPage = 10;

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await adminApi.getCustomers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        isBlocked: statusFilter === "BLOCKED" ? true : statusFilter === "ACTIVE" ? false : undefined,
      });

      setCustomers(result.items as unknown as Customer[]);
      setPagination(result.pagination);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Calculate stats from current data (with pagination info)
  const stats: CustomerStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const total = pagination?.total || customers.length;

    return {
      total,
      active: customers.filter((c) => !c.isBlocked).length,
      blocked: customers.filter((c) => c.isBlocked).length,
      newThisMonth: customers.filter(
        (c) => new Date(c.createdAt) >= startOfMonth
      ).length,
    };
  }, [customers, pagination]);

  // Sort customers (client-side sorting of current page)
  const sortedCustomers = useMemo(() => {
    const result = [...customers];

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "orderCount":
          comparison = a.orderCount - b.orderCount;
          break;
        case "totalSpent":
          comparison = a.totalSpent - b.totalSpent;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [customers, sortBy, sortOrder]);

  // Total pages from server pagination
  const totalPages = pagination?.totalPages || 1;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Handlers
  const handleViewCustomer = useCallback(async (customer: Customer) => {
    setIsLoadingDetails(true);
    setIsDrawerOpen(true);

    try {
      const customerDetails = await adminApi.getCustomer(customer.id);
      setSelectedCustomer(customerDetails as unknown as CustomerWithOrders);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "Failed to load customer details");
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const handleBlockToggle = useCallback((customer: Customer) => {
    setBlockDialogCustomer(customer);
    setIsBlockDialogOpen(true);
  }, []);

  const handleConfirmBlockToggle = useCallback(
    async (reason: string) => {
      if (!blockDialogCustomer) return;

      setIsBlocking(true);

      try {
        const newIsBlocked = !blockDialogCustomer.isBlocked;

        if (newIsBlocked) {
          await adminApi.blockCustomer(blockDialogCustomer.id, reason);
        } else {
          await adminApi.unblockCustomer(blockDialogCustomer.id);
        }

        // Update customer in list
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === blockDialogCustomer.id
              ? { ...c, isBlocked: newIsBlocked }
              : c
          )
        );

        // Update selected customer if drawer is open
        if (selectedCustomer?.id === blockDialogCustomer.id) {
          setSelectedCustomer((prev) =>
            prev ? { ...prev, isBlocked: newIsBlocked } : null
          );
        }

        showSuccess(`Customer ${newIsBlocked ? "blocked" : "unblocked"} successfully`);
      } catch (err) {
        showError(err instanceof ApiError ? err.message : "Failed to update customer");
      } finally {
        setIsBlocking(false);
        setIsBlockDialogOpen(false);
        setBlockDialogCustomer(null);
      }
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
      <section aria-label="Customer statistics" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={stats.total}
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<UserCheck className="h-5 w-5" aria-hidden="true" />}
          variant="success"
        />
        <StatCard
          label="Blocked"
          value={stats.blocked}
          icon={<UserX className="h-5 w-5" aria-hidden="true" />}
          variant="error"
        />
        <StatCard
          label="New This Month"
          value={stats.newThisMonth}
          icon={<UserPlus className="h-5 w-5" aria-hidden="true" />}
          variant="info"
        />
      </section>

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
                { value: "orderCount", label: "Order Count" },
                { value: "totalSpent", label: "Total Spent" },
              ]}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              <ArrowUpDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  sortOrder === "asc" && "rotate-180"
                )}
              />
            </Button>
          </div>
        </AdminFilters>
      </div>

      {/* Data Table */}
      {loading ? (
        <CustomersTableSkeleton />
      ) : sortedCustomers.length === 0 ? (
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
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name || customer.email} src={customer.avatarUrl || undefined} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{customer.name || "—"}</p>
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
                      {customer.orderCount}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.lastLoginAt
                        ? formatDate(customer.lastLoginAt)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <CustomerStatusBadge isBlocked={customer.isBlocked} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewCustomer(customer)}
                          aria-label={`View details for ${customer.name || customer.email}`}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBlockToggle(customer)}
                          className={cn(
                            !customer.isBlocked
                              ? "hover:bg-destructive/10 text-destructive"
                              : "hover:bg-success/10 text-success"
                          )}
                          aria-label={
                            !customer.isBlocked
                              ? `Block ${customer.name || customer.email}`
                              : `Unblock ${customer.name || customer.email}`
                          }
                        >
                          {!customer.isBlocked ? (
                            <Ban className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={pagination?.total || sortedCustomers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="customers"
          />
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
