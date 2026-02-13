"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { bookingApi } from "@/lib/booking/api";
import type { Booking, BookingStatus } from "@/lib/booking/types";
import {
  formatDate,
  formatTime,
  formatTimeRange,
  formatPrice,
  getStatusLabel,
} from "@/lib/booking/formatters";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmButton } from "@/components/ui/confirm-button";

// =============================================================================
// My Bookings Dashboard Page
// =============================================================================

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 10;

export default function MyBookingsPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: { status?: BookingStatus; page: number; limit: number } = {
        page,
        limit: PAGE_SIZE,
      };
      if (statusFilter !== "ALL") {
        filters.status = statusFilter;
      }
      const data = await bookingApi.list(filters);
      setBookings(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your bookings"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCancel = async (bookingId: string) => {
    setActionLoading(bookingId);
    setActionError(null);
    try {
      await bookingApi.cancel(bookingId);
      await fetchBookings();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to cancel booking"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Bookings
        </h1>
        <p className="mt-1 text-muted-foreground">
          View and manage your upcoming and past bookings.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value as BookingStatus | "ALL")
          }
        />
      </div>

      {/* Action Error */}
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={fetchBookings} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          title="No bookings yet"
          description={
            statusFilter !== "ALL"
              ? `No ${getStatusLabel(statusFilter).toLowerCase()} bookings found.`
              : "You haven't made any bookings yet. Browse services to get started."
          }
          action={
            <Button asChild>
              <Link href="/services">Browse Services</Link>
            </Button>
          }
        />
      )}

      {/* Booking List */}
      {!loading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Booking Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {booking.service?.name ?? "Service"}
                    </h3>
                    <BookingStatusBadge status={booking.status} />
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      {formatDate(booking.date)} &middot;{" "}
                      {formatTimeRange(booking.startTime, booking.endTime)}
                    </p>
                    {booking.provider?.userName && (
                      <p>
                        Provider:{" "}
                        <span className="text-foreground">
                          {booking.provider.userName}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      #{booking.bookingNumber}
                    </p>
                  </div>

                  {booking.totalAmount > 0 && (
                    <p className="text-sm font-medium text-foreground">
                      {formatPrice(booking.totalAmount, booking.currency)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  {(booking.status === "PENDING" ||
                    booking.status === "CONFIRMED") && (
                    <ConfirmButton
                      confirmMode="dialog"
                      confirmTitle="Cancel Booking"
                      confirmMessage={`Are you sure you want to cancel booking #${booking.bookingNumber}? This action cannot be undone.`}
                      onConfirm={() => handleCancel(booking.id)}
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading === booking.id}
                    >
                      Cancel
                    </ConfirmButton>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                showItemCount
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
