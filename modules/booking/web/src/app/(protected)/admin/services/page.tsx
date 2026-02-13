'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader, AdminFilters } from '@/components/admin';
import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Rating } from '@/components/ui/rating';
import { SkeletonAdminPage } from '@/components/shared/skeleton-composites';
import { Alert } from '@/components/feedback/alert';
import { serviceApi } from '@/lib/booking/api';
import {
  formatPrice,
  formatDuration,
  getServiceStatusVariant,
} from '@/lib/booking/formatters';
import type { BookingService, ServiceStatus } from '@/lib/booking/types';

// =============================================================================
// Constants
// =============================================================================

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const PAGE_SIZE = 20;

// =============================================================================
// Page Component
// =============================================================================

export default function AdminServicesPage() {
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await serviceApi.list({
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      });

      // Client-side status filtering since the public API may not support status param
      const filtered =
        statusFilter === 'ALL'
          ? response.items
          : response.items.filter((s) => s.status === statusFilter);

      setServices(filtered);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handlePublish = async (service: BookingService) => {
    try {
      setActionLoading(service.id);
      if (service.status === 'ACTIVE') {
        await serviceApi.unpublish(service.id);
      } else {
        await serviceApi.publish(service.id);
      }
      await fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      setActionLoading(serviceId);
      await serviceApi.delete(serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    } finally {
      setActionLoading(null);
    }
  };

  const hasActiveFilters = search !== '' || statusFilter !== 'ALL';

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  // Table columns
  const tableColumns: Column<BookingService>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (service) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate max-w-xs">
            {service.name}
          </p>
          {service.shortDescription && (
            <p className="text-xs text-muted-foreground truncate max-w-xs">
              {service.shortDescription}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (service) => (
        <span className="text-sm text-muted-foreground">
          {formatDuration(service.duration)}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (service) => (
        <span className="text-sm font-medium text-foreground">
          {formatPrice(service.price, service.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (service) => (
        <Badge variant={getServiceStatusVariant(service.status)}>
          {service.status}
        </Badge>
      ),
    },
    {
      key: 'reviews',
      header: 'Reviews',
      render: (service) =>
        service.avgRating != null && service.avgRating > 0 ? (
          <div className="flex items-center gap-1">
            <Rating value={service.avgRating} readOnly size="sm" />
            {service.reviewCount != null && (
              <span className="text-xs text-muted-foreground">
                ({service.reviewCount})
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No reviews</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (service) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant={service.status === 'ACTIVE' ? 'outline' : 'default'}
            size="sm"
            isLoading={actionLoading === service.id}
            onClick={() => handlePublish(service)}
          >
            {service.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
          </Button>
          <ConfirmButton
            confirmMode="dialog"
            confirmTitle="Delete Service"
            confirmMessage={`Are you sure you want to delete "${service.name}"? This action cannot be undone.`}
            variant="destructive"
            size="sm"
            onConfirm={() => handleDelete(service.id)}
            disabled={actionLoading === service.id}
          >
            Delete
          </ConfirmButton>
        </div>
      ),
    },
  ];

  // Initial full-page loading
  if (loading && services.length === 0 && !error) {
    return (
      <SkeletonAdminPage
        titleWidth="w-52"
        headerActions={0}
        filterCount={2}
        tableRows={8}
        tableColumns={6}
      />
    );
  }

  if (error && services.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive" title="Error loading services">
          <p className="mt-1">{error}</p>
          <Button
            variant="destructive"
            onClick={fetchServices}
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
        title="Service Management"
        description="Manage booking services, pricing, and availability"
      />

      {/* Filters */}
      <AdminFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search services..."
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: STATUS_OPTIONS,
            className: 'w-40',
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
          columns={tableColumns}
          data={services}
          keyExtractor={(service) => service.id}
          isLoading={loading}
          emptyMessage="No services found"
          emptyDescription="Create your first booking service to get started."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          skeletonRows={8}
          itemLabel="services"
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
