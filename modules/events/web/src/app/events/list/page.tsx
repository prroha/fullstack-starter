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
import EventCard from "@/components/events/event-card";
import { eventApi } from "@/lib/events/api";
import { EVENT_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from "@/lib/events/constants";
import type { Event, EventStatus, EventType } from "@/lib/events/types";

const PAGE_SIZE = 12;

export default function EventListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await eventApi.list({
        search: search || undefined,
        status: (statusFilter || undefined) as EventStatus | undefined,
        type: (typeFilter || undefined) as EventType | undefined,
        page,
        limit: PAGE_SIZE,
      });
      setEvents(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const statusOptions = [{ value: "", label: "All Statuses" }, ...EVENT_STATUS_OPTIONS];
  const typeOptions = [{ value: "", label: "All Types" }, ...EVENT_TYPE_OPTIONS];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">All Events</h1>
              <p className="mt-1 text-muted-foreground">View and manage all your events</p>
            </div>
            <Button onClick={() => router.push("/events/new")}>New Event</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput value={search} onChange={handleSearch} placeholder="Search events..." />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statusOptions} />
          </div>
          <div className="w-full sm:w-48">
            <Select value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} options={typeOptions} />
          </div>
        </div>

        {loading && events.length === 0 && (<div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>)}

        {error && (<div className="text-center"><Alert variant="destructive">{error}</Alert><Button onClick={fetchData} className="mt-4">Try Again</Button></div>)}

        {!loading && !error && events.length === 0 && (
          <EmptyState
            title="No events found"
            description={search || statusFilter || typeFilter ? "Try adjusting your search or filters." : "Create your first event to get started."}
            action={!search && !statusFilter && !typeFilter ? { label: "Create Event", onClick: () => router.push("/events/new") } : undefined}
          />
        )}

        {!loading && !error && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => router.push(`/events/${event.id}`)} />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} showItemCount />
          </div>
        )}
      </div>
    </div>
  );
}
