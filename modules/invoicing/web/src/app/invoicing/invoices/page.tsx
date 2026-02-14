"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert } from "@/components/feedback/alert";
import InvoiceStatusBadge from "@/components/invoicing/invoice-status-badge";
import { invoiceApi } from "@/lib/invoicing/api";
import { formatPrice, formatDate, formatDueDate } from "@/lib/invoicing/formatters";
import type { Invoice, InvoiceStatus } from "@/lib/invoicing/types";

// =============================================================================
// Constants
// =============================================================================

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "VIEWED", label: "Viewed" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "VOID", label: "Void" },
];

const PAGE_SIZE = 20;

// =============================================================================
// Page Component
// =============================================================================

export default function InvoicesListPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await invoiceApi.list({
        search: search || undefined,
        status: statusFilter !== "ALL" ? (statusFilter as InvoiceStatus) : undefined,
        page,
        limit: PAGE_SIZE,
      });

      setInvoices(response.items);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading && invoices.length === 0 && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state (blocking)
  // ---------------------------------------------------------------------------

  if (error && invoices.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="error" title="Error loading invoices">
            <p className="mt-1">{error}</p>
            <Button onClick={fetchInvoices} className="mt-3">
              Retry
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Invoices
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage and track all your invoices
              </p>
            </div>
            <Button onClick={() => router.push("/invoicing/invoices/new")}>
              New Invoice
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search invoices..."
            debounceDelay={400}
            onSearch={setSearch}
            className="flex-1"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Non-blocking error banner */}
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Invoice Table */}
        {invoices.length === 0 ? (
          <EmptyState
            variant={search || statusFilter !== "ALL" ? "noResults" : "noData"}
            title={
              search || statusFilter !== "ALL"
                ? "No invoices found"
                : "No invoices yet"
            }
            description={
              search || statusFilter !== "ALL"
                ? "Try adjusting your search or filter to find what you are looking for."
                : "Create your first invoice to get started."
            }
            action={
              search || statusFilter !== "ALL"
                ? {
                    label: "Clear Filters",
                    onClick: () => {
                      setSearch("");
                      setStatusFilter("ALL");
                    },
                    variant: "outline",
                  }
                : {
                    label: "Create Invoice",
                    onClick: () => router.push("/invoicing/invoices/new"),
                  }
            }
          />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Amount Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/invoicing/invoices/${invoice.id}`)
                    }
                  >
                    <TableCell className="font-medium text-foreground">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm text-foreground">
                          {invoice.client?.name ?? "Unknown"}
                        </span>
                        {invoice.client?.companyName && (
                          <span className="block text-xs text-muted-foreground">
                            {invoice.client.companyName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDueDate(invoice.dueDate, invoice.status)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-foreground">
                      {formatPrice(invoice.totalAmount, invoice.currency)}
                    </TableCell>
                    <TableCell
                      className={`text-right text-sm font-medium ${
                        invoice.amountDue > 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatPrice(invoice.amountDue, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            showItemCount
          />
        )}
      </div>
    </div>
  );
}
