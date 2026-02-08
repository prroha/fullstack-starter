"use client";

import { SkeletonTable } from "@/components/ui";
import { EmptySearch, EmptyList } from "@/components/shared";
import { AdminPagination } from "./Pagination";
import type { PaginationInfo } from "@/types/api";

export interface AdminTableContainerProps {
  /** Loading state */
  isLoading: boolean;
  /** Whether items exist (items.length === 0) */
  isEmpty: boolean;
  /** Whether filters are active */
  hasActiveFilters?: boolean;
  /** Search query for empty state display */
  searchQuery?: string;
  /** Clear filters callback */
  onClearFilters?: () => void;
  /** Empty state configuration when no filters */
  emptyState?: {
    title: string;
    description: string;
  };
  /** Pagination info */
  pagination?: PaginationInfo | null;
  /** Page change callback */
  onPageChange?: (page: number) => void;
  /** Label for paginated items (e.g., "users", "orders") */
  itemLabel?: string;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  /** Number of skeleton columns to show while loading */
  skeletonColumns?: number;
  /** Children content (the actual table) */
  children: React.ReactNode;
}

/**
 * Shared container for admin data tables.
 * Handles loading, empty states, and pagination consistently.
 */
export function AdminTableContainer({
  isLoading,
  isEmpty,
  hasActiveFilters = false,
  searchQuery = "",
  onClearFilters,
  emptyState = {
    title: "No items found",
    description: "No items have been created yet.",
  },
  pagination,
  onPageChange,
  itemLabel = "items",
  skeletonRows = 5,
  skeletonColumns = 5,
  children,
}: AdminTableContainerProps) {
  return (
    <div className="rounded-lg border bg-card">
      {isLoading ? (
        <div className="p-6">
          <SkeletonTable rows={skeletonRows} columns={skeletonColumns} />
        </div>
      ) : isEmpty ? (
        <div className="p-6">
          {hasActiveFilters ? (
            <EmptySearch
              searchQuery={searchQuery}
              action={
                onClearFilters
                  ? {
                      label: "Clear filters",
                      onClick: onClearFilters,
                      variant: "outline",
                    }
                  : undefined
              }
            />
          ) : (
            <EmptyList
              title={emptyState.title}
              description={emptyState.description}
            />
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}

      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="border-t p-4">
          <AdminPagination
            pagination={pagination}
            onPageChange={onPageChange}
            itemLabel={itemLabel}
          />
        </div>
      )}
    </div>
  );
}

export default AdminTableContainer;
