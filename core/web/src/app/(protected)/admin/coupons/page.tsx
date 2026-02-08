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
  Table,
  TableRow,
  TableCell,
  TableHeader,
  IconButton,
  Label,
} from "@/components/ui";
import { api, PaginatedResponse } from "@/lib/api";
import { AdminPageHeader, AdminPagination } from "@/components/admin";
import { useAdminList } from "@/lib/hooks";
import { downloadFile } from "@/lib/export";
import { API_CONFIG } from "@/lib/constants";
import { toast } from "sonner";

// =====================================================
// Types
// =====================================================

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

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

  // Use shared admin list hook
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
    isEmpty,
    refetch,
  } = useAdminList<Coupon, CouponFilters>({
    fetchFn: async ({ page, limit, search, filters }) => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (filters.discountType) params.append("discountType", filters.discountType);
      if (filters.isActive) params.append("isActive", filters.isActive);
      if (search) params.append("search", search);
      if (filters.sortBy) {
        const [field, order] = filters.sortBy.split(":");
        params.append("sortBy", field);
        params.append("sortOrder", order);
      }

      const res = await api.get<PaginatedResponse<Coupon>>(
        `/coupons?${params.toString()}`
      );

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
      const data = {
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
        await api.patch(`/coupons/${editing.id}`, data);
        toast.success("Coupon updated");
      } else {
        await api.post("/coupons", data);
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
      await api.delete(`/coupons/${id}`);
      toast.success("Coupon deleted");
      refetch(pagination?.page || 1);
    } catch (error) {
      toast.error("Failed to delete coupon");
      console.error("Failed to delete coupon:", error);
    }
  };

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

  const typeFilterOptions = [
    { value: "", label: "All Types" },
    ...discountTypeOptions,
  ];

  const statusFilterOptions = [
    { value: "", label: "All Status" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Coupons"
        description="Manage discount coupons and promo codes"
        exportConfig={{
          label: "Export",
          onExport: async () => {
            await downloadFile(`${API_CONFIG.BASE_URL}/coupons/export`);
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
          <Table>
            <thead>
              <TableRow>
                <TableHeader>Code</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Usage</TableHeader>
                <TableHeader>Valid Period</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Spinner size="lg" />
                  </TableCell>
                </TableRow>
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Text color="muted">
                      {hasActiveFilters
                        ? "No coupons match your filters"
                        : "No coupons found"}
                    </Text>
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <Text className="font-mono font-semibold">{coupon.code}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {coupon.discountType === "PERCENTAGE" ? "Percentage" : "Fixed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text className="font-medium">{formatDiscount(coupon)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm" color="muted">{getUsageDisplay(coupon)}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm" color="muted">
                        {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive ? "success" : "warning"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t p-4">
              <AdminPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                itemLabel="coupons"
              />
            </div>
          )}
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
