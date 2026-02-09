"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Icon,
  Text,
  Input,
  Select,
  Badge,
  Modal,
  Switch,
  Spinner,
  DataTable,
  IconButton,
  Label,
} from "@/components/ui";
import {
  api,
  Coupon,
  CreateCouponData,
  UpdateCouponData,
} from "@/lib/api";
import { AdminPageHeader } from "@/components/admin";
import { useAdminList } from "@/lib/hooks";
import { downloadFile } from "@/lib/export";
import { toast } from "sonner";
import type { Column } from "@/components/ui/data-table";

// =====================================================
// Types
// =====================================================

interface CouponFilters {
  discountType: string;
  isActive: string;
  sortBy: string;
}

const discountTypeOptions = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED", label: "Fixed Amount" },
];

const sortOptions = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
  { value: "code:asc", label: "Code A-Z" },
  { value: "code:desc", label: "Code Z-A" },
];

// =====================================================
// Helper Functions
// =====================================================

const formatDate = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

const formatDiscount = (coupon: Coupon) => {
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountValue}%`;
  }
  return `$${coupon.discountValue.toFixed(2)}`;
};

const getUsageDisplay = (coupon: Coupon) => {
  if (coupon.maxUses === null) {
    return `${coupon.usedCount} / Unlimited`;
  }
  return `${coupon.usedCount} / ${coupon.maxUses}`;
};

// =====================================================
// Main Component
// =====================================================

export default function AdminCouponsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minPurchase: string;
    maxUses: string;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
  }>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minPurchase: "",
    maxUses: "",
    validFrom: "",
    validUntil: "",
    isActive: true,
  });

  // Use shared admin list hook with typed API method
  const {
    items: coupons,
    pagination,
    isLoading,
    search,
    setSearch,
    filters,
    setFilter,
    handlePageChange,
    hasActiveFilters,
    refetch,
  } = useAdminList<Coupon, CouponFilters>({
    fetchFn: async ({ page, limit, search, filters }) => {
      const [sortField, sortOrder] = filters.sortBy?.split(":") || ["createdAt", "desc"];
      const res = await api.getCoupons({
        page,
        limit,
        search: search || undefined,
        discountType: filters.discountType || undefined,
        isActive: filters.isActive || undefined,
        sortBy: sortField,
        sortOrder: sortOrder,
      });

      return {
        items: res.data?.items || [],
        pagination: res.data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    },
    initialFilters: { discountType: "", isActive: "", sortBy: "createdAt:desc" },
  });

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditing(coupon);
      setForm({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minPurchase?.toString() || "",
        maxUses: coupon.maxUses?.toString() || "",
        validFrom: coupon.validFrom?.split("T")[0] || "",
        validUntil: coupon.validUntil?.split("T")[0] || "",
        isActive: coupon.isActive,
      });
    } else {
      setEditing(null);
      setForm({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: 0,
        minPurchase: "",
        maxUses: "",
        validFrom: "",
        validUntil: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const data: CreateCouponData = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: form.discountValue,
        minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
        isActive: form.isActive,
      };

      if (editing) {
        const updateData: UpdateCouponData = data;
        await api.updateCoupon(editing.id, updateData);
        toast.success("Coupon updated");
      } else {
        await api.createCoupon(data);
        toast.success("Coupon created");
      }
      setShowModal(false);
      refetch(pagination?.page || 1);
    } catch (error) {
      toast.error("Failed to save coupon");
      console.error("Failed to save coupon:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.deleteCoupon(id);
      toast.success("Coupon deleted");
      refetch(pagination?.page || 1);
    } catch (error) {
      toast.error("Failed to delete coupon");
      console.error("Failed to delete coupon:", error);
    }
  };

  const typeFilterOptions = [
    { value: "", label: "All Types" },
    ...discountTypeOptions,
  ];

  const statusFilterOptions = [
    { value: "", label: "All Status" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  // Define table columns
  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      render: (coupon) => (
        <Text className="font-mono font-semibold">{coupon.code}</Text>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (coupon) => (
        <Badge variant="secondary">
          {coupon.discountType === "PERCENTAGE" ? "Percentage" : "Fixed"}
        </Badge>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (coupon) => (
        <Text className="font-medium">{formatDiscount(coupon)}</Text>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (coupon) => (
        <Text size="sm" color="muted">{getUsageDisplay(coupon)}</Text>
      ),
    },
    {
      key: "validPeriod",
      header: "Valid Period",
      render: (coupon) => (
        <Text size="sm" color="muted">
          {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (coupon) => (
        <Badge variant={coupon.isActive ? "success" : "warning"}>
          {coupon.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (coupon) => (
        <div className="flex justify-end gap-2">
          <IconButton
            icon={<Icon name="Pencil" size="sm" />}
            size="sm"
            variant="ghost"
            onClick={() => openModal(coupon)}
            aria-label="Edit coupon"
          />
          <IconButton
            icon={<Icon name="Trash2" size="sm" />}
            size="sm"
            variant="ghost"
            onClick={() => deleteCoupon(coupon.id)}
            aria-label="Delete coupon"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <AdminPageHeader
        title="Coupons"
        description="Manage discount coupons and promo codes"
        exportConfig={{
          label: "Export",
          onExport: async () => {
            await downloadFile(api.getCouponsExportUrl());
          },
          successMessage: "Coupons exported successfully",
        }}
        actions={
          <Button onClick={() => openModal()}>
            <Icon name="Plus" size="sm" className="mr-2" />
            Add Coupon
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            placeholder="Search by coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filters.discountType}
          onChange={(val) => setFilter("discountType", val)}
          className="w-48"
          options={typeFilterOptions}
        />
        <Select
          value={filters.isActive}
          onChange={(val) => setFilter("isActive", val)}
          className="w-40"
          options={statusFilterOptions}
        />
        <Select
          value={filters.sortBy}
          onChange={(val) => setFilter("sortBy", val)}
          className="w-40"
          options={sortOptions}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={coupons}
            keyExtractor={(coupon) => coupon.id}
            isLoading={isLoading}
            emptyMessage="No coupons found"
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => {
              setSearch("");
              setFilter("discountType", "");
              setFilter("isActive", "");
            }}
            pagination={pagination}
            onPageChange={handlePageChange}
            itemLabel="coupons"
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Coupon" : "Add Coupon"}
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Code</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SUMMER2024"
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Discount Type</Label>
              <Select
                value={form.discountType}
                onChange={(val) => setForm({ ...form, discountType: val as typeof form.discountType })}
                options={discountTypeOptions}
              />
            </div>
            <div>
              <Label className="mb-1 block">
                Discount Value {form.discountType === "PERCENTAGE" ? "(%)" : "($)"}
              </Label>
              <Input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                min={0}
                max={form.discountType === "PERCENTAGE" ? 100 : undefined}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Min Purchase (Optional)</Label>
              <Input
                type="number"
                value={form.minPurchase}
                onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                placeholder="No minimum"
                min={0}
              />
            </div>
            <div>
              <Label className="mb-1 block">Max Uses (Optional)</Label>
              <Input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Unlimited"
                min={0}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Valid From (Optional)</Label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block">Valid Until (Optional)</Label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onChange={(checked) => setForm({ ...form, isActive: checked })}
            />
            <Text size="sm">Active</Text>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.code || form.discountValue <= 0}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {editing ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
