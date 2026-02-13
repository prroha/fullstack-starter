"use client";

import { useState, useEffect, useCallback } from "react";
import { customerApi } from "@/lib/ecommerce/api";
import { formatPrice } from "@/lib/ecommerce/formatters";
import type { EcommerceOrder, CustomerStats } from "@/lib/ecommerce/types";
import OrderCard from "@/components/ecommerce/order-card";
import { StatCard } from "@/components/ui/stat-card";
import { Pagination } from "@/components/ui/pagination";

// =============================================================================
// Constants
// =============================================================================

const PAGE_SIZE = 10;

// =============================================================================
// My Orders Page
// =============================================================================

export default function MyOrdersPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await customerApi.getOrders(page, PAGE_SIZE);
      setOrders(result.items);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await customerApi.getStats();
      setStats(data);
    } catch {
      // Stats are non-critical; silently fail
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleOrderClick = (order: EcommerceOrder) => {
    window.location.href = `/dashboard/orders/${order.id}`;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Orders
        </h1>
        <p className="mt-1 text-muted-foreground">
          View and track your order history.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Orders"
            value={stats.totalOrders}
          />
          <StatCard
            label="Total Spent"
            value={formatPrice(stats.totalSpent)}
          />
          <StatCard
            label="Avg Order Value"
            value={formatPrice(stats.avgOrderValue)}
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={handleOrderClick}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="py-20 text-center">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-foreground">
            No orders yet
          </p>
          <p className="mt-2 text-muted-foreground">
            When you place an order, it will appear here.
          </p>
          <a
            href="/shop"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Shopping
          </a>
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
  );
}
