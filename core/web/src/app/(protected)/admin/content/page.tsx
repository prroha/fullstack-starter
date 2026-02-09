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
  DataTable,
  IconButton,
  Label,
} from "@/components/ui";
import { AdminPageHeader } from "@/components/admin";
import {
  api,
  ContentPage,
  CreateContentPageData,
  UpdateContentPageData,
} from "@/lib/api";
import { downloadFile } from "@/lib/export";
import type { Column } from "@/components/ui/data-table";
import type { PaginationInfo } from "@/types/api";

const sortOptions = [
  { value: "title:asc", label: "Title A-Z" },
  { value: "title:desc", label: "Title Z-A" },
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
];

export default function AdminContentPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ContentPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterPublished, setFilterPublished] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sortBy, setSortBy] = useState("createdAt:desc");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [form, setForm] = useState({
    slug: "",
    title: "",
    content: "",
    metaTitle: "",
    metaDesc: "",
    isPublished: false,
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
      const [field, order] = sortBy.split(":");
      const res = await api.getContentPages({
        page,
        limit: 10,
        isPublished: filterPublished || undefined,
        search: searchDebounced || undefined,
        sortBy: field,
        sortOrder: order,
      });
      setPages(res.data?.items || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load content pages:", error);
    } finally {
      setLoading(false);
    }
  }, [filterPublished, searchDebounced, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (page: number) => {
    loadData(page);
  };

  const openModal = (page?: ContentPage) => {
    if (page) {
      setEditing(page);
      setForm({
        slug: page.slug,
        title: page.title,
        content: page.content,
        metaTitle: page.metaTitle || "",
        metaDesc: page.metaDesc || "",
        isPublished: page.isPublished,
      });
    } else {
      setEditing(null);
      setForm({
        slug: "",
        title: "",
        content: "",
        metaTitle: "",
        metaDesc: "",
        isPublished: false,
      });
    }
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const data: CreateContentPageData | UpdateContentPageData = {
        slug: form.slug,
        title: form.title,
        content: form.content,
        metaTitle: form.metaTitle || null,
        metaDesc: form.metaDesc || null,
        isPublished: form.isPublished,
      };

      if (editing) {
        await api.updateContentPage(editing.id, data);
      } else {
        await api.createContentPage(data as CreateContentPageData);
      }
      setShowModal(false);
      loadData(pagination?.page || 1);
    } catch (error) {
      console.error("Failed to save content page:", error);
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await api.deleteContentPage(id);
      loadData(pagination?.page || 1);
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const hasActiveFilters = !!filterPublished || !!searchDebounced;

  const clearFilters = () => {
    setFilterPublished("");
    setSearch("");
    setSearchDebounced("");
  };

  // Define table columns
  const columns: Column<ContentPage>[] = [
    {
      key: "title",
      header: "Title",
      render: (page) => (
        <Text className="font-medium">{page.title}</Text>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      render: (page) => (
        <Text size="sm" className="font-mono text-muted-foreground">
          /{page.slug}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (page) => (
        <Badge variant={page.isPublished ? "success" : "warning"}>
          {page.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      render: (page) => (
        <Text size="sm" color="muted">{formatDate(page.updatedAt)}</Text>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (page) => (
        <div className="flex justify-end gap-2">
          <IconButton
            icon={<Icon name="ExternalLink" size="sm" />}
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/page/${page.slug}`, "_blank")}
            title="Preview"
            aria-label="Preview"
          />
          <IconButton
            icon={<Icon name="Pencil" size="sm" />}
            size="sm"
            variant="ghost"
            onClick={() => openModal(page)}
            aria-label="Edit"
          />
          <IconButton
            icon={<Icon name="Trash2" size="sm" />}
            size="sm"
            variant="ghost"
            onClick={() => deletePage(page.id)}
            aria-label="Delete"
          />
        </div>
      ),
    },
  ];

  // Show loading spinner only on initial load (when pages array is empty)
  if (loading && pages.length === 0 && !pagination) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <AdminPageHeader
        title="Content Pages"
        description="Manage static content pages (CMS)"
        exportConfig={{
          label: "Export",
          onExport: () => downloadFile(api.getContentExportUrl()),
          successMessage: "Content pages exported successfully",
        }}
        actions={
          <Button onClick={() => openModal()}>
            <Icon name="Plus" size="sm" className="mr-2" />
            Add Page
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterPublished === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublished("")}
          >
            All
          </Button>
          <Button
            variant={filterPublished === "true" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublished("true")}
          >
            Published
          </Button>
          <Button
            variant={filterPublished === "false" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPublished("false")}
          >
            Draft
          </Button>
        </div>
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
          <DataTable
            columns={columns}
            data={pages}
            keyExtractor={(page) => page.id}
            emptyMessage="No content pages found"
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            pagination={pagination}
            onPageChange={handlePageChange}
            itemLabel="pages"
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Page" : "Add Page"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({
                  ...form,
                  title: e.target.value,
                  slug: editing ? form.slug : e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                })}
                placeholder="Page title"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Slug</Label>
              <div className="flex items-center">
                <Text size="sm" color="muted" className="mr-1">/</Text>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="page-slug"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1 block">Content</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Page content (Markdown or HTML)"
              rows={10}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <Text size="sm" className="font-medium mb-3">SEO Settings</Text>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">Meta Title</Label>
                <Input
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="SEO title (max 60 characters)"
                  maxLength={60}
                />
                <Text size="xs" color="muted" className="mt-1">
                  {form.metaTitle.length}/60 characters
                </Text>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Meta Description</Label>
                <Textarea
                  value={form.metaDesc}
                  onChange={(e) => setForm({ ...form, metaDesc: e.target.value })}
                  placeholder="SEO description (max 160 characters)"
                  rows={2}
                  maxLength={160}
                />
                <Text size="xs" color="muted" className="mt-1">
                  {form.metaDesc.length}/160 characters
                </Text>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch
              checked={form.isPublished}
              onChange={(checked) => setForm({ ...form, isPublished: checked })}
            />
            <Text size="sm">Published</Text>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.title || !form.slug || !form.content}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {editing ? "Save Changes" : "Create Page"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
