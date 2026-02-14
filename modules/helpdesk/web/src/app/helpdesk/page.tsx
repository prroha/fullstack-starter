"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SearchInput } from "@/components/ui/search-input";
import { Alert } from "@/components/feedback/alert";
import DashboardStats from "@/components/helpdesk/dashboard-stats";
import TicketCard from "@/components/helpdesk/ticket-card";
import { ticketApi } from "@/lib/helpdesk/api";
import type { Ticket, HelpdeskDashboardStats } from "@/lib/helpdesk/types";

// =============================================================================
// Page Component
// =============================================================================

export default function HelpdeskDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<HelpdeskDashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, ticketResult] = await Promise.all([
        ticketApi.getStats(),
        ticketApi.list({ page: 1, limit: 5 }),
      ]);
      setStats(statsData);
      setRecentTickets(ticketResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Helpdesk
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage support tickets and knowledge base
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/helpdesk/knowledge-base")}
              >
                Knowledge Base
              </Button>
              <Button onClick={() => router.push("/helpdesk/tickets/new")}>
                New Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Stats */}
        {stats && (
          <div className="mb-8">
            <DashboardStats stats={stats} />
          </div>
        )}

        {/* Quick Links */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/helpdesk/tickets")}
          >
            All Tickets
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/helpdesk/agents")}
          >
            Agents
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/helpdesk/canned-responses")}
          >
            Canned Responses
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/helpdesk/sla-policies")}
          >
            SLA Policies
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => router.push("/helpdesk/settings")}
          >
            Settings
          </Button>
        </div>

        {/* Recent Tickets */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Tickets
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/helpdesk/tickets")}
            >
              View All
            </Button>
          </div>

          {recentTickets.length > 0 ? (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => router.push(`/helpdesk/tickets/${ticket.id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No tickets yet. Create your first support ticket to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
