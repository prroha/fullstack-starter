"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Ticket,
  Percent,
  DollarSign,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  Checkbox,
  Switch,
  Label,
  Badge,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  DialogBody,
  DialogFooter,
  EmptySearch,
  EmptyList,
} from "@/components/ui";
import { AdminPageHeader, AdminFilters, TierBadge, TableSkeleton } from "@/components/admin";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { API_CONFIG } from "@/lib/constants";
import { showError, showSuccess, showLoading, dismissToast } from "@/lib/toast";

// =============================================================================
// Types
// =============================================================================

type DiscountType = "PERCENTAGE" | "FIXED";
type CouponStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

interface Coupon {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // percentage (0-100) or cents for fixed
  maxUses: number | null; // null = unlimited
  usedCount: number;
  minPurchase: number | null; // in cents, null = no minimum
  applicableTiers: string[];
  applicableTemplates: string[];
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CouponFormData {
  code: string;
  type: DiscountType;
  value: number;
  maxUses: number;
  minPurchase: number;
  applicableTiers: string[];
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface CouponStats {
  total: number;
  active: number;
  totalRedemptions: number;
  totalDiscountGiven: number; // in cents
}

// =============================================================================
// Constants
// =============================================================================

const AVAILABLE_TIERS = ["Starter", "Pro", "Business", "Enterprise"];

const DISCOUNT_TYPE_OPTIONS = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED", label: "Fixed Amount" },
];

const TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED", label: "Fixed" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "EXPIRED", label: "Expired" },
];

const INITIAL_FORM_DATA: CouponFormData = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  maxUses: 0,
  minPurchase: 0,
  applicableTiers: [],
  startsAt: new Date().toISOString().split("T")[0],
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  isActive: true,
};


// =============================================================================
// Helper Functions
// =============================================================================

function getCouponStatus(coupon: Coupon): CouponStatus {
  const now = new Date();
  if (coupon.expiresAt) {
    const expiresAt = new Date(coupon.expiresAt);
    if (expiresAt < now) return "EXPIRED";
  }
  if (!coupon.isActive) return "INACTIVE";
  return "ACTIVE";
}

function formatDiscountValue(coupon: Coupon): string {
  if (coupon.type === "PERCENTAGE") {
    return `${coupon.value}%`;
  }
  return formatCurrency(coupon.value);
}

function formatUsage(coupon: Coupon): string {
  if (coupon.maxUses === null) {
    return `${formatNumber(coupon.usedCount)} / Unlimited`;
  }
  return `${formatNumber(coupon.usedCount)} / ${formatNumber(coupon.maxUses)}`;
}

// =============================================================================
// Sub-Components
// =============================================================================

