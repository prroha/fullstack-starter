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
  DataTable,
  IconButton,
  Label,
} from "@/components/ui";
import {
  api,
  Faq,
  FaqCategory,
  CreateFaqData,
  UpdateFaqData,
  CreateFaqCategoryData,
  UpdateFaqCategoryData,
} from "@/lib/api";
import { AdminPageHeader } from "@/components/admin";
import { useAdminList } from "@/lib/hooks";
import { downloadFile } from "@/lib/export";
import { toast } from "sonner";
import type { Column } from "@/components/ui/data-table";

// =====================================================
// Types
// =====================================================

interface FaqFilters {
  categoryId: string;
  sortBy: string;
}

// =====================================================
// Main Component
// =====================================================

export default function AdminFaqsPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);

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

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.getFaqCategories();
      setCategories(res.data?.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Use shared admin list hook
  const {
    items: faqs,
    pagination,
    isLoading,
    search,
    setSearch,
    filters,
    setFilter,
    handlePageChange,
    hasActiveFilters,
    isEmpty: _isEmpty,
    refetch,
  } = useAdminList<Faq, FaqFilters>({
    fetchFn: async ({ page, limit, search, filters }) => {
      const [field, order] = filters.sortBy ? filters.sortBy.split("-") : ["createdAt", "desc"];

      const res = await api.getFaqs({
        page,
        limit,
        search: search || undefined,
        categoryId: filters.categoryId || undefined,
        sortBy: field,
        sortOrder: order,
      });

      return {
        items: res.data?.faqs || [],
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
    initialFilters: { categoryId: "", sortBy: "createdAt-desc" },
  });

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
      if (editingFaq) {
        const updateData: UpdateFaqData = {
          question: faqForm.question,
          answer: faqForm.answer,
          categoryId: faqForm.categoryId || null,
          isActive: faqForm.isActive,
          order: faqForm.order,
        };
        await api.updateFaq(editingFaq.id, updateData);
        toast.success("FAQ updated");
      } else {
        const createData: CreateFaqData = {
          question: faqForm.question,
          answer: faqForm.answer,
          categoryId: faqForm.categoryId || null,
          isActive: faqForm.isActive,
          order: faqForm.order,
        };
        await api.createFaq(createData);
        toast.success("FAQ created");
      }
      setShowFaqModal(false);
      refetch();
    } catch (error) {
      toast.error("Failed to save FAQ");
      console.error("Failed to save FAQ:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await api.deleteFaq(id);
      toast.success("FAQ deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete FAQ");
      console.error("Failed to delete FAQ:", error);
    }
  };

  const saveCategory = async () => {
    setSaving(true);
    try {
      if (editingCategory) {
        const updateData: UpdateFaqCategoryData = {
          name: categoryForm.name,
          slug: categoryForm.slug,
          isActive: categoryForm.isActive,
          order: categoryForm.order,
        };
        await api.updateFaqCategory(editingCategory.id, updateData);
        toast.success("Category updated");
      } else {
        const createData: CreateFaqCategoryData = {
          name: categoryForm.name,
          slug: categoryForm.slug,
          isActive: categoryForm.isActive,
          order: categoryForm.order,
        };
        await api.createFaqCategory(createData);
        toast.success("Category created");
      }
      setShowCategoryModal(false);
      fetchCategories();
      refetch();
    } catch (error) {
      toast.error("Failed to save category");
      console.error("Failed to save category:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? FAQs will be uncategorized.")) return;
    try {
      await api.deleteFaqCategory(id);
      toast.success("Category deleted");
      fetchCategories();
      refetch();
    } catch (error) {
      toast.error("Failed to delete category");
      console.error("Failed to delete category:", error);
    }
  };

  const categoryFilterOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];

  const sortOptions = [
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "question-asc", label: "Question A-Z" },
    { value: "question-desc", label: "Question Z-A" },
  ];

  // Define table columns
  const columns: Column<Faq>[] = [
    {
      key: "question",
      header: "Question",
      render: (faq) => (
        <Text className="font-medium line-clamp-2">{faq.question}</Text>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (faq) => (
        faq.category ? (
          <Badge variant="secondary">{faq.category.name}</Badge>
        ) : (
          <Text color="muted" size="sm">Uncategorized</Text>
        )
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (faq) => (
        <Badge variant={faq.isActive ? "success" : "warning"}>
          {faq.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (faq) => (
        <Text color="muted" size="sm">
          {faq.createdAt ? new Date(faq.createdAt).toLocaleDateString() : "-"}
        </Text>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (faq) => (
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
      ),
    },
  ];

  const clearFilters = () => {
    setSearch("");
    setFilter("categoryId", "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="FAQs"
        description="Manage frequently asked questions"
        exportConfig={{
          label: "Export",
          onExport: async () => {
            await downloadFile(api.getFaqsExportUrl());
          },
          successMessage: "FAQs exported successfully",
        }}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openCategoryModal()}>
              <Icon name="FolderPlus" size="sm" className="mr-2" />
              Add Category
            </Button>
            <Button onClick={() => openFaqModal()}>
              <Icon name="Plus" size="sm" className="mr-2" />
              Add FAQ
            </Button>
          </div>
        }
      />

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
          value={filters.categoryId}
          onChange={(val) => setFilter("categoryId", val)}
          className="w-48"
          options={categoryFilterOptions}
        />
        <Select
          value={filters.sortBy}
          onChange={(val) => setFilter("sortBy", val)}
          className="w-48"
          options={sortOptions}
        />
      </div>

      {/* FAQs Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={faqs}
            keyExtractor={(faq) => faq.id}
            isLoading={isLoading}
            emptyMessage="No FAQs found"
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            pagination={pagination}
            onPageChange={handlePageChange}
            itemLabel="FAQs"
          />
        </CardContent>
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
