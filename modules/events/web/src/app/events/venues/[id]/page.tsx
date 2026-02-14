"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { StatCard } from "@/components/ui/stat-card";
import { Alert } from "@/components/feedback/alert";
import VenueForm from "@/components/events/venue-form";
import EventCard from "@/components/events/event-card";
import { venueApi, eventApi } from "@/lib/events/api";
import type { EventVenue, VenueUpdateInput, Event } from "@/lib/events/types";

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [venue, setVenue] = useState<EventVenue | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [venueData, eventResult] = await Promise.all([
        venueApi.getById(id),
        eventApi.list({ venueId: id, limit: 10 }),
      ]);
      setVenue(venueData);
      setEvents(eventResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load venue");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (data: VenueUpdateInput) => {
    try {
      const updated = await venueApi.update(id, data);
      setVenue(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update venue");
    }
  };

  const handleDelete = async () => {
    try {
      await venueApi.delete(id);
      router.push("/events/venues");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete venue");
    }
  };

  if (loading && !venue) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !venue) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive" title="Error loading venue">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchData}>Retry</Button>
              <Button variant="outline" onClick={() => router.push("/events/venues")}>
                Back to Venues
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!venue) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Events", href: "/events" },
              { label: "Venues", href: "/events/venues" },
              { label: venue.name },
            ]}
            className="mb-4"
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {venue.name}
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Delete Venue"
                confirmMessage="Are you sure you want to delete this venue?"
                confirmLabel="Delete"
                onConfirm={handleDelete}
                variant="destructive"
                size="sm"
              >
                Delete
              </ConfirmButton>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" onDismiss={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Capacity" value={venue.capacity ?? "Unlimited"} />
          <StatCard label="Type" value={venue.isVirtual ? "Virtual" : "Physical"} />
          <StatCard label="Events" value={events.length} />
        </div>

        {isEditing && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Edit Venue</h2>
            <VenueForm
              venue={venue}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        )}

        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Events at this venue
          </h2>
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No events at this venue yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
