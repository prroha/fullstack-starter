"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
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
import SlaForm from "@/components/helpdesk/sla-form";
import { slaApi } from "@/lib/helpdesk/api";
import {
  formatTicketPriority,
  getTicketPriorityBadge,
  formatSlaTime,
} from "@/lib/helpdesk/formatters";
import type {
  SlaPolicy,
  SlaPolicyCreateInput,
  SlaPolicyUpdateInput,
} from "@/lib/helpdesk/types";
import { Shield } from "lucide-react";

// =============================================================================
// Page Component
// =============================================================================

export default function SlaPoliciesPage() {
  const [policies, setPolicies] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline form state
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | undefined>(
    undefined
  );

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await slaApi.list();
      setPolicies(result.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load SLA policies"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCreateOrUpdate = async (
    data: SlaPolicyCreateInput | SlaPolicyUpdateInput
  ) => {
    if (editingPolicy) {
      await slaApi.update(editingPolicy.id, data as SlaPolicyUpdateInput);
    } else {
      await slaApi.create(data as SlaPolicyCreateInput);
    }
    setShowForm(false);
    setEditingPolicy(undefined);
    await fetchPolicies();
  };

  const handleEdit = (policy: SlaPolicy) => {
    setEditingPolicy(policy);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPolicy(undefined);
  };

  const handleToggleActive = async (id: string) => {
    try {
      await slaApi.toggleActive(id);
      await fetchPolicies();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle SLA policy"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await slaApi.delete(id);
      await fetchPolicies();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete SLA policy"
      );
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
                SLA Policies
              </h1>
              <p className="mt-1 text-muted-foreground">
                Define response and resolution time targets by priority
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingPolicy(undefined);
                setShowForm(true);
              }}
            >
              New Policy
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
              {editingPolicy ? "Edit SLA Policy" : "New SLA Policy"}
            </h3>
            <SlaForm
              sla={editingPolicy}
              onSubmit={handleCreateOrUpdate}
              onCancel={handleCancelForm}
            />
          </div>
        )}

        {/* Table or empty state */}
        {policies.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No SLA policies yet"
            description="Create SLA policies to set response and resolution time targets for your team"
            action={{
              label: "New Policy",
              onClick: () => {
                setEditingPolicy(undefined);
                setShowForm(true);
              },
            }}
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>First Response</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {policy.name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          getTicketPriorityBadge(policy.priority) as
                            | "active"
                            | "inactive"
                            | "pending"
                            | "success"
                            | "warning"
                            | "error"
                            | "info"
                        }
                        label={formatTicketPriority(policy.priority)}
                        showDot
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">
                        {formatSlaTime(policy.firstResponseMinutes)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">
                        {formatSlaTime(policy.resolutionMinutes)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={policy.isActive ? "active" : "inactive"}
                        label={policy.isActive ? "Active" : "Inactive"}
                        showDot
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(policy.id)}
                        >
                          {policy.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(policy)}
                        >
                          Edit
                        </Button>
                        <ConfirmButton
                          confirmMode="dialog"
                          confirmTitle="Delete SLA Policy"
                          confirmMessage={`Are you sure you want to delete "${policy.name}"? This action cannot be undone.`}
                          confirmLabel="Delete"
                          onConfirm={() => handleDelete(policy.id)}
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
