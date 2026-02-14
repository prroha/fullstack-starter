"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Alert } from "@/components/feedback/alert";
import VenueForm from "@/components/events/venue-form";
import { venueApi } from "@/lib/events/api";
import type { VenueCreateInput } from "@/lib/events/types";

export default function NewVenuePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: VenueCreateInput) => {
    try {
      setError(null);
      const venue = await venueApi.create(data);
      router.push(`/events/venues/${venue.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create venue");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Events", href: "/events" },
            { label: "Venues", href: "/events/venues" },
            { label: "New Venue" },
          ]}
        />
        <h1 className="mt-6 text-2xl font-bold text-foreground">New Venue</h1>
        <p className="mt-1 text-muted-foreground">Create a new event venue</p>
        {error && (<Alert variant="destructive" onDismiss={() => setError(null)} className="mt-4">{error}</Alert>)}
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <VenueForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/events/venues")}
          />
        </div>
      </div>
    </div>
  );
}
