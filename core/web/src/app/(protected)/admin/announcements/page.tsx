"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Button,
  Icon,
  Text,
  Input,
  Textarea,
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
  ExportCsvButton,
} from "@/components/ui";
import { api, PaginatedResponse } from "@/lib/api";
import { downloadFile } from "@/lib/export";
import { API_CONFIG } from "@/lib/constants";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "PROMO";
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const typeOptions = [
  { value: "INFO", label: "Info", variant: "default" as const },
  { value: "WARNING", label: "Warning", variant: "warning" as const },
  { value: "SUCCESS", label: "Success", variant: "success" as const },
  { value: "PROMO", label: "Promo", variant: "secondary" as const },
];

const sortOptions = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
  { value: "title:asc", label: "Title A-Z" },
  { value: "title:desc", label: "Title Z-A" },
];

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
        {pagination.total} announcements
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

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sortBy, setSortBy] = useState("createdAt:desc");

  const [form, setForm] = useState<{
    title: string;
    content: string;
    type: "INFO" | "WARNING" | "SUCCESS" | "PROMO";
    startDate: string;
    endDate: string;
    isActive: boolean;
    isPinned: boolean;
  }>({
    title: "",
    content: "",
    type: "INFO",
    startDate: "",
    endDate: "",
    isActive: true,
    isPinned: false,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      if (filterType) params.append("type", filterType);
      if (filterActive) params.append("isActive", filterActive);
      if (searchDebounced) params.append("search", searchDebounced);
      if (sortBy) {
        const [field, order] = sortBy.split(":");
        params.append("sortBy", field);
        params.append("sortOrder", order);
      }

      const res = await api.get<PaginatedResponse<Announcement>>(
        `/announcements?${params.toString()}`
      );
      setAnnouncements(res.data?.items || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load announcements:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterActive, searchDebounced, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (page: number) => {
    loadData(page);
  };

  const openModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditing(announcement);
      setForm({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        startDate: announcement.startDate?.split("T")[0] || "",
        endDate: announcement.endDate?.split("T")[0] || "",
        isActive: announcement.isActive,
        isPinned: announcement.isPinned,
      });
    } else {
      setEditing(null);
      setForm({
        title: "",
        content: "",
        type: "INFO",
        startDate: "",
        endDate: "",
        isActive: true,
        isPinned: false,
      });
    }
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };

      if (editing) {
        await api.patch(`/announcements/${editing.id}`, data);
      } else {
        await api.post("/announcements", data);
      }
      setShowModal(false);
      loadData(pagination?.page || 1);
    } catch (error) {
      console.error("Failed to save announcement:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      loadData(pagination?.page || 1);
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    }
  };

  const getTypeBadge = (type: string) => {
    const option = typeOptions.find((t) => t.value === type);
    return <Badge variant={option?.variant || "secondary"}>{option?.label || type}</Badge>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <Text color="muted">Manage system announcements and banners</Text>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            label="Export"
            onExport={async () => {
              await downloadFile(`${API_CONFIG.BASE_URL}/announcements/export`);
            }}
            onSuccess={() => toast.success("Announcements exported successfully")}
            onError={(error) => toast.error(error.message || "Export failed")}
          />
          <Button onClick={() => openModal()}>
            <Icon name="Plus" size="sm" className="mr-2" />
            Add Announcement
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            placeholder="Search by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterType}
          onChange={(val) => setFilterType(val)}
          className="w-40"
          options={[
            { value: "", label: "All Types" },
            ...typeOptions.map((t) => ({ value: t.value, label: t.label })),
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
        <Select
          value={sortBy}
          onChange={(val) => setSortBy(val)}
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
                <TableHeader>Title</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Dates</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </thead>
            <tbody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Spinner size="lg" />
                  </TableCell>
                </TableRow>
              ) : announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Text color="muted">
                      {searchDebounced || filterType || filterActive
                        ? "No announcements match your filters"
                        : "No announcements found"}
                    </Text>
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.isPinned && <Icon name="Star" size="sm" className="text-primary" />}
                        <Text className="font-medium">{item.title}</Text>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(item.type)}</TableCell>
                    <TableCell>
                      <Text size="sm" color="muted">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "success" : "warning"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          icon={<Icon name="Pencil" size="sm" />}
                          size="sm"
                          variant="ghost"
                          onClick={() => openModal(item)}
                          aria-label="Edit announcement"
                        />
                        <IconButton
                          icon={<Icon name="Trash2" size="sm" />}
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAnnouncement(item.id)}
                          aria-label="Delete announcement"
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
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Announcement" : "Add Announcement"}
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Announcement title"
            />
          </div>
          <div>
            <Label className="mb-1 block">Content</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Announcement content"
              rows={4}
            />
          </div>
          <div>
            <Label className="mb-1 block">Type</Label>
            <Select
              value={form.type}
              onChange={(val) => setForm({ ...form, type: val as typeof form.type })}
              options={typeOptions.map((t) => ({ value: t.value, label: t.label }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block">End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Text size="sm">Active</Text>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPinned}
                onChange={(checked) => setForm({ ...form, isPinned: checked })}
              />
              <Text size="sm">Pinned</Text>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.title || !form.content}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {editing ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
