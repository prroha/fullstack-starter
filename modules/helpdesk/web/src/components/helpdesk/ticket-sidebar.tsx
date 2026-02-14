"use client";

import { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/feedback/alert";
import { formatDate, formatRelativeTime } from "@/lib/helpdesk/formatters";
import { TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from "@/lib/helpdesk/constants";
import { agentApi, categoryApi, ticketApi } from "@/lib/helpdesk/api";
import type {
  Ticket,
  HelpdeskAgent,
  HelpdeskCategory,
} from "@/lib/helpdesk/types";

// =============================================================================
// Props
// =============================================================================

interface TicketSidebarProps {
  ticket: Ticket;
  onUpdate: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function TicketSidebar({ ticket, onUpdate }: TicketSidebarProps) {
  const [agents, setAgents] = useState<HelpdeskAgent[]>([]);
  const [categories, setCategories] = useState<HelpdeskCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    agentApi.list({ limit: 100 }).then((res) => setAgents(res.items)).catch(() => {});
    categoryApi.list().then(setCategories).catch(() => {});
  }, []);

  const handleAction = async (action: () => Promise<unknown>, errorMsg: string) => {
    setError(null);
    try {
      await action();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMsg);
    }
  };

  const handleStatusChange = (status: string) =>
    handleAction(() => ticketApi.changeStatus(ticket.id, status), "Failed to update status");

  const handleAssign = (agentId: string) =>
    handleAction(() => ticketApi.assign(ticket.id, agentId), "Failed to assign agent");

  const handleCategoryChange = (categoryId: string) =>
    handleAction(() => ticketApi.update(ticket.id, { categoryId: categoryId || undefined }), "Failed to update category");

  const handlePriorityChange = (priority: string) =>
    handleAction(() => ticketApi.update(ticket.id, { priority: priority as Ticket["priority"] }), "Failed to update priority");

  const agentOptions = [
    { value: "", label: "Unassigned" },
    ...agents.map((a) => ({ value: a.id, label: a.name })),
  ];

  const categoryOptions = [
    { value: "", label: "No category" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Status</p>
        <Select
          value={ticket.status}
          onChange={handleStatusChange}
          options={TICKET_STATUS_OPTIONS}
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Priority</p>
        <Select
          value={ticket.priority}
          onChange={handlePriorityChange}
          options={TICKET_PRIORITY_OPTIONS}
        />
      </div>

      {/* Assigned Agent */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
        <Select
          value={ticket.assignedAgentId ?? ""}
          onChange={handleAssign}
          options={agentOptions}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Category</p>
        <Select
          value={ticket.categoryId ?? ""}
          onChange={handleCategoryChange}
          options={categoryOptions}
        />
      </div>

      {/* Tags */}
      {ticket.tags && ticket.tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Tags</p>
          <div className="flex flex-wrap gap-1">
            {ticket.tags.map((tagLink) => (
              <Badge key={tagLink.id} variant="outline">
                {tagLink.tag?.name ?? tagLink.tagId}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* SLA */}
      {ticket.slaBreached && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">SLA</p>
          <StatusBadge status="error" label="SLA Breached" showDot />
        </div>
      )}

      {/* Dates */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm font-medium text-muted-foreground">Details</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="text-foreground">{formatDate(ticket.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Updated</span>
            <span className="text-foreground">{formatRelativeTime(ticket.updatedAt)}</span>
          </div>
          {ticket.firstResponseAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">First Response</span>
              <span className="text-foreground">{formatRelativeTime(ticket.firstResponseAt)}</span>
            </div>
          )}
          {ticket.resolvedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resolved</span>
              <span className="text-foreground">{formatDate(ticket.resolvedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
