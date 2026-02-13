"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { providerDashboardApi, bookingApi } from "@/lib/booking/api";
import type { ProviderStats, Booking } from "@/lib/booking/types";
import {
  formatDate,
  formatTime,
  formatTimeRange,
} from "@/lib/booking/formatters";
import ProviderStatsGrid from "@/components/booking/provider-stats";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";

// =============================================================================
// Provider Dashboard Page
// =============================================================================

export default function ProviderDashboardPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, bookingsData] = await Promise.all([
        providerDashboardApi.getStats(),
        providerDashboardApi.getBookings({ limit: 20 }),
      ]);

      setStats(statsData);

      // Filter to today's bookings
      const todayStr = new Date().toISOString().split("T")[0];
      const todays = bookingsData.items.filter((b) => {
        const bookingDate = b.date.split("T")[0];
        return bookingDate === todayStr;
      });
      setTodayBookings(todays);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleConfirm = async (bookingId: string) => {
    setActionLoading(bookingId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await bookingApi.confirm(bookingId);
      setActionSuccess("Booking confirmed successfully.");
      await fetchDashboard();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to confirm booking"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    setActionLoading(bookingId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await bookingApi.complete(bookingId);
      setActionSuccess("Booking marked as completed.");
      await fetchDashboard();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to complete booking"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Alert variant="destructive" title="Error">
          <p className="mt-1">{error}</p>
          <Button
            variant="outline"
            onClick={fetchDashboard}
            className="mt-3"
          >
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Provider Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your bookings, schedule, and performance.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-8">
          <ProviderStatsGrid stats={stats} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard/provider/schedule">Manage Schedule</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/provider/bookings">View Bookings</Link>
        </Button>
      </div>

      {/* Action Feedback */}
      {actionError && (
        <div className="mb-4">
          <Alert
            variant="destructive"
            title="Action Failed"
            onDismiss={() => setActionError(null)}
          >
            {actionError}
          </Alert>
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4">
          <Alert
            variant="success"
            title="Success"
            onDismiss={() => setActionSuccess(null)}
          >
            {actionSuccess}
          </Alert>
        </div>
      )}

      {/* Today's Bookings */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Today&apos;s Bookings
          </h2>
        </div>

        {todayBookings.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground">
            No bookings scheduled for today.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Booking Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {formatTimeRange(booking.startTime, booking.endTime)}
                    </span>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm text-foreground">
                    {booking.service?.name ?? "Service"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{booking.bookingNumber}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  {booking.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(booking.id)}
                      isLoading={actionLoading === booking.id}
                    >
                      Confirm
                    </Button>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(booking.id)}
                      isLoading={actionLoading === booking.id}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
