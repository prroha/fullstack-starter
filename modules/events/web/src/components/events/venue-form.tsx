"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import type {
  EventVenue,
  VenueCreateInput,
  VenueUpdateInput,
} from "@/lib/events/types";

// =============================================================================
// Props
// =============================================================================

interface VenueFormProps {
  venue?: EventVenue;
  onSubmit: (data: VenueCreateInput | VenueUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function VenueForm({ venue, onSubmit, onCancel }: VenueFormProps) {
  const [name, setName] = useState(venue?.name ?? "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [city, setCity] = useState(venue?.city ?? "");
  const [state, setState] = useState(venue?.state ?? "");
  const [country, setCountry] = useState(venue?.country ?? "");
  const [capacity, setCapacity] = useState(
    venue?.capacity !== null && venue?.capacity !== undefined ? String(venue.capacity) : ""
  );
  const [isVirtual, setIsVirtual] = useState(venue?.isVirtual ?? false);
  const [meetingUrl, setMeetingUrl] = useState(venue?.meetingUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        isVirtual,
        meetingUrl: meetingUrl.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save venue");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Venue Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Venue name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street address"
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Max attendees"
            min={0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingUrl">Meeting URL</Label>
          <Input
            id="meetingUrl"
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://zoom.us/j/..."
          />
        </div>
      </div>

      <div className="flex items-end">
        <Button
          type="button"
          variant={isVirtual ? "secondary" : "outline"}
          onClick={() => setIsVirtual(!isVirtual)}
        >
          {isVirtual ? "Virtual Venue: Yes" : "Virtual Venue: No"}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSaving}>
          {venue ? "Update Venue" : "Create Venue"}
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