// Copy Button Component
function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-accent rounded-md transition-colors"
      title="Copy code"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: CouponStatus }) {
  const variants: Record<CouponStatus, "success" | "secondary" | "destructive"> = {
    ACTIVE: "success",
    INACTIVE: "secondary",
    EXPIRED: "destructive",
  };

  const labels: Record<CouponStatus, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    EXPIRED: "Expired",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

// Type Badge Component
function TypeBadge({ type }: { type: DiscountType }) {
  return (
    <Badge variant={type === "PERCENTAGE" ? "default" : "outline"}>
      {type === "PERCENTAGE" ? (
        <Percent className="h-3 w-3 mr-1" />
      ) : (
        <DollarSign className="h-3 w-3 mr-1" />
      )}
      {type === "PERCENTAGE" ? "Percentage" : "Fixed"}
    </Badge>
  );
}

// Helper to format date for display (handles null dates)
function formatCouponDate(dateString: string | null): string {
  if (!dateString) return "No limit";
  return formatDate(dateString);
}

// Tier Badges Component
function TierBadges({ tiers }: { tiers: string[] }) {
  if (tiers.length === AVAILABLE_TIERS.length) {
    return <span className="text-sm text-muted-foreground">All Tiers</span>;
  }

  if (tiers.length === 0) {
    return <span className="text-sm text-muted-foreground">None</span>;
  }

  if (tiers.length <= 2) {
    return (
      <div className="flex flex-wrap gap-1">
        {tiers.map((tier) => (
          <TierBadge key={tier} tier={tier} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tiers.slice(0, 2).map((tier) => (
        <TierBadge key={tier} tier={tier} />
      ))}
      <span className="text-xs text-muted-foreground">+{tiers.length - 2} more</span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function CouponsPage() {
  // State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch coupons from API
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter === "ACTIVE") params.set("isActive", "true");
      if (statusFilter === "INACTIVE") params.set("isActive", "false");

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/coupons?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch coupons");
      }

      const data = await response.json();
      setCoupons(data.data?.items || data.data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch coupons";
      setError(errorMessage);
      showError("Failed to load coupons", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter, statusFilter]);

  // Load coupons on mount and when filters change
  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Computed Stats (calculated from loaded data)
  const stats: CouponStats = useMemo(() => {
    const activeCoupons = coupons.filter(
      (c) => getCouponStatus(c) === "ACTIVE"
    );
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.usedCount, 0);
    const totalDiscountGiven = coupons.reduce((sum, c) => {
      // Rough calculation - in real app this would come from orders
      if (c.type === "FIXED") {
        return sum + c.value * c.usedCount;
      }
      // For percentage, assume average order of $100
      return sum + (c.value / 100) * 10000 * c.usedCount;
    }, 0);

    return {
      total: pagination.total || coupons.length,
      active: activeCoupons.length,
      totalRedemptions,
      totalDiscountGiven,
    };
  }, [coupons, pagination.total]);

  // Check if filters are active
  const hasActiveFilters = !!search || typeFilter !== "ALL" || statusFilter !== "ALL";

  // Clear filters
  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle search/filter changes - reset to page 1
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData(INITIAL_FORM_DATA);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value:
        coupon.type === "FIXED"
          ? coupon.value / 100
          : coupon.value,
      maxUses: coupon.maxUses ?? 0,
      minPurchase: coupon.minPurchase ? coupon.minPurchase / 100 : 0,
      applicableTiers: coupon.applicableTiers,
      startsAt: coupon.startsAt ? coupon.startsAt.split("T")[0] : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setFormData(INITIAL_FORM_DATA);
  };

  // Save coupon (create or update)
  const handleSaveCoupon = async () => {
    setIsSaving(true);
    const loadingId = showLoading(editingCoupon ? "Updating coupon..." : "Creating coupon...");

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value:
          formData.type === "FIXED"
            ? Math.round(formData.value * 100)
            : formData.value,
        maxUses: formData.maxUses === 0 ? null : formData.maxUses,
        minPurchase:
          formData.minPurchase === 0 ? null : Math.round(formData.minPurchase * 100),
        applicableTiers: formData.applicableTiers,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        isActive: formData.isActive,
      };

      const url = editingCoupon
        ? `${API_CONFIG.BASE_URL}/admin/coupons/${editingCoupon.id}`
        : `${API_CONFIG.BASE_URL}/admin/coupons`;
      const method = editingCoupon ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to ${editingCoupon ? "update" : "create"} coupon`);
      }

      dismissToast(loadingId);
      showSuccess(editingCoupon ? "Coupon updated successfully" : "Coupon created successfully");
      handleCloseModal();
      fetchCoupons(); // Refresh the list
    } catch (err) {
      console.error("Failed to save coupon:", err);
      dismissToast(loadingId);
      showError(
        `Failed to ${editingCoupon ? "update" : "create"} coupon`,
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (coupon: Coupon) => {
    setDeletingCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingCoupon(null);
  };

  // Delete coupon
  const handleDeleteCoupon = async () => {
    if (!deletingCoupon) return;

    setIsSaving(true);
    const loadingId = showLoading("Deleting coupon...");

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/admin/coupons/${deletingCoupon.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to delete coupon");
      }

      dismissToast(loadingId);
      showSuccess("Coupon deleted successfully");
      handleCloseDeleteDialog();
      fetchCoupons(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete coupon:", err);
      dismissToast(loadingId);
      showError(
        "Failed to delete coupon",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle tier in form
  const handleToggleTier = (tier: string) => {
    setFormData((prev) => ({
      ...prev,
      applicableTiers: prev.applicableTiers.includes(tier)
        ? prev.applicableTiers.filter((t) => t !== tier)
        : [...prev.applicableTiers, tier],
    }));
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Coupons"
        description="Manage discount codes and promotions"
        actions={
          <Button onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Coupon
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Coupons"
          value={formatNumber(stats.total)}
          icon={<Ticket className="h-5 w-5" />}
          isLoading={loading}
        />
        <StatCard
          label="Active"
          value={formatNumber(stats.active)}
          icon={<Check className="h-5 w-5" />}
          variant="success"
          isLoading={loading}
        />
        <StatCard
          label="Total Redemptions"
          value={formatNumber(stats.totalRedemptions)}
          icon={<RotateCcw className="h-5 w-5" />}
          isLoading={loading}
        />
        <StatCard
          label="Total Discount Given"
          value={formatCurrency(stats.totalDiscountGiven)}
          icon={<DollarSign className="h-5 w-5" />}
          isLoading={loading}
        />
      </div>

      {/* Filter Bar */}
      <AdminFilters
        search={search}
        searchPlaceholder="Search by code..."
        onSearchChange={handleSearchChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <Select
          value={typeFilter}
          onChange={handleTypeFilterChange}
          options={TYPE_FILTER_OPTIONS}
          className="w-40"
        />
        <Select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          options={STATUS_FILTER_OPTIONS}
          className="w-40"
        />
      </AdminFilters>

      {/* Data Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <TableSkeleton rows={5} columns={8} showHeader showFilters={false} />
        ) : coupons.length === 0 ? (
          <div className="p-6">
            {hasActiveFilters ? (
              <EmptySearch
                searchQuery={search}
                action={{
                  label: "Clear filters",
                  onClick: handleClearFilters,
                  variant: "outline",
                }}
              />
            ) : (
              <EmptyList
                title="No coupons found"
                description="Create your first coupon to start offering discounts."
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Applicable Tiers</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {coupon.code}
                        </code>
                        <CopyCodeButton code={coupon.code} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={coupon.type} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatDiscountValue(coupon)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatUsage(coupon)}</span>
                    </TableCell>
                    <TableCell>
                      <TierBadges tiers={coupon.applicableTiers} />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatCouponDate(coupon.startsAt)}</div>
                        <div className="text-muted-foreground">
                          to {formatCouponDate(coupon.expiresAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getCouponStatus(coupon)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(coupon)}
                          title="Edit coupon"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDeleteDialog(coupon)}
                          title="Delete coupon"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCoupon ? "Edit Coupon" : "Create Coupon"}
        size="lg"
      >
        <DialogBody className="space-y-4">
          {/* Code */}
          <div className="space-y-2">
            <Label required>Code</Label>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g., WELCOME20"
              className="font-mono uppercase"
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={formData.type}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as DiscountType,
                  }))
                }
                options={DISCOUNT_TYPE_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Discount Value{" "}
                {formData.type === "PERCENTAGE" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                min={0}
                max={formData.type === "PERCENTAGE" ? 100 : undefined}
                value={formData.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    value: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* Max Uses & Min Purchase */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maximum Uses</Label>
              <Input
                type="number"
                min={0}
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxUses: Number(e.target.value),
                  }))
                }
                placeholder="0 = Unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for unlimited uses
              </p>
            </div>
            <div className="space-y-2">
              <Label>Minimum Purchase ($)</Label>
              <Input
                type="number"
                min={0}
                value={formData.minPurchase}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minPurchase: Number(e.target.value),
                  }))
                }
                placeholder="0 = No minimum"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for no minimum
              </p>
            </div>
          </div>

          {/* Applicable Tiers */}
          <div className="space-y-2">
            <Label>Applicable Tiers</Label>
            <div className="flex flex-wrap gap-4">
              {AVAILABLE_TIERS.map((tier) => (
                <Checkbox
                  key={tier}
                  label={tier}
                  checked={formData.applicableTiers.includes(tier)}
                  onChange={() => handleToggleTier(tier)}
                />
              ))}
            </div>
          </div>

          {/* Valid Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Starts At</Label>
              <Input
                type="date"
                value={formData.startsAt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startsAt: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no start date limit
              </p>
            </div>
            <div className="space-y-2">
              <Label>Expires At</Label>
              <Input
                type="date"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expiresAt: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration
              </p>
            </div>
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable this coupon for use
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveCoupon}
            isLoading={isSaving}
            disabled={
              !formData.code ||
              formData.value <= 0
            }
          >
            {editingCoupon ? "Save Changes" : "Create Coupon"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title="Delete Coupon"
        size="sm"
      >
        <DialogBody>
          <p>
            Are you sure you want to delete the coupon{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded">
              {deletingCoupon?.code}
            </code>
            ?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This action cannot be undone. Any active promotions using this
            coupon will stop working immediately.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDeleteDialog}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteCoupon}
            isLoading={isSaving}
          >
            Delete Coupon
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
