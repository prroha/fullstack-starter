"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { serviceApi } from "@/lib/booking/api";
import type { BookingService, ServiceCategory, ServiceFilters } from "@/lib/booking/types";
import ServiceGrid from "@/components/booking/service-grid";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";

// =============================================================================
// Constants
// =============================================================================

const DURATION_OPTIONS = [
  { label: "Any Duration", value: "" },
  { label: "Under 30 min", value: "0-29" },
  { label: "30-60 min", value: "30-60" },
  { label: "1-2 hours", value: "60-120" },
  { label: "2+ hours", value: "120-" },
];
const PAGE_SIZE = 12;

// =============================================================================
// Service Catalog Page
// =============================================================================

export default function ServiceCatalogPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const router = useRouter();
  const [services, setServices] = useState<BookingService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ServiceFilters = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) filters.search = search.trim();
      if (selectedCategory) filters.category = selectedCategory;

      if (selectedDuration) {
        const [minStr, maxStr] = selectedDuration.split("-");
        if (minStr) filters.minDuration = Number(minStr);
        if (maxStr) filters.maxDuration = Number(maxStr);
      }

      const result = await serviceApi.list(filters);
      setServices(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedDuration, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await serviceApi.getCategories();
      setCategories(data);
    } catch {
      // Categories are non-critical; silently fail
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedDuration]);

  // ---------------------------------------------------------------------------
  // Select Options
  // ---------------------------------------------------------------------------

  const categoryOptions = [
    { label: "All Categories", value: "" },
    ...categories.map((cat) => ({ label: cat.name, value: cat.slug })),
  ];

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleServiceClick = useCallback(
    (service: BookingService) => {
      router.push(`/services/${service.slug}`);
    },
    [router],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our Services
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse and book from our range of professional services
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <SearchInput
            debounceDelay={400}
            onSearch={setSearch}
            placeholder="Search services..."
            size="lg"
          />

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            {/* Category Filter */}
            <Select
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
              size="sm"
            />

            {/* Duration Filter */}
            <Select
              options={DURATION_OPTIONS}
              value={selectedDuration}
              onChange={setSelectedDuration}
              size="sm"
            />

            {/* Clear Filters */}
            {(selectedCategory || selectedDuration || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                  setSelectedDuration("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results Info */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total === 0
              ? "No services found"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total} services`}
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchServices} className="mt-4" size="sm">
              Try Again
            </Button>
          </div>
        )}

        {/* Service Grid */}
        {!loading && !error && services.length > 0 && (
          <ServiceGrid services={services} onServiceClick={handleServiceClick} />
        )}

        {/* Empty State */}
        {!loading && !error && services.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg font-medium text-foreground">
              No services found
            </p>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={total}
              pageSize={PAGE_SIZE}
              showItemCount
            />
          </div>
        )}
      </div>
    </div>
  );
}
