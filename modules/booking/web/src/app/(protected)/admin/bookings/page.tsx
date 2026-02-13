'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader, AdminFilters } from '@/components/admin';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonAdminPage } from '@/components/shared/skeleton-composites';
import { Alert } from '@/components/feedback/alert';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/export';
import BookingStatusBadge from '@/components/booking/booking-status-badge';
import { adminBookingApi } from '@/lib/booking/api';
import {
  formatPrice,
  formatDate,
  formatTimeRange,
} from '@/lib/booking/formatters';
import type {
  Booking,
  BookingStats,
  BookingStatus,
} from '@/lib/booking/types';

// =============================================================================
// Constants
// =============================================================================

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'ALL', label: 'All Time' },
  { value: 'TODAY', label: 'Today' },
  { value: 'WEEK', label: 'This Week' },
  { value: 'MONTH', label: 'This Month' },
  { value: 'QUARTER', label: 'This Quarter' },
];

const PAGE_SIZE = 20;

// =============================================================================
// Helpers
// =============================================================================

function getDateRange(range: string): { startDate?: string; endDate?: string } {
  if (range === 'ALL') return {};
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  let startDate: string;

  switch (range) {
    case 'TODAY':
      startDate = endDate;
      break;
    case 'WEEK': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    }
    case 'MONTH': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
      break;
    }
    case 'QUARTER': {
      const quarterAgo = new Date(now);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      startDate = quarterAgo.toISOString().split('T')[0];
      break;
    }
    default:
      return {};
  }

  return { startDate, endDate };
}

// =============================================================================
// Table Columns
// =============================================================================

const columns: Column<Booking>[] = [
  {
    key: 'bookingNumber',
    header: 'Booking #',
    render: (booking) => (
      <span className="text-sm font-medium text-foreground">
        {booking.bookingNumber}
      </span>
    ),
  },
  {
    key: 'customer',
    header: 'Customer',
    render: (booking) => (
      <span className="text-sm text-muted-foreground">
        {booking.userId.slice(0, 8)}...
      </span>
    ),
  },
  {
    key: 'service',
    header: 'Service',
    render: (booking) => (
      <span className="text-sm text-foreground">
        {booking.service?.name ?? 'N/A'}
      </span>
    ),
  },
  {
    key: 'provider',
    header: 'Provider',
    render: (booking) => (
      <span className="text-sm text-foreground">
        {booking.provider?.userName ?? 'N/A'}
      </span>
    ),
  },
  {
    key: 'dateTime',
    header: 'Date & Time',
    render: (booking) => (
      <div className="text-sm">
        <div className="text-foreground">{formatDate(booking.date)}</div>
        <div className="text-muted-foreground">
          {formatTimeRange(booking.startTime, booking.endTime)}
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (booking) => <BookingStatusBadge status={booking.status} />,
  },
  {
    key: 'amount',
    header: 'Amount',
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (booking) => (
      <span className="text-sm font-medium text-foreground">
        {formatPrice(booking.totalAmount, booking.currency)}
      </span>
    ),
  },
];

// =============================================================================
// Page Component
// =============================================================================

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await adminBookingApi.getStats();
      setStats(data);
    } catch (err) {
      // Stats failure is not critical, we still show the table
      console.warn('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dateFilters = getDateRange(dateRange);
      const response = await adminBookingApi.list({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as BookingStatus) : undefined,
        ...dateFilters,
        page,
        limit: PAGE_SIZE,
      });

      setBookings(response.items);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateRange, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateRange]);

  const handleExport = async () => {
    await downloadFile(adminBookingApi.getExportUrl(), 'bookings-export.csv');
  };

  const hasActiveFilters = search !== '' || statusFilter !== 'ALL' || dateRange !== 'ALL';

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setDateRange('ALL');
  };

  // Initial full-page loading
  if (loading && bookings.length === 0 && !error) {
    return (
      <SkeletonAdminPage
        titleWidth="w-56"
        headerActions={1}
        filterCount={3}
        tableRows={8}
        tableColumns={7}
      />
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive" title="Error loading bookings">
          <p className="mt-1">{error}</p>
          <Button
            variant="destructive"
            onClick={fetchBookings}
            className="mt-3"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Booking Management"
        description="View and manage all bookings across the platform"
        exportConfig={{
          label: 'Export Bookings',
          onExport: handleExport,
          successMessage: 'Bookings exported successfully',
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={stats?.totalBookings ?? 0}
          isLoading={statsLoading}
        />
        <StatCard
          label="Today's Bookings"
          value={stats?.todayBookings ?? 0}
          variant="info"
          isLoading={statsLoading}
        />
        <StatCard
          label="Completed"
          value={stats?.completedBookings ?? 0}
          variant="success"
          isLoading={statsLoading}
        />
        <StatCard
          label="Revenue"
          value={stats ? formatPrice(stats.revenue) : '$0.00'}
          variant="default"
          isLoading={statsLoading}
        />
      </div>

      {/* Filters */}
      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search bookings..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: STATUS_OPTIONS,
            className: 'w-44',
          },
          {
            value: dateRange,
            onChange: setDateRange,
            options: DATE_RANGE_OPTIONS,
            className: 'w-44',
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Error banner (non-blocking) */}
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <DataTable
          columns={columns}
          data={bookings}
          keyExtractor={(booking) => booking.id}
          isLoading={loading}
          emptyMessage="No bookings found"
          emptyDescription="Bookings will appear here once customers start booking services."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          skeletonRows={8}
          itemLabel="bookings"
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          showItemCount
        />
      )}
    </div>
  );
}
