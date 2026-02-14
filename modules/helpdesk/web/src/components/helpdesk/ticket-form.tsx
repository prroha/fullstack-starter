"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import { categoryApi } from "@/lib/helpdesk/api";
import { TICKET_PRIORITY_OPTIONS } from "@/lib/helpdesk/constants";
import type {
  Ticket,
  TicketCreateInput,
  TicketUpdateInput,
  HelpdeskCategory,
} from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface TicketFormProps {
  ticket?: Ticket;
  onSubmit: (data: TicketCreateInput | TicketUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function TicketForm({ ticket, onSubmit, onCancel }: TicketFormProps) {
  const [subject, setSubject] = useState(ticket?.subject ?? "");
  const [description, setDescription] = useState(ticket?.description ?? "");
  const [priority, setPriority] = useState(ticket?.priority ?? "MEDIUM");
  const [categoryId, setCategoryId] = useState(ticket?.categoryId ?? "");
  const [categories, setCategories] = useState<HelpdeskCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        subject: subject.trim(),
        description: description.trim(),
        priority: priority as TicketCreateInput["priority"],
        categoryId: categoryId || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ticket");
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
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description of the issue"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={priority}
            onChange={setPriority}
            options={TICKET_PRIORITY_OPTIONS}
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide details about the issue..."
          rows={6}
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSaving}>
          {ticket ? "Update Ticket" : "Create Ticket"}
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
