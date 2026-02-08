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

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDesc: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContentPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ContentPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterPublished, setFilterPublished] = useState<string>("");

  const [form, setForm] = useState({
    slug: "",
    title: "",
    content: "",
    metaTitle: "",
    metaDesc: "",
    isPublished: false,
  });

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterPublished) params.append("isPublished", filterPublished);

      const res = await api.get<PaginatedResponse<ContentPage>>(
        `/content?${params.toString()}`
      );
      setPages(res.data?.items || []);
    } catch (error) {
      console.error("Failed to load content pages:", error);
    } finally {
      setLoading(false);
    }
  }, [filterPublished]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      const data = {
        ...form,
        metaTitle: form.metaTitle || null,
        metaDesc: form.metaDesc || null,
      };

      if (editing) {
        await api.patch(`/content/${editing.id}`, data);
      } else {
        await api.post("/content", data);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to save content page:", error);
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await api.delete(`/content/${id}`);
      loadData();
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
          <h1 className="text-2xl font-bold">Content Pages</h1>
          <Text color="muted">Manage static content pages (CMS)</Text>
        </div>
        <Button onClick={() => openModal()}>
          <Icon name="Plus" size="sm" className="mr-2" />
          Add Page
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <thead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Slug</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Updated</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Text color="muted">No content pages found</Text>
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <Text className="font-medium">{page.title}</Text>
                    </TableCell>
                    <TableCell>
                      <Text size="sm" className="font-mono text-muted-foreground">
                        /{page.slug}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.isPublished ? "success" : "warning"}>
                        {page.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text size="sm" color="muted">{formatDate(page.updatedAt)}</Text>
                    </TableCell>
                    <TableCell className="text-right">
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
