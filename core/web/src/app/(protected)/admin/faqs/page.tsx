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
} from "@/components/ui";
import { api } from "@/lib/api";

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
  category?: { id: string; name: string; slug: string } | null;
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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

  const loadData = useCallback(async () => {
    try {
      const [faqsRes, categoriesRes] = await Promise.all([
        api.get<{ faqs: Faq[] }>(`/faqs${selectedCategory ? `?categoryId=${selectedCategory}` : ""}`),
        api.get<{ categories: FaqCategory[] }>("/faqs/categories"),
      ]);
      setFaqs(faqsRes.data?.faqs || []);
      setCategories(categoriesRes.data?.categories || []);
    } catch (error) {
      console.error("Failed to load FAQs:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedCategory}
          onChange={(val) => setSelectedCategory(val)}
          className="w-48"
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
          ]}
        />
      </div>

      {/* FAQs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <thead>
              <TableRow>
                <TableHeader>Question</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </thead>
            <tbody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Text color="muted">No FAQs found</Text>
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
