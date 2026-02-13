"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { providerApi } from "@/lib/booking/api";
import type { Provider, ProviderFilters } from "@/lib/booking/types";
import ProviderCard from "@/components/booking/provider-card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";

// =============================================================================
// Constants
// =============================================================================

const PAGE_SIZE = 12;

// =============================================================================
// Provider Listing Page
// =============================================================================

export default function ProvidersPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ProviderFilters = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) filters.search = search.trim();

      const result = await providerApi.list(filters);
      setProviders(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load providers",
      );
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleProviderClick = useCallback(
    (provider: Provider) => {
      router.push(`/providers/${provider.id}`);
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
            Our Providers
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Meet our team of experienced professionals
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="mb-8">
          <SearchInput
            debounceDelay={400}
            onSearch={setSearch}
            placeholder="Search providers..."
            size="lg"
          />
        </div>

        {/* Results Info */}
        {!loading && !error && (
          <p className="mb-6 text-sm text-muted-foreground">
            {total === 0
              ? "No providers found"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total} providers`}
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchProviders} className="mt-4" size="sm">
              Try Again
            </Button>
          </div>
        )}

        {/* Provider Grid */}
        {!loading && !error && providers.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onClick={handleProviderClick}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && providers.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-foreground">
              No providers found
            </p>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search terms.
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
