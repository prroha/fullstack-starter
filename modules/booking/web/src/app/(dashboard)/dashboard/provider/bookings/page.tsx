"use client";

import { useState, useEffect, useCallback } from "react";
import { providerDashboardApi, bookingApi } from "@/lib/booking/api";
import type { Booking, BookingStatus } from "@/lib/booking/types";
import {
  formatDate,
  formatTimeRange,
  formatPrice,
  getStatusLabel,
} from "@/lib/booking/formatters";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";

// =============================================================================
// Provider Booking Management Page
// =============================================================================

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

const PAGE_SIZE = 10;

export default function ProviderBookingsPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

      const data = await providerDashboardApi.getBookings(filters);
      let items = data.items;

      // Client-side search filter (service name, booking number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter(
          (b) =>
            (b.service?.name ?? "").toLowerCase().includes(q) ||
            b.bookingNumber.toLowerCase().includes(q)
        );
      }

      setBookings(items);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load bookings"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, searchQuery]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleAction = async (
    bookingId: string,
    action: "confirm" | "complete" | "noShow",
    label: string
  ) => {
    setActionLoading(bookingId);
    setActionError(null);
    setActionSuccess(null);

    try {
      switch (action) {
        case "confirm":
          await bookingApi.confirm(bookingId);
          break;
        case "complete":
          await bookingApi.complete(bookingId);
          break;
        case "noShow":
          await bookingApi.markNoShow(bookingId);
          break;
      }
      setActionSuccess(`Booking ${label.toLowerCase()} successfully.`);
      await fetchBookings();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Failed to ${label.toLowerCase()} booking`
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
          Manage Bookings
        </h1>
        <p className="mt-1 text-muted-foreground">
          View and manage all bookings for your services.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by service or booking number..."
            debounceDelay={400}
            onSearch={setSearchQuery}
          />
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value as BookingStatus | "ALL")
          }
        />
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
          title="No bookings found"
          description={
            statusFilter !== "ALL" || searchQuery
              ? "No bookings match your current filters. Try adjusting them."
              : "You don't have any bookings yet."
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
                    <p className="text-xs text-muted-foreground">
                      #{booking.bookingNumber}
                    </p>
                  </div>

                  {booking.totalAmount > 0 && (
                    <p className="text-sm font-medium text-foreground">
                      {formatPrice(booking.totalAmount, booking.currency)}
                    </p>
                  )}

                  {booking.notes && (
                    <p className="text-xs text-muted-foreground">
                      Notes: {booking.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  {booking.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAction(booking.id, "confirm", "confirmed")
                      }
                      isLoading={actionLoading === booking.id}
                    >
                      Confirm
                    </Button>
                  )}

                  {booking.status === "CONFIRMED" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAction(booking.id, "complete", "completed")
                        }
                        isLoading={actionLoading === booking.id}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleAction(booking.id, "noShow", "marked as no-show")
                        }
                        isLoading={actionLoading === booking.id}
                      >
                        No-Show
                      </Button>
                    </>
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
