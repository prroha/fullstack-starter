"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";
import { Alert } from "@/components/feedback/alert";
import TicketStatusBadge from "@/components/helpdesk/ticket-status-badge";
import TicketPriorityBadge from "@/components/helpdesk/ticket-priority-badge";
import TicketMessageList from "@/components/helpdesk/ticket-message-list";
import TicketMessageForm from "@/components/helpdesk/ticket-message-form";
import TicketSidebar from "@/components/helpdesk/ticket-sidebar";
import { ticketApi } from "@/lib/helpdesk/api";
import { formatDate } from "@/lib/helpdesk/formatters";
import type { Ticket, TicketMessage, MessageCreateInput } from "@/lib/helpdesk/types";

// =============================================================================
// Page Component
// =============================================================================

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketData, messagesData] = await Promise.all([
        ticketApi.getById(id),
        ticketApi.getMessages(id),
      ]);

      setTicket(ticketData);
      setMessages(messagesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleAddMessage = async (data: MessageCreateInput) => {
    try {
      await ticketApi.addMessage(id, data);
      const updatedMessages = await ticketApi.getMessages(id);
      setMessages(updatedMessages);
      const updatedTicket = await ticketApi.getById(id);
      setTicket(updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("delete");
      await ticketApi.delete(id);
      router.push("/helpdesk/tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ticket");
      setActionLoading(null);
    }
  };

  const handleTicketUpdate = useCallback(async () => {
    try {
      const updatedTicket = await ticketApi.getById(id);
      setTicket(updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh ticket");
    }
  }, [id]);

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

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive" title="Error loading ticket">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchTicket}>Retry</Button>
              <Button
                variant="outline"
                onClick={() => router.push("/helpdesk/tickets")}
              >
                Back to Tickets
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Helpdesk", href: "/helpdesk" },
              { label: "Tickets", href: "/helpdesk/tickets" },
              { label: ticket.ticketNumber },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {ticket.ticketNumber}
                </h1>
                <TicketStatusBadge status={ticket.status} />
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
              <p className="mt-1 text-lg text-muted-foreground">
                {ticket.subject}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Delete Ticket"
                confirmMessage="Are you sure you want to delete this ticket? This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                variant="destructive"
                size="sm"
                disabled={actionLoading === "delete"}
              >
                Delete
              </ConfirmButton>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Non-blocking error banner */}
        {error && (
          <Alert variant="destructive" onDismiss={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content (left) */}
          <div className="lg:col-span-2">
            <Tabs defaultIndex={0}>
              <TabList>
                <Tab>Conversation</Tab>
                <Tab>Details</Tab>
              </TabList>
              <TabPanels>
                {/* Conversation Tab */}
                <TabPanel>
                  <div className="space-y-6">
                    <div className="rounded-lg border border-border bg-card p-6">
                      <TicketMessageList messages={messages} />
                    </div>

                    <div className="rounded-lg border border-border bg-card p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Reply
                      </h3>
                      <TicketMessageForm
                        onSubmit={handleAddMessage}
                        senderType="agent"
                      />
                    </div>
                  </div>
                </TabPanel>

                {/* Details Tab */}
                <TabPanel>
                  <div className="rounded-lg border border-border bg-card p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Description
                      </h3>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(ticket.updatedAt)}
                        </p>
                      </div>
                      {ticket.category && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Category</p>
                          <p className="text-sm font-medium text-foreground">
                            {ticket.category.name}
                          </p>
                        </div>
                      )}
                      {ticket.assignedAgent && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Assigned Agent
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {ticket.assignedAgent.name}
                          </p>
                        </div>
                      )}
                      {ticket.firstResponseAt && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            First Response
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(ticket.firstResponseAt)}
                          </p>
                        </div>
                      )}
                      {ticket.resolvedAt && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Resolved</p>
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(ticket.resolvedAt)}
                          </p>
                        </div>
                      )}
                      {ticket.closedAt && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Closed</p>
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(ticket.closedAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    {ticket.slaBreached && (
                      <Alert variant="destructive">
                        SLA has been breached for this ticket
                      </Alert>
                    )}
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>

          {/* Sidebar (right) */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Ticket Properties
              </h3>
              <TicketSidebar ticket={ticket} onUpdate={handleTicketUpdate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
