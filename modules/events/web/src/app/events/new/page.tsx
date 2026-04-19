"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Alert } from "@/components/feedback/alert";
import EventForm from "@/components/events/event-form";
import { eventApi } from "@/lib/events/api";
import type { EventCreateInput } from "@/lib/events/types";

export default function NewEventPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: EventCreateInput) => {
    try {
      setError(null);
      const event = await eventApi.create(data);
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: "Events", href: "/events" }, { label: "New Event" }]} />
        <h1 className="mt-4 text-2xl font-bold text-foreground">New Event</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a new event</p>
        {error && (<Alert variant="destructive" onDismiss={() => setError(null)} className="mt-4">{error}</Alert>)}
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <EventForm onSubmit={handleSubmit} onCancel={() => router.push("/events/list")} />
        </div>
      </div>
    </div>
  );
}
