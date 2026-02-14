"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert } from "@/components/feedback/alert";
import { EmptyState } from "@/components/shared/empty-state";
import LabelForm from "@/components/tasks/label-form";
import { labelApi } from "@/lib/tasks/api";
import type { TaskLabel, LabelCreateInput, LabelUpdateInput } from "@/lib/tasks/types";
import { Tag } from "lucide-react";

// =============================================================================
// Page Component
// =============================================================================

export default function LabelsPage() {
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<TaskLabel | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchLabels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await labelApi.list();
      setLabels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load labels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCreateOrUpdate = async (data: LabelCreateInput | LabelUpdateInput) => {
    if (editingLabel) {
      await labelApi.update(editingLabel.id, data as LabelUpdateInput);
    } else {
      await labelApi.create(data as LabelCreateInput);
    }
    setShowForm(false);
    setEditingLabel(undefined);
    await fetchLabels();
  };

  const handleEdit = (label: TaskLabel) => {
    setEditingLabel(label);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingLabel(undefined);
  };

  const handleDelete = async (id: string) => {
    try {
      await labelApi.delete(id);
      await fetchLabels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete label");
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Labels
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage labels for task categorization
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingLabel(undefined);
                setShowForm(true);
              }}
            >
              New Label
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Error banner */}
        {error && (
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Inline form */}
        {showForm && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {editingLabel ? "Edit Label" : "New Label"}
            </h3>
            <LabelForm
              label={editingLabel}
              onSubmit={handleCreateOrUpdate}
              onCancel={handleCancelForm}
            />
          </div>
        )}

        {/* Table or empty state */}
        {labels.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No labels yet"
            description="Create labels to categorize and organize your tasks"
            action={{
              label: "New Label",
              onClick: () => {
                setEditingLabel(undefined);
                setShowForm(true);
              },
            }}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labels.map((label) => (
                  <TableRow key={label.id}>
                    <TableCell>
                      <span
                        className="inline-block h-4 w-4 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <span
                          className="mr-1.5 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(label)}
                        >
                          Edit
                        </Button>
                        <ConfirmButton
                          confirmMode="dialog"
                          confirmTitle="Delete Label"
                          confirmMessage={`Are you sure you want to delete "${label.name}"? It will be removed from all tasks.`}
                          confirmLabel="Delete"
                          onConfirm={() => handleDelete(label.id)}
                          variant="ghost"
                          size="sm"
                        >
                          Delete
                        </ConfirmButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
