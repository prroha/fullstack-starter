"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Alert } from "@/components/feedback/alert";
import EventStatusBadge from "@/components/events/event-status-badge";
import EventTypeBadge from "@/components/events/event-type-badge";
import SpeakerCard from "@/components/events/speaker-card";
import SpeakerForm from "@/components/events/speaker-form";
import RegistrationList from "@/components/events/registration-list";
import { eventApi, registrationApi } from "@/lib/events/api";
import { formatDate, formatDateRange, formatPrice, formatCapacity } from "@/lib/events/formatters";
import type { Event, EventSpeaker, EventRegistration, SpeakerCreateInput } from "@/lib/events/types";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSpeakerForm, setShowSpeakerForm] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventData, speakersData, registrationsData] = await Promise.all([
        eventApi.getById(id),
        eventApi.getSpeakers(id),
        eventApi.getRegistrations(id),
      ]);
      setEvent(eventData);
      setSpeakers(speakersData);
      setRegistrations(registrationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handlePublish = async () => {
    try {
      setActionLoading("publish");
      const updated = await eventApi.publish(id);
      setEvent(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading("cancel");
      const updated = await eventApi.cancel(id);
      setEvent(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading("complete");
      const updated = await eventApi.complete(id);
      setEvent(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("delete");
      await eventApi.delete(id);
      router.push("/events/list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
      setActionLoading(null);
    }
  };

  const handleAddSpeaker = async (data: SpeakerCreateInput) => {
    try {
      await eventApi.addSpeaker(id, data);
      const updated = await eventApi.getSpeakers(id);
      setSpeakers(updated);
      setShowSpeakerForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add speaker");
    }
  };

  const handleConfirmRegistration = async (regId: string) => {
    try {
      await registrationApi.confirm(regId);
      const updated = await eventApi.getRegistrations(id);
      setRegistrations(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm registration");
    }
  };

  const handleCheckInRegistration = async (regId: string) => {
    try {
      await registrationApi.checkIn(regId);
      const updated = await eventApi.getRegistrations(id);
      setRegistrations(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in registration");
    }
  };

  const handleCancelRegistration = async (regId: string) => {
    try {
      await registrationApi.cancel(regId);
      const updated = await eventApi.getRegistrations(id);
      setRegistrations(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel registration");
    }
  };

  if (loading && !event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive" title="Error loading event">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchEvent}>Retry</Button>
              <Button variant="outline" onClick={() => router.push("/events/list")}>
                Back to Events
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Events", href: "/events" },
              { label: "All Events", href: "/events/list" },
              { label: event.title },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {event.title}
                </h1>
                <EventStatusBadge status={event.status} />
                <EventTypeBadge type={event.type} />
              </div>
              <p className="mt-1 text-muted-foreground">
                {formatDateRange(event.startDate, event.endDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {event.status === "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePublish}
                  isLoading={actionLoading === "publish"}
                >
                  Publish
                </Button>
              )}
              {event.status === "PUBLISHED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleComplete}
                  isLoading={actionLoading === "complete"}
                >
                  Complete
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/events/${id}/edit`)}
              >
                Edit
              </Button>
              {event.status !== "CANCELLED" && (
                <ConfirmButton
                  confirmMode="dialog"
                  confirmTitle="Cancel Event"
                  confirmMessage="Are you sure you want to cancel this event?"
                  confirmLabel="Cancel Event"
                  onConfirm={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={actionLoading === "cancel"}
                >
                  Cancel Event
                </ConfirmButton>
              )}
              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Delete Event"
                confirmMessage="Are you sure you want to delete this event? This action cannot be undone."
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
        {error && (
          <Alert variant="destructive" onDismiss={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {event.description && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Speakers ({speakers.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpeakerForm(!showSpeakerForm)}
                >
                  {showSpeakerForm ? "Cancel" : "Add Speaker"}
                </Button>
              </div>
              {showSpeakerForm && (
                <div className="mb-4 rounded-lg border border-border p-4">
                  <SpeakerForm
                    onSubmit={handleAddSpeaker}
                    onCancel={() => setShowSpeakerForm(false)}
                  />
                </div>
              )}
              {speakers.length > 0 ? (
                <div className="space-y-3">
                  {speakers.map((speaker) => (
                    <SpeakerCard key={speaker.id} speaker={speaker} />
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground">
                  No speakers added yet.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Registrations ({registrations.length})
              </h3>
              <RegistrationList
                registrations={registrations}
                onConfirm={handleConfirmRegistration}
                onCheckIn={handleCheckInRegistration}
                onCancel={handleCancelRegistration}
              />
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Properties
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateRange(event.startDate, event.endDate)}
                  </p>
                </div>
                {event.venue && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="text-sm font-medium text-foreground">{event.venue.name}</p>
                  </div>
                )}
                {event.category && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="outline">
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: event.category.color }}
                      />
                      {event.category.name}
                    </Badge>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatCapacity(event.capacity, registrations.length)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-sm font-medium text-foreground">
                    {event.price > 0 ? formatPrice(event.price, event.currency) : "Free"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(event.createdAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(event.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
            {event.isFeatured && (
              <div className="rounded-lg border border-border bg-card p-6">
                <Badge variant="secondary">Featured Event</Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
