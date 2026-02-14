"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import { LABEL_COLOR_OPTIONS } from "@/lib/tasks/constants";
import type { TaskLabel, LabelCreateInput, LabelUpdateInput } from "@/lib/tasks/types";

// =============================================================================
// Props
// =============================================================================

interface LabelFormProps {
  label?: TaskLabel;
  onSubmit: (data: LabelCreateInput | LabelUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function LabelForm({ label, onSubmit, onCancel }: LabelFormProps) {
  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState(label?.color ?? "#6B7280");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({ name: name.trim(), color });
      if (!label) {
        setName("");
        setColor("#6B7280");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save label");
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="labelName">Name</Label>
          <Input
            id="labelName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Label name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex gap-1.5">
            {LABEL_COLOR_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 rounded-full border-2 p-0 transition-all hover:opacity-80",
                  color === opt.value ? "border-foreground scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: opt.value }}
                onClick={() => setColor(opt.value)}
                title={opt.label}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" isLoading={isSaving}>
            {label ? "Update" : "Add"}
          </Button>
          {onCancel && (
            <Button type="button" size="sm" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
