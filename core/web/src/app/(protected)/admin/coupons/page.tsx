"use client";

import { useState, useEffect, useCallback } from "react";
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

const discountTypeOptions = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED", label: "Fixed Amount" },
];

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const [filterActive, setFilterActive] = useState<string>("");

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

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("discountType", filterType);
      if (filterActive) params.append("isActive", filterActive);

      const res = await api.get<PaginatedResponse<Coupon>>(
        `/coupons?${params.toString()}`
      );
      setCoupons(res.data?.items || []);
    } catch (error) {
      console.error("Failed to load coupons:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterActive]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      } else {
        await api.post("/coupons", data);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to save coupon:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      loadData();
    } catch (error) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <Text color="muted">Manage discount coupons and promo codes</Text>
        </div>
        <Button onClick={() => openModal()}>
          <Icon name="Plus" size="sm" className="mr-2" />
          Add Coupon
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={filterType}
          onChange={(val) => setFilterType(val)}
          className="w-48"
          options={[
            { value: "", label: "All Types" },
            ...discountTypeOptions,
          ]}
        />
        <Select
          value={filterActive}
          onChange={(val) => setFilterActive(val)}
          className="w-40"
          options={[
            { value: "", label: "All Status" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
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
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Text color="muted">No coupons found</Text>
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
