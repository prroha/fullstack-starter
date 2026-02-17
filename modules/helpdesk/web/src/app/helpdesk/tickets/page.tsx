"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert } from "@/components/feedback/alert";
import TicketCard from "@/components/helpdesk/ticket-card";
import { ticketApi } from "@/lib/helpdesk/api";
import { TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from "@/lib/helpdesk/constants";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/helpdesk/types";

const PAGE_SIZE = 12;

// =============================================================================
// Page Component
// =============================================================================

export default function TicketListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await ticketApi.list({
        search: search || undefined,
        status: (statusFilter || undefined) as TicketStatus | undefined,
        priority: (priorityFilter || undefined) as TicketPriority | undefined,
        page,
        limit: PAGE_SIZE,
      });
      setTickets(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...TICKET_STATUS_OPTIONS,
  ];

  const priorityOptions = [
    { value: "", label: "All Priorities" },
    ...TICKET_PRIORITY_OPTIONS,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Tickets
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage and track support tickets
              </p>
            </div>
            <Button onClick={() => router.push("/helpdesk/tickets/new")}>
              New Ticket
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Search tickets..."
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={statusOptions}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={priorityFilter}
              onChange={(v) => { setPriorityFilter(v); setPage(1); }}
              options={priorityOptions}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center">
            <Alert variant="destructive">{error}</Alert>
            <Button onClick={fetchData} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <EmptyState
            title="No tickets found"
            description={
              search || statusFilter || priorityFilter
                ? "Try adjusting your search or filters."
                : "Create your first support ticket to get started."
            }
            action={
              !search && !statusFilter && !priorityFilter
                ? {
                    label: "Create Ticket",
                    onClick: () => router.push("/helpdesk/tickets/new"),
                  }
                : undefined
            }
          />
        )}

        {/* Grid */}
        {!loading && !error && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => router.push(`/helpdesk/tickets/${ticket.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
              showItemCount
            />
          </div>
        )}
      </div>
    </div>
  );
}
