"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import { categoryApi } from "@/lib/helpdesk/api";
import { ARTICLE_STATUS_OPTIONS } from "@/lib/helpdesk/constants";
import type {
  KnowledgeBaseArticle,
  ArticleCreateInput,
  ArticleUpdateInput,
  HelpdeskCategory,
} from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface ArticleFormProps {
  article?: KnowledgeBaseArticle;
  onSubmit: (data: ArticleCreateInput | ArticleUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function ArticleForm({
  article,
  onSubmit,
  onCancel,
}: ArticleFormProps) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [status, setStatus] = useState(article?.status ?? "DRAFT");
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? "");
  const [categories, setCategories] = useState<HelpdeskCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {});
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!article) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        slug: slug.trim() || undefined,
        content: content.trim(),
        excerpt: excerpt.trim() || undefined,
        status: status as ArticleCreateInput["status"],
        categoryId: categoryId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = [
    { value: "", label: "No category" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Article title"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="article-slug (auto-generated if empty)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary of the article..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write the article content..."
          rows={12}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onChange={setStatus}
          options={ARTICLE_STATUS_OPTIONS}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSaving}>
          {article ? "Update Article" : "Create Article"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
