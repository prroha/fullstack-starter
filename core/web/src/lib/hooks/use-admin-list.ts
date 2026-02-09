"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "./use-debounce";
import type { PaginationInfo } from "@/types/api";

export interface UseAdminListOptions<TItem, TFilters extends object> {
  /** Function to fetch data */
  fetchFn: (params: {
    page: number;
    limit: number;
    search?: string;
    filters: TFilters;
  }) => Promise<{ items: TItem[]; pagination: PaginationInfo }>;
  /** Initial filter values */
  initialFilters: TFilters;
  /** Items per page */
  limit?: number;
  /** Debounce delay for search in ms */
  debounceDelay?: number;
}

export interface UseAdminListReturn<TItem, TFilters extends object> {
  // Data state
  items: TItem[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;

  // Search state
  search: string;
  searchDebounced: string;
  setSearch: (value: string) => void;

  // Filter state
  filters: TFilters;
  setFilters: React.Dispatch<React.SetStateAction<TFilters>>;
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;

  // Actions
  refetch: (page?: number) => Promise<void>;
  handlePageChange: (page: number) => void;
  clearFilters: () => void;

  // Computed
  hasActiveFilters: boolean;
  isEmpty: boolean;
}

/**
 * Custom hook for admin list pages with pagination, search, and filters.
 * Reduces boilerplate across admin pages by handling common patterns.
 *
 * @example
 * ```tsx
 * const {
 *   items: users,
 *   pagination,
 *   isLoading,
 *   search,
 *   setSearch,
 *   filters,
 *   setFilter,
 *   handlePageChange,
 *   clearFilters,
 *   hasActiveFilters,
 *   isEmpty,
 * } = useAdminList({
 *   fetchFn: async ({ page, limit, search, filters }) => {
 *     const response = await api.getUsers({ page, limit, search, ...filters });
 *     return { items: response.data.items, pagination: response.data.pagination };
 *   },
 *   initialFilters: { role: "", status: "" },
 * });
 * ```
 */
export function useAdminList<TItem, TFilters extends object>({
  fetchFn,
  initialFilters,
  limit = 10,
  debounceDelay = 300,
}: UseAdminListOptions<TItem, TFilters>): UseAdminListReturn<TItem, TFilters> {
  // Data state
  const [items, setItems] = useState<TItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [search, setSearch] = useState("");
  const searchDebounced = useDebounce(search, debounceDelay);

  // Filter state
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  // Use ref to store fetchFn to avoid it being a dependency
  // This prevents unnecessary re-fetches when the parent component re-renders
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Track if initial fetch has been done (for React Strict Mode)
  const hasFetchedRef = useRef(false);

  // Set individual filter
  const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Fetch data
  const refetch = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchFnRef.current({
          page,
          limit,
          search: searchDebounced || undefined,
          filters,
        });

        setItems(result.items);
        setPagination(result.pagination);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [limit, searchDebounced, filters]
  );

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    // Skip duplicate fetches from React Strict Mode on initial mount
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
    }
    refetch();
  }, [refetch]);

  // Page change handler
  const handlePageChange = useCallback(
    (page: number) => {
      refetch(page);
    },
    [refetch]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters(initialFilters);
  }, [initialFilters]);

  // Compute if any filters are active
  const hasActiveFilters =
    !!searchDebounced ||
    Object.values(filters as Record<string, unknown>).some(
      (value) => value !== "" && value !== undefined && value !== null
    );

  // Compute if list is empty
  const isEmpty = items.length === 0;

  return {
    // Data state
    items,
    pagination,
    isLoading,
    error,

    // Search state
    search,
    searchDebounced,
    setSearch,

    // Filter state
    filters,
    setFilters,
    setFilter,

    // Actions
    refetch,
    handlePageChange,
    clearFilters,

    // Computed
    hasActiveFilters,
    isEmpty,
  };
}

export default useAdminList;
