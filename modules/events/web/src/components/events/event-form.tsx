"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import { venueApi } from "@/lib/events/api";
import { EVENT_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from "@/lib/events/constants";
import type {
  Event,
  EventCreateInput,
  EventUpdateInput,
  EventVenue,
} from "@/lib/events/types";

// =============================================================================
// Props
// =============================================================================

interface EventFormProps {
  event?: Event;
  onSubmit: (data: EventCreateInput | EventUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [type, setType] = useState(event?.type ?? "IN_PERSON");
  const [status, setStatus] = useState(event?.status ?? "DRAFT");
  const [venueId, setVenueId] = useState(event?.venueId ?? "");
  const [startDate, setStartDate] = useState(
    event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : ""
  );
  const [endDate, setEndDate] = useState(
    event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : ""
  );
  const [capacity, setCapacity] = useState(
    event?.capacity !== null && event?.capacity !== undefined ? String(event.capacity) : ""
  );
  const [price, setPrice] = useState(
    event?.price ? String(event.price / 100) : ""
  );
  const [venues, setVenues] = useState<EventVenue[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    venueApi.list({ limit: 100 }).then((result) => setVenues(result.items)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        type: type as EventCreateInput["type"],
        status: status as EventCreateInput["status"],
        venueId: venueId || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        capacity: capacity ? Number(capacity) : undefined,
        price: price ? Math.round(Number(price) * 100) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  const venueOptions = [
    { value: "", label: "No venue" },
    ...venues.map((v) => ({ value: v.id, label: v.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={type}
            onChange={setType}
            options={EVENT_TYPE_OPTIONS}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onChange={setStatus}
            options={EVENT_STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date & Time</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date & Time</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venue">Venue</Label>
          <Select
            value={venueId}
            onChange={setVenueId}
            options={venueOptions}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Leave empty for unlimited"
            min={0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price ($)</Label>
        <Input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00 for free events"
          min={0}
          step="0.01"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your event..."
          rows={4}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSaving}>
          {event ? "Update Event" : "Create Event"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
