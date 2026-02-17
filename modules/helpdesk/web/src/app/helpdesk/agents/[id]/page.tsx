"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/feedback/alert";
import { EmptyState } from "@/components/shared/empty-state";
import TicketCard from "@/components/helpdesk/ticket-card";
import { agentApi, ticketApi } from "@/lib/helpdesk/api";
import { formatAgentRole, formatDate } from "@/lib/helpdesk/formatters";
import { AGENT_ROLE_OPTIONS } from "@/lib/helpdesk/constants";
import type {
  HelpdeskAgent,
  AgentUpdateInput,
  Ticket,
  AgentRole,
} from "@/lib/helpdesk/types";
import { Ticket as TicketIcon } from "lucide-react";

// =============================================================================
// Page Component
// =============================================================================

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [agent, setAgent] = useState<HelpdeskAgent | null>(null);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit form fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("AGENT");
  const [editDepartment, setEditDepartment] = useState("");
  const [editMaxOpenTickets, setEditMaxOpenTickets] = useState("10");
  const [editSaving, setEditSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentData, ticketData] = await Promise.all([
        agentApi.getById(id),
        ticketApi.list({ assignedAgentId: id, page: 1, limit: 50 }),
      ]);
      setAgent(agentData);
      setAssignedTickets(ticketData.items);

      // Populate edit fields
      setEditName(agentData.name);
      setEditEmail(agentData.email);
      setEditRole(agentData.role);
      setEditDepartment(agentData.department ?? "");
      setEditMaxOpenTickets(String(agentData.maxOpenTickets));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agent");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleToggleActive = async () => {
    try {
      setActionLoading("toggle");
      const updated = await agentApi.toggleActive(id);
      setAgent(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editEmail.trim()) return;

    setEditSaving(true);
    setError(null);

    try {
      const updateData: AgentUpdateInput = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole as AgentRole,
        department: editDepartment.trim() || undefined,
        maxOpenTickets: parseInt(editMaxOpenTickets, 10) || 10,
      };
      const updated = await agentApi.update(id, updateData);
      setAgent(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update agent");
    } finally {
      setEditSaving(false);
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
  // Error state (blocking)
  // ---------------------------------------------------------------------------

  if (error && !agent) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive" title="Error loading agent">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchData}>Retry</Button>
              <Button
                variant="outline"
                onClick={() => router.push("/helpdesk/agents")}
              >
                Back to Agents
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!agent) return null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Helpdesk", href: "/helpdesk" },
              { label: "Agents", href: "/helpdesk/agents" },
              { label: agent.name },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {agent.name}
                </h1>
                <Badge variant="outline">{formatAgentRole(agent.role)}</Badge>
                <StatusBadge
                  status={agent.isActive ? "active" : "inactive"}
                  label={agent.isActive ? "Active" : "Inactive"}
                  showDot
                />
              </div>
              <p className="mt-1 text-muted-foreground">{agent.email}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isEditing ? "secondary" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel Edit" : "Edit"}
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleActive}
                isLoading={actionLoading === "toggle"}
              >
                {agent.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Error banner */}
        {error && (
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Agent details / edit form */}
        <div className="rounded-lg border border-border bg-card p-6">
          {isEditing ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Edit Agent
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editName">Name</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Agent name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="agent@company.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="editRole">Role</Label>
                  <Select
                    value={editRole}
                    onChange={setEditRole}
                    options={AGENT_ROLE_OPTIONS}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDepartment">Department</Label>
                  <Input
                    id="editDepartment"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="e.g. Technical Support"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editMaxOpenTickets">Max Open Tickets</Label>
                  <Input
                    id="editMaxOpenTickets"
                    type="number"
                    min="1"
                    value={editMaxOpenTickets}
                    onChange={(e) => setEditMaxOpenTickets(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSaveEdit} isLoading={editSaving}>
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">
                Agent Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Name" value={agent.name} />
                <ReadOnlyField label="Email" value={agent.email} />
                <ReadOnlyField label="Role" value={formatAgentRole(agent.role)} />
                <ReadOnlyField label="Department" value={agent.department} />
                <ReadOnlyField
                  label="Max Open Tickets"
                  value={String(agent.maxOpenTickets)}
                />
                <ReadOnlyField
                  label="Assigned Tickets"
                  value={String(assignedTickets.length)}
                />
              </div>

              <div className="border-t border-border pt-4 text-sm text-muted-foreground">
                <p>Created: {formatDate(agent.createdAt)}</p>
                <p>Last updated: {formatDate(agent.updatedAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Assigned Tickets */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Assigned Tickets ({assignedTickets.length})
          </h2>

          {assignedTickets.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {assignedTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => router.push(`/helpdesk/tickets/${ticket.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TicketIcon}
              title="No assigned tickets"
              description={`${agent.name} has no tickets currently assigned.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ReadOnlyField Helper
// =============================================================================

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      <p className="text-sm text-foreground">
        {value || (
          <span className="text-muted-foreground italic">Not provided</span>
        )}
      </p>
    </div>
  );
}
