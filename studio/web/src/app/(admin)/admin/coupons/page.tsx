"use client";

import { useState, useEffect, useMemo } from "react";
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
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

type DiscountType = "PERCENTAGE" | "FIXED";
type CouponStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number; // percentage (0-100) or cents for fixed
  maxUses: number | null; // null = unlimited
  usedCount: number;
  minPurchase: number | null; // in cents, null = no minimum
  applicableTiers: string[];
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CouponFormData {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number;
  minPurchase: number;
  applicableTiers: string[];
  validFrom: string;
  validUntil: string;
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
  discountType: "PERCENTAGE",
  discountValue: 10,
  maxUses: 0,
  minPurchase: 0,
  applicableTiers: [],
  validFrom: new Date().toISOString().split("T")[0],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  isActive: true,
};

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_COUPONS: Coupon[] = [
  {
    id: "1",
    code: "WELCOME20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxUses: 100,
    usedCount: 45,
    minPurchase: 5000, // $50
    applicableTiers: ["Starter", "Pro"],
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    code: "SAVE10",
    discountType: "FIXED",
    discountValue: 1000, // $10
    maxUses: null,
    usedCount: 234,
    minPurchase: null,
    applicableTiers: ["Starter", "Pro", "Business", "Enterprise"],
    validFrom: "2024-01-01",
    validUntil: "2024-06-30",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    code: "BUSINESS50",
    discountType: "PERCENTAGE",
    discountValue: 50,
    maxUses: 10,
    usedCount: 10,
    minPurchase: 10000, // $100
    applicableTiers: ["Business", "Enterprise"],
    validFrom: "2024-01-01",
    validUntil: "2024-03-31",
    isActive: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    code: "HOLIDAY25",
    discountType: "PERCENTAGE",
    discountValue: 25,
    maxUses: 500,
    usedCount: 123,
    minPurchase: null,
    applicableTiers: ["Starter", "Pro", "Business"],
    validFrom: "2023-12-01",
    validUntil: "2023-12-31",
    isActive: false,
    createdAt: "2023-12-01T00:00:00Z",
    updatedAt: "2023-12-31T00:00:00Z",
  },
  {
    id: "5",
    code: "ENTERPRISE100",
    discountType: "FIXED",
    discountValue: 10000, // $100
    maxUses: 5,
    usedCount: 2,
    minPurchase: 50000, // $500
    applicableTiers: ["Enterprise"],
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

function getCouponStatus(coupon: Coupon): CouponStatus {
  const now = new Date();
  const validUntil = new Date(coupon.validUntil);

  if (validUntil < now) return "EXPIRED";
  if (!coupon.isActive) return "INACTIVE";
  return "ACTIVE";
}

function formatDiscountValue(coupon: Coupon): string {
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountValue}%`;
  }
  return formatCurrency(coupon.discountValue);
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);

  // Load coupons (mock data for now)
  useEffect(() => {
    const loadCoupons = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCoupons(MOCK_COUPONS);
      setLoading(false);
    };

    loadCoupons();
  }, []);

  // Computed Stats
  const stats: CouponStats = useMemo(() => {
    const activeCoupons = coupons.filter(
      (c) => getCouponStatus(c) === "ACTIVE"
    );
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.usedCount, 0);
    const totalDiscountGiven = coupons.reduce((sum, c) => {
      // Rough calculation - in real app this would come from orders
      if (c.discountType === "FIXED") {
        return sum + c.discountValue * c.usedCount;
      }
      // For percentage, assume average order of $100
      return sum + (c.discountValue / 100) * 10000 * c.usedCount;
    }, 0);

    return {
      total: coupons.length,
      active: activeCoupons.length,
      totalRedemptions,
      totalDiscountGiven,
    };
  }, [coupons]);

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      // Search filter
      if (
        search &&
        !coupon.code.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (typeFilter !== "ALL" && coupon.discountType !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        const status = getCouponStatus(coupon);
        if (status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [coupons, search, typeFilter, statusFilter]);

  // Check if filters are active
  const hasActiveFilters = !!search || typeFilter !== "ALL" || statusFilter !== "ALL";

  // Clear filters
  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
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
      discountType: coupon.discountType,
      discountValue:
        coupon.discountType === "FIXED"
          ? coupon.discountValue / 100
          : coupon.discountValue,
      maxUses: coupon.maxUses ?? 0,
      minPurchase: coupon.minPurchase ? coupon.minPurchase / 100 : 0,
      applicableTiers: coupon.applicableTiers,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
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

  // Save coupon
  const handleSaveCoupon = async () => {
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const couponData: Omit<Coupon, "id" | "createdAt" | "updatedAt"> = {
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue:
        formData.discountType === "FIXED"
          ? formData.discountValue * 100
          : formData.discountValue,
      maxUses: formData.maxUses === 0 ? null : formData.maxUses,
      usedCount: editingCoupon?.usedCount ?? 0,
      minPurchase:
        formData.minPurchase === 0 ? null : formData.minPurchase * 100,
      applicableTiers: formData.applicableTiers,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      isActive: formData.isActive,
    };

    if (editingCoupon) {
      // Update existing coupon
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                ...couponData,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    } else {
      // Create new coupon
      const newCoupon: Coupon = {
        ...couponData,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCoupons((prev) => [newCoupon, ...prev]);
    }

    setIsSaving(false);
    handleCloseModal();
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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setCoupons((prev) => prev.filter((c) => c.id !== deletingCoupon.id));

    setIsSaving(false);
    handleCloseDeleteDialog();
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
        onSearchChange={setSearch}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      >
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_FILTER_OPTIONS}
          className="w-40"
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
          className="w-40"
        />
      </AdminFilters>

      {/* Data Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <TableSkeleton rows={5} columns={8} showHeader showFilters={false} />
        ) : filteredCoupons.length === 0 ? (
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
                {filteredCoupons.map((coupon) => (
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
                      <TypeBadge type={coupon.discountType} />
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
                        <div>{formatDate(coupon.validFrom)}</div>
                        <div className="text-muted-foreground">
                          to {formatDate(coupon.validUntil)}
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
                value={formData.discountType}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    discountType: value as DiscountType,
                  }))
                }
                options={DISCOUNT_TYPE_OPTIONS}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Discount Value{" "}
                {formData.discountType === "PERCENTAGE" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                min={0}
                max={formData.discountType === "PERCENTAGE" ? 100 : undefined}
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    discountValue: Number(e.target.value),
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
              <Label>Valid From</Label>
              <Input
                type="date"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    validFrom: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    validUntil: e.target.value,
                  }))
                }
              />
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
              formData.discountValue <= 0 ||
              formData.applicableTiers.length === 0
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
