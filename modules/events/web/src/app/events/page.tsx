"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import DashboardStats from "@/components/events/dashboard-stats";
import EventCard from "@/components/events/event-card";
import { eventApi } from "@/lib/events/api";
import type { Event, DashboardStats as DashboardStatsType } from "@/lib/events/types";

export default function EventsDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, eventResult] = await Promise.all([
        eventApi.getStats(),
        eventApi.list({ page: 1, limit: 5 }),
      ]);
      setStats(statsData);
      setRecentEvents(eventResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Events</h1>
              <p className="mt-1 text-muted-foreground">Manage your events and registrations</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/events/calendar")}>Calendar View</Button>
              <Button onClick={() => router.push("/events/new")}>New Event</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (<Alert variant="destructive" className="mb-6">{error}</Alert>)}

        {stats && (<div className="mb-8"><DashboardStats stats={stats} /></div>)}

        <div className="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Button variant="outline" className="justify-start" onClick={() => router.push("/events/list")}>All Events</Button>
          <Button variant="outline" className="justify-start" onClick={() => router.push("/events/calendar")}>Calendar</Button>
          <Button variant="outline" className="justify-start" onClick={() => router.push("/events/venues")}>Venues</Button>
          <Button variant="outline" className="justify-start" onClick={() => router.push("/events/registrations")}>Registrations</Button>
          <Button variant="outline" className="justify-start" onClick={() => router.push("/events/settings")}>Settings</Button>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Events</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/events/list")}>View All</Button>
          </div>

          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <EventCard key={event.id} event={event} onClick={() => router.push(`/events/${event.id}`)} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No events yet. Create your first event to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}
