"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import type {
  HelpdeskCategory,
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface CategoryFormProps {
  category?: HelpdeskCategory;
  onSubmit: (data: CategoryCreateInput | CategoryUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function CategoryForm({
  category,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [color, setColor] = useState(category?.color ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="catName">Name</Label>
        <Input
          id="catName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Technical Support"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="catDescription">Description</Label>
        <Textarea
          id="catDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Category description..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="catColor">Color</Label>
        <Input
          id="catColor"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="e.g. #3B82F6"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSaving}>
          {category ? "Update Category" : "Add Category"}
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
