"use client";

import { Button, Text } from "@/components/ui";
import type { PaginationInfo } from "@/types/api";

export interface AdminPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  /** The type of items being paginated (e.g., "users", "orders", "logs") */
  itemLabel?: string;
}

/**
 * Shared pagination component for admin pages.
 * Displays page numbers with ellipsis for large page counts.
 */
export function AdminPagination({
  pagination,
  onPageChange,
  itemLabel = "items",
}: AdminPaginationProps) {
  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  // Show first, last, and pages within 1 of current page
  const visiblePages = pages.filter(
    (p) =>
      p === 1 ||
      p === pagination.totalPages ||
      Math.abs(p - pagination.page) <= 1
  );

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="flex items-center justify-between px-2">
      <Text variant="caption" color="muted">
        Showing {startItem} to {endItem} of {pagination.total} {itemLabel}
      </Text>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrev}
        >
          Previous
        </Button>
        {visiblePages.map((page, index) => {
          const prevPage = visiblePages[index - 1];
          const showEllipsis = prevPage && page - prevPage > 1;

          return (
            <div key={page} className="flex items-center">
              {showEllipsis && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              <Button
                variant={page === pagination.page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-9"
              >
                {page}
              </Button>
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default AdminPagination;
