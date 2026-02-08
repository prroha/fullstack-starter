"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
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
import { api } from "@/lib/api";
import { downloadFile } from "@/lib/export";
import { API_CONFIG } from "@/lib/constants";
import { toast } from "sonner";

interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
}

interface Faq {
  id: string;
  categoryId: string | null;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  category?: { id: string; name: string; slug: string } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type SortField = "question" | "createdAt";
type SortOrder = "asc" | "desc";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Search state
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Sort state
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Modal states
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    categoryId: "",
    isActive: true,
    order: 0,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    isActive: true,
    order: 0,
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
      params.set("page", String(page));
      params.set("limit", "10");
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (searchDebounced) params.set("search", searchDebounced);
      if (sortField) params.set("sortBy", sortField);
      if (sortOrder) params.set("sortOrder", sortOrder);

      const [faqsRes, categoriesRes] = await Promise.all([
        api.get<{ faqs: Faq[]; pagination: PaginationInfo }>(`/faqs?${params.toString()}`),
        api.get<{ categories: FaqCategory[] }>("/faqs/categories"),
      ]);
      setFaqs(faqsRes.data?.faqs || []);
      setPagination(faqsRes.data?.pagination || null);
      setCategories(categoriesRes.data?.categories || []);
    } catch (error) {
      console.error("Failed to load FAQs:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchDebounced, sortField, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (page: number) => {
    loadData(page);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return "ArrowUpDown";
    return sortOrder === "asc" ? "ArrowUp" : "ArrowDown";
  };

  const openFaqModal = (faq?: Faq) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqForm({
        question: faq.question,
        answer: faq.answer,
        categoryId: faq.categoryId || "",
        isActive: faq.isActive,
        order: faq.order,
      });
    } else {
      setEditingFaq(null);
      setFaqForm({ question: "", answer: "", categoryId: "", isActive: true, order: 0 });
    }
    setShowFaqModal(true);
  };

  const openCategoryModal = (category?: FaqCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
        order: category.order,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", slug: "", isActive: true, order: 0 });
    }
    setShowCategoryModal(true);
  };

  const saveFaq = async () => {
    setSaving(true);
    try {
      const data = {
        ...faqForm,
        categoryId: faqForm.categoryId || null,
      };

      if (editingFaq) {
        await api.patch(`/faqs/${editingFaq.id}`, data);
      } else {
        await api.post("/faqs", data);
      }
      setShowFaqModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to save FAQ:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await api.delete(`/faqs/${id}`);
      loadData();
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
    }
  };

  const saveCategory = async () => {
    setSaving(true);
    try {
      if (editingCategory) {
        await api.patch(`/faqs/categories/${editingCategory.id}`, categoryForm);
      } else {
        await api.post("/faqs/categories", categoryForm);
      }
      setShowCategoryModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? FAQs will be uncategorized.")) return;
    try {
      await api.delete(`/faqs/categories/${id}`);
      loadData();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
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
          <h1 className="text-2xl font-bold">FAQs</h1>
          <Text color="muted">Manage frequently asked questions</Text>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            label="Export"
            onExport={async () => {
              await downloadFile(`${API_CONFIG.BASE_URL}/faqs/export`);
            }}
            onSuccess={() => toast.success("FAQs exported successfully")}
            onError={(error) => toast.error(error.message || "Export failed")}
          />
          <Button variant="outline" onClick={() => openCategoryModal()}>
            <Icon name="FolderPlus" size="sm" className="mr-2" />
            Add Category
          </Button>
          <Button onClick={() => openFaqModal()}>
            <Icon name="Plus" size="sm" className="mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <Text className="font-semibold">Categories</Text>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <Text color="muted">No categories yet</Text>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50"
                >
                  <Text size="sm">{cat.name}</Text>
                  {!cat.isActive && <Badge variant="warning" size="sm">Inactive</Badge>}
                  <IconButton
                    aria-label="Edit"
                    icon={<Icon name="Pencil" size="xs" />}
                    size="xs"
                    variant="ghost"
                    onClick={() => openCategoryModal(cat)}
                  />
                  <IconButton
                    aria-label="Delete"
                    icon={<Icon name="Trash2" size="xs" />}
                    size="xs"
                    variant="ghost"
                    onClick={() => deleteCategory(cat.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            placeholder="Search FAQs by question..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={selectedCategory}
          onChange={(val) => setSelectedCategory(val)}
          className="w-48"
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
          ]}
        />
        <Select
          value={`${sortField}-${sortOrder}`}
          onChange={(val) => {
            const [field, order] = val.split("-") as [SortField, SortOrder];
            setSortField(field);
            setSortOrder(order);
          }}
          className="w-48"
          options={[
            { value: "createdAt-desc", label: "Newest First" },
            { value: "createdAt-asc", label: "Oldest First" },
            { value: "question-asc", label: "Question A-Z" },
            { value: "question-desc", label: "Question Z-A" },
          ]}
        />
      </div>

      {/* FAQs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <thead>
              <TableRow>
                <TableHeader>
                  <button
                    onClick={() => handleSort("question")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Question
                    <Icon name={getSortIcon("question")} size="xs" />
                  </button>
                </TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Created
                    <Icon name={getSortIcon("createdAt")} size="xs" />
                  </button>
                </TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </thead>
            <tbody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Text color="muted">
                      {searchDebounced ? "No FAQs match your search" : "No FAQs found"}
                    </Text>
                    {searchDebounced && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setSearchDebounced("");
                        }}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <Text className="font-medium line-clamp-2">{faq.question}</Text>
                    </TableCell>
                    <TableCell>
                      {faq.category ? (
                        <Badge variant="secondary">{faq.category.name}</Badge>
                      ) : (
                        <Text color="muted" size="sm">Uncategorized</Text>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={faq.isActive ? "success" : "warning"}>
                        {faq.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text color="muted" size="sm">
                        {faq.createdAt ? new Date(faq.createdAt).toLocaleDateString() : "-"}
                      </Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          aria-label="Edit"
                          icon={<Icon name="Pencil" size="sm" />}
                          size="sm"
                          variant="ghost"
                          onClick={() => openFaqModal(faq)}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<Icon name="Trash2" size="sm" />}
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFaq(faq.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <Text size="sm" color="muted">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} FAQs
              </Text>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <Icon name="ChevronLeft" size="sm" className="mr-1" />
                  Previous
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1
                  )
                  .map((page, index, arr) => {
                    const prevPage = arr[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={page === pagination.page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
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
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <Icon name="ChevronRight" size="sm" className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* FAQ Modal */}
      <Modal
        isOpen={showFaqModal}
        onClose={() => setShowFaqModal(false)}
        title={editingFaq ? "Edit FAQ" : "Add FAQ"}
      >
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">Question</Label>
            <Input
              value={faqForm.question}
              onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
              placeholder="Enter the question"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">Answer</Label>
            <Textarea
              value={faqForm.answer}
              onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
              placeholder="Enter the answer"
              rows={5}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">Category</Label>
            <Select
              value={faqForm.categoryId}
              onChange={(val) => setFaqForm({ ...faqForm, categoryId: val })}
              options={[
                { value: "", label: "No Category" },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={faqForm.isActive}
              onChange={(checked) => setFaqForm({ ...faqForm, isActive: checked })}
            />
            <Text size="sm">Active</Text>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowFaqModal(false)}>Cancel</Button>
            <Button onClick={saveFaq} disabled={saving || !faqForm.question || !faqForm.answer}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {editingFaq ? "Save Changes" : "Create FAQ"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">Name</Label>
            <Input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({
                ...categoryForm,
                name: e.target.value,
                slug: editingCategory ? categoryForm.slug : e.target.value.toLowerCase().replace(/\s+/g, "-"),
              })}
              placeholder="Category name"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">Slug</Label>
            <Input
              value={categoryForm.slug}
              onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
              placeholder="category-slug"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={categoryForm.isActive}
              onChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
            />
            <Text size="sm">Active</Text>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving || !categoryForm.name || !categoryForm.slug}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
