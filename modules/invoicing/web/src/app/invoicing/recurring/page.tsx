"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { recurringApi } from "@/lib/invoicing/api";
import type { RecurringInvoice } from "@/lib/invoicing/types";
import RecurringCard from "@/components/invoicing/recurring-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/empty-state";

const PAGE_SIZE = 12;

export default function RecurringListPage() {
  const router = useRouter();
  const [items, setItems] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await recurringApi.list(page, PAGE_SIZE);
      setItems(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recurring invoices");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Recurring Invoices
              </h1>
              <p className="mt-1 text-muted-foreground">
                Automate your billing with recurring schedules
              </p>
            </div>
            <Button onClick={() => router.push("/invoicing/recurring/new")}>
              New Recurring
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchData} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="No recurring invoices"
            description="Set up automatic billing schedules for your clients."
            action={{
              label: "Create Recurring Invoice",
              onClick: () => router.push("/invoicing/recurring/new"),
            }}
          />
        )}

        {/* Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((recurring) => (
              <RecurringCard
                key={recurring.id}
                recurring={recurring}
                onClick={() => router.push(`/invoicing/recurring/${recurring.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
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
