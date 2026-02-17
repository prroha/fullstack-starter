"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./table";
import { Text } from "./text";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import type { PaginationInfo } from "@/types/api";

// =====================================================
// Types
// =====================================================

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  header: string;
  /** Render function for cell content */
  render: (item: T, index: number) => React.ReactNode;
  /** Header className */
  headerClassName?: string;
  /** Cell className */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Data items to display */
  data: T[];
  /** Unique key extractor for each row */
  keyExtractor: (item: T) => string;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Whether filters are active (for empty state messaging) */
  hasActiveFilters?: boolean;
  /** Callback to clear filters */
  onClearFilters?: () => void;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Additional className for table */
  className?: string;
  /** Number of skeleton rows to show when loading */
  skeletonRows?: number;
  /** Pagination info */
  pagination?: PaginationInfo | null;
  /** Page change callback */
  onPageChange?: (page: number) => void;
  /** Label for paginated items (e.g., "users", "orders") */
  itemLabel?: string;
}

// =====================================================
// Skeleton Row Component
// =====================================================

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// =====================================================
// DataTable Component
// =====================================================

// =====================================================
// Pagination Component
// =====================================================

function TablePagination({
  pagination,
  onPageChange,
  itemLabel = "items",
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <Text size="sm" color="muted">
        Showing {start} to {end} of {total} {itemLabel}
      </Text>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Go to previous page"
        >
          Previous
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((pageNum, index, arr) => {
            const prevPage = arr[index - 1];
            const showEllipsis = prevPage && pageNum - prevPage > 1;
            return (
              <React.Fragment key={pageNum}>
                {showEllipsis && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={pageNum === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-9"
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={pageNum === page ? "page" : undefined}
                >
                  {pageNum}
                </Button>
              </React.Fragment>
            );
          })}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Go to next page"
        >
          Next
        </Button>
      </nav>
    </div>
  );
}

// =====================================================
// DataTable Component
// =====================================================

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No data found",
  emptyDescription,
  hasActiveFilters = false,
  onClearFilters,
  emptyComponent,
  onRowClick,
  className,
  skeletonRows = 5,
  pagination,
  onPageChange,
  itemLabel = "items",
}: DataTableProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <SkeletonRow key={i} columns={columns.length} />
          ))}
        </TableBody>
      </Table>
    );
  }

  // Empty state
  if (data.length === 0) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }

    return (
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Text color="muted" className="font-medium">
                  {hasActiveFilters ? "No results match your filters" : emptyMessage}
                </Text>
                {emptyDescription && !hasActiveFilters && (
                  <Text color="muted" size="sm">
                    {emptyDescription}
                  </Text>
                )}
                {hasActiveFilters && onClearFilters && (
                  <Button variant="link" size="sm" onClick={onClearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  // Data table
  return (
    <div>
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={keyExtractor(item)}
              className={cn(onRowClick && "cursor-pointer")}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.cellClassName}>
                  {col.render(item, index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <TablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          itemLabel={itemLabel}
        />
      )}
    </div>
  );
}

export default DataTable;
