"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { invoiceApi } from "@/lib/invoicing/api";
import type { Invoice, InvoicingDashboardStats } from "@/lib/invoicing/types";
import DashboardStats from "@/components/invoicing/dashboard-stats";
import InvoiceCard from "@/components/invoicing/invoice-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SearchInput } from "@/components/ui/search-input";

export default function InvoicingDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<InvoicingDashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, invoiceData] = await Promise.all([
        invoiceApi.getStats(),
        invoiceApi.list({ page: 1, limit: 5 }),
      ]);
      setStats(statsData);
      setRecentInvoices(invoiceData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Invoicing
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage invoices, clients, and payments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/invoicing/clients")}
              >
                Clients
              </Button>
              <Button onClick={() => router.push("/invoicing/invoices/new")}>
                New Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Stats */}
        {stats && <DashboardStats stats={stats} />}

        {/* Quick Search */}
        <SearchInput
          placeholder="Search invoices..."
          debounceDelay={400}
          onSearch={(search) => {
            if (search.trim()) {
              router.push(`/invoicing/invoices?search=${encodeURIComponent(search)}`);
            }
          }}
          className="w-full"
        />

        {/* Recent Invoices */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Invoices
            </h2>
            <Button
              variant="ghost"
              onClick={() => router.push("/invoicing/invoices")}
            >
              View All
            </Button>
          </div>

          {recentInvoices.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onClick={() => router.push(`/invoicing/invoices/${invoice.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                No invoices yet. Create your first invoice to get started.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/invoicing/invoices/new")}
              >
                Create Invoice
              </Button>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div
            className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            onClick={() => router.push("/invoicing/recurring")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") router.push("/invoicing/recurring");
            }}
          >
            <h3 className="font-semibold text-foreground">Recurring Invoices</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up automatic billing schedules
            </p>
          </div>
          <div
            className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            onClick={() => router.push("/invoicing/clients")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") router.push("/invoicing/clients");
            }}
          >
            <h3 className="font-semibold text-foreground">Clients</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your client contacts
            </p>
          </div>
          <div
            className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            onClick={() => router.push("/invoicing/settings")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") router.push("/invoicing/settings");
            }}
          >
            <h3 className="font-semibold text-foreground">Settings</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure your business details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
