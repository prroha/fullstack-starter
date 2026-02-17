"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { EmptyState } from "@/components/shared/empty-state";
import EventCalendarView from "@/components/events/event-calendar-view";
import { eventApi } from "@/lib/events/api";
import type { Event } from "@/lib/events/types";

export default function EventCalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await eventApi.list({ limit: 100 });
      setEvents(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEventClick = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
              <p className="mt-1 text-muted-foreground">View events on a calendar</p>
            </div>
            <Button onClick={() => router.push("/events/new")}>New Event</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (<Alert variant="destructive" className="mb-6">{error}</Alert>)}

        {loading ? (
          <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
        ) : events.length === 0 ? (
          <EmptyState title="No events yet" description="Create an event to see it on the calendar." action={{ label: "New Event", onClick: () => router.push("/events/new") }} />
        ) : (
          <EventCalendarView events={events} onEventClick={handleEventClick} />
        )}
      </div>
    </div>
  );
}
