"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert } from "@/components/feedback/alert";
import VenueCard from "@/components/events/venue-card";
import { venueApi } from "@/lib/events/api";
import type { EventVenue } from "@/lib/events/types";

export default function VenuesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<EventVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await venueApi.list({ search: search || undefined, limit: 50 });
      setVenues(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load venues");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Venues</h1>
              <p className="mt-1 text-muted-foreground">
                Manage event venues and locations
              </p>
            </div>
            <Button onClick={() => router.push("/events/venues/new")}>New Venue</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <SearchInput value={search} onChange={setSearch} placeholder="Search venues..." />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : venues.length === 0 ? (
          <EmptyState
            title="No venues found"
            description={
              search
                ? "Try adjusting your search."
                : "Create your first venue to get started."
            }
            action={
              !search
                ? { label: "Create Venue", onClick: () => router.push("/events/venues/new") }
                : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onClick={() => router.push(`/events/venues/${venue.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
