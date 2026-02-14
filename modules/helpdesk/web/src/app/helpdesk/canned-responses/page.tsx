"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { SearchInput } from "@/components/ui/search-input";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/feedback/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { cannedResponseApi } from "@/lib/helpdesk/api";
import type {
  CannedResponse,
  CannedResponseCreateInput,
  CannedResponseUpdateInput,
  PaginatedResponse,
} from "@/lib/helpdesk/types";
import { MessageSquare } from "lucide-react";

// =============================================================================
// Page Component
// =============================================================================

export default function CannedResponsesPage() {
  const [data, setData] = useState<PaginatedResponse<CannedResponse> | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formShortcut, setFormShortcut] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formIsShared, setFormIsShared] = useState(true);
  const [formSaving, setFormSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchResponses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await cannedResponseApi.list(1, 100, {
        search: search || undefined,
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load canned responses"
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormShortcut("");
    setFormCategory("");
    setFormIsShared(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleStartEdit = (response: CannedResponse) => {
    setFormTitle(response.title);
    setFormContent(response.content);
    setFormShortcut(response.shortcut ?? "");
    setFormCategory(response.categoryId ?? "");
    setFormIsShared(response.isShared);
    setEditingId(response.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    setFormSaving(true);
    setError(null);

    try {
      if (editingId) {
        const updateData: CannedResponseUpdateInput = {
          title: formTitle.trim(),
          content: formContent.trim(),
          shortcut: formShortcut.trim() || undefined,
          categoryId: formCategory.trim() || undefined,
          isShared: formIsShared,
        };
        await cannedResponseApi.update(editingId, updateData);
      } else {
        const createData: CannedResponseCreateInput = {
          title: formTitle.trim(),
          content: formContent.trim(),
          shortcut: formShortcut.trim() || undefined,
          categoryId: formCategory.trim() || undefined,
          isShared: formIsShared,
        };
        await cannedResponseApi.create(createData);
      }
      resetForm();
      await fetchResponses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save canned response"
      );
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cannedResponseApi.delete(id);
      await fetchResponses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete canned response"
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state (blocking)
  // ---------------------------------------------------------------------------

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl text-center">
          <Alert variant="destructive">{error}</Alert>
          <Button onClick={fetchResponses} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const responses = data?.items ?? [];

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
                Canned Responses
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage pre-written response templates for faster replies
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              New Response
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Error banner */}
        {error && data && (
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Inline create/edit form */}
        {showForm && (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Response" : "New Response"}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="formTitle">Title</Label>
                <Input
                  id="formTitle"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Greeting"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formShortcut">Shortcut</Label>
                <Input
                  id="formShortcut"
                  value={formShortcut}
                  onChange={(e) => setFormShortcut(e.target.value)}
                  placeholder="e.g. /greeting"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formContent">Content</Label>
              <Textarea
                id="formContent"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Write the response template..."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="formCategory">Category</Label>
                <Input
                  id="formCategory"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. General, Billing"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant={formIsShared ? "secondary" : "outline"}
                  onClick={() => setFormIsShared(!formIsShared)}
                  type="button"
                >
                  {formIsShared ? "Shared (visible to all)" : "Private (only me)"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                isLoading={formSaving}
                disabled={!formTitle.trim() || !formContent.trim()}
              >
                {editingId ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <SearchInput
          placeholder="Search canned responses..."
          debounceDelay={400}
          onSearch={handleSearch}
          className="w-full"
        />

        {/* Loading overlay for subsequent fetches */}
        {loading && data && (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        )}

        {/* Table or empty state */}
        {!loading && responses.length === 0 ? (
          search ? (
            <EmptyState
              variant="noResults"
              title="No responses found"
              description={`No canned responses match "${search}". Try a different search term.`}
              action={{
                label: "Clear Search",
                onClick: () => handleSearch(""),
                variant: "outline",
              }}
            />
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No canned responses yet"
              description="Create pre-written response templates to save time when replying to tickets"
              action={{
                label: "New Response",
                onClick: () => {
                  resetForm();
                  setShowForm(true);
                },
              }}
            />
          )
        ) : (
          !loading && (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Shortcut</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Shared</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {response.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {response.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {response.shortcut ? (
                          <Badge variant="outline">{response.shortcut}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {response.categoryId ? (
                          <Badge variant="outline">{response.categoryId}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={response.isShared ? "default" : "outline"}
                        >
                          {response.isShared ? "Shared" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(response)}
                          >
                            Edit
                          </Button>
                          <ConfirmButton
                            confirmMode="dialog"
                            confirmTitle="Delete Response"
                            confirmMessage={`Are you sure you want to delete "${response.title}"? This action cannot be undone.`}
                            confirmLabel="Delete"
                            onConfirm={() => handleDelete(response.id)}
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
          )
        )}
      </div>
    </div>
  );
}
