"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/invoicing/api";
import type { InvoicingClient, PaginatedResponse } from "@/lib/invoicing/types";
import ClientCard from "@/components/invoicing/client-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

const PAGE_SIZE = 12;

export default function ClientsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<InvoicingClient> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await clientApi.list(page, PAGE_SIZE, search || undefined);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchClients} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const clients = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Clients
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage your client contacts and billing information
              </p>
            </div>
            <Button onClick={() => router.push("/invoicing/clients/new")}>
              New Client
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Search */}
        <SearchInput
          placeholder="Search clients by name, email, or company..."
          debounceDelay={400}
          onSearch={handleSearch}
          className="w-full"
        />

        {/* Error banner (when data already loaded but refresh failed) */}
        {error && data && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchClients} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {/* Loading overlay for subsequent fetches */}
        {loading && data && (
          <div className="flex justify-center py-4">
            <Spinner size="md" />
          </div>
        )}

        {/* Client grid or empty state */}
        {!loading && clients.length === 0 ? (
          search ? (
            <EmptyState
              variant="noResults"
              title="No clients found"
              description={`No clients match "${search}". Try a different search term.`}
              action={{
                label: "Clear Search",
                onClick: () => handleSearch(""),
                variant: "outline",
              }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Add your first client to start invoicing"
              action={{
                label: "New Client",
                onClick: () => router.push("/invoicing/clients/new"),
              }}
            />
          )
        ) : (
          !loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => router.push(`/invoicing/clients/${client.id}`)}
                />
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
            showItemCount
          />
        )}
      </div>
    </div>
  );
}
