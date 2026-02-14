"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Alert } from "@/components/feedback/alert";
import { Button } from "@/components/ui/button";
import EventForm from "@/components/events/event-form";
import { eventApi } from "@/lib/events/api";
import type { Event, EventUpdateInput } from "@/lib/events/types";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventApi.getById(id);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleSubmit = async (data: EventUpdateInput) => {
    try {
      setError(null);
      await eventApi.update(id, data);
      router.push(`/events/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    }
  };

  if (loading) {
    return (<div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>);
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-3xl">
          <Alert variant="destructive" title="Error loading event">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchEvent}>Retry</Button>
              <Button variant="outline" onClick={() => router.push("/events/list")}>Back to Events</Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: event.title, href: `/events/${id}` }, { label: "Edit" }]} />
        <h1 className="mt-6 text-2xl font-bold text-foreground">Edit Event</h1>
        <p className="mt-1 text-muted-foreground">Update event details</p>
        {error && (<Alert variant="destructive" onDismiss={() => setError(null)} className="mt-4">{error}</Alert>)}
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <EventForm event={event} onSubmit={handleSubmit} onCancel={() => router.push(`/events/${id}`)} />
        </div>
      </div>
    </div>
  );
}
