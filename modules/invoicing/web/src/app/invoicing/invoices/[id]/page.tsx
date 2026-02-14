"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";
import { Alert } from "@/components/feedback/alert";
import InvoiceStatusBadge from "@/components/invoicing/invoice-status-badge";
import InvoiceLineItems from "@/components/invoicing/invoice-line-items";
import InvoiceSummary from "@/components/invoicing/invoice-summary";
import PaymentForm from "@/components/invoicing/payment-form";
import PaymentList from "@/components/invoicing/payment-list";
import InvoiceActivityLog from "@/components/invoicing/invoice-activity";
import {
  invoiceApi,
  invoiceItemApi,
  paymentApi,
  taxRateApi,
} from "@/lib/invoicing/api";
import { formatDate } from "@/lib/invoicing/formatters";
import type {
  Invoice,
  TaxRate,
  InvoiceItemInput,
  PaymentCreateInput,
} from "@/lib/invoicing/types";

// =============================================================================
// Page Component
// =============================================================================

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [invoiceData, taxRateData] = await Promise.all([
        invoiceApi.getById(id),
        taxRateApi.list(),
      ]);

      setInvoice(invoiceData);
      setTaxRates(taxRateData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleSend = async () => {
    try {
      setActionLoading("send");
      await invoiceApi.send(id);
      await fetchInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVoid = async () => {
    try {
      setActionLoading("void");
      await invoiceApi.void(id);
      await fetchInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to void invoice");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async () => {
    try {
      setActionLoading("duplicate");
      const duplicated = await invoiceApi.duplicate(id);
      router.push(`/invoicing/invoices/${duplicated.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to duplicate invoice"
      );
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading("delete");
      await invoiceApi.delete(id);
      router.push("/invoicing/invoices");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete invoice"
      );
      setActionLoading(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Line item handlers
  // ---------------------------------------------------------------------------

  const handleAddItem = async (item: InvoiceItemInput) => {
    await invoiceItemApi.add(id, item);
    await fetchInvoice();
  };

  const handleUpdateItem = async (
    itemId: string,
    item: Partial<InvoiceItemInput>
  ) => {
    await invoiceItemApi.update(id, itemId, item);
    await fetchInvoice();
  };

  const handleDeleteItem = async (itemId: string) => {
    await invoiceItemApi.delete(id, itemId);
    await fetchInvoice();
  };

  // ---------------------------------------------------------------------------
  // Payment handlers
  // ---------------------------------------------------------------------------

  const handleRecordPayment = async (data: PaymentCreateInput) => {
    await paymentApi.record(id, data);
    await fetchInvoice();
  };

  const handleDeletePayment = async (paymentId: string) => {
    await paymentApi.delete(id, paymentId);
    await fetchInvoice();
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state (blocking)
  // ---------------------------------------------------------------------------

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-4xl">
          <Alert variant="error" title="Error loading invoice">
            <p className="mt-1">{error}</p>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={fetchInvoice}>Retry</Button>
              <Button
                variant="outline"
                onClick={() => router.push("/invoicing/invoices")}
              >
                Back to Invoices
              </Button>
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isDraft = invoice.status === "DRAFT";
  const isPaid = invoice.status === "PAID";
  const isVoid = invoice.status === "VOID";
  const isCancelled = invoice.status === "CANCELLED";
  const canRecordPayment = !isPaid && !isVoid && !isCancelled;
  const canEdit = isDraft;
  const isSentOrViewed =
    invoice.status === "SENT" ||
    invoice.status === "VIEWED" ||
    invoice.status === "PARTIALLY_PAID";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Invoicing", href: "/invoicing" },
              { label: "Invoices", href: "/invoicing/invoices" },
              { label: invoice.invoiceNumber },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {isDraft && (
                <>
                  <Button
                    onClick={handleSend}
                    isLoading={actionLoading === "send"}
                  >
                    Send
                  </Button>
                  <Link href={`/invoicing/invoices/${id}/edit`}>
                    <Button variant="outline">Edit</Button>
                  </Link>
                  <ConfirmButton
                    confirmMode="dialog"
                    confirmTitle="Delete Invoice"
                    confirmMessage="Are you sure you want to delete this draft invoice? This action cannot be undone."
                    onConfirm={handleDelete}
                    variant="destructive"
                    size="sm"
                  >
                    Delete
                  </ConfirmButton>
                </>
              )}

              {isSentOrViewed && (
                <>
                  <ConfirmButton
                    confirmMode="dialog"
                    confirmTitle="Void Invoice"
                    confirmMessage="Are you sure you want to void this invoice? This will mark it as void and it cannot be undone."
                    onConfirm={handleVoid}
                    variant="destructive"
                    size="sm"
                  >
                    Void
                  </ConfirmButton>
                  <Button
                    variant="outline"
                    onClick={handleDuplicate}
                    isLoading={actionLoading === "duplicate"}
                  >
                    Duplicate
                  </Button>
                </>
              )}

              {isPaid && (
                <Button
                  variant="outline"
                  onClick={handleDuplicate}
                  isLoading={actionLoading === "duplicate"}
                >
                  Duplicate
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Non-blocking error banner */}
        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Client Info */}
        {invoice.client && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Client
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-foreground font-medium">
                  {invoice.client.name}
                </p>
              </div>
              {invoice.client.companyName && (
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="text-foreground font-medium">
                    {invoice.client.companyName}
                  </p>
                </div>
              )}
              {invoice.client.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium">
                    {invoice.client.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoice dates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Issue Date</p>
            <p className="text-foreground font-medium">
              {formatDate(invoice.issueDate)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="text-foreground font-medium">
              {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultIndex={0}>
          <TabList>
            <Tab>Items</Tab>
            <Tab>Payments</Tab>
            <Tab>Activity</Tab>
          </TabList>
          <TabPanels>
            {/* Items Tab */}
            <TabPanel>
              <div className="space-y-6">
                <InvoiceLineItems
                  items={invoice.items ?? []}
                  taxRates={taxRates}
                  currency={invoice.currency}
                  readOnly={!isDraft}
                  onAddItem={isDraft ? handleAddItem : undefined}
                  onUpdateItem={isDraft ? handleUpdateItem : undefined}
                  onDeleteItem={isDraft ? handleDeleteItem : undefined}
                />

                <div className="flex justify-end">
                  <div className="w-full max-w-sm">
                    <InvoiceSummary
                      subtotal={invoice.subtotal}
                      taxTotal={invoice.taxTotal}
                      discountAmount={invoice.discountAmount}
                      totalAmount={invoice.totalAmount}
                      amountPaid={invoice.amountPaid}
                      amountDue={invoice.amountDue}
                      currency={invoice.currency}
                    />
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Payments Tab */}
            <TabPanel>
              <div className="space-y-6">
                {canRecordPayment && (
                  <div className="rounded-lg border border-border bg-card p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Record Payment
                    </h3>
                    <PaymentForm
                      maxAmount={invoice.amountDue}
                      currency={invoice.currency}
                      onSubmit={handleRecordPayment}
                    />
                  </div>
                )}

                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Payment History
                  </h3>
                  <PaymentList
                    payments={invoice.payments ?? []}
                    currency={invoice.currency}
                    onDelete={
                      canRecordPayment ? handleDeletePayment : undefined
                    }
                  />
                </div>
              </div>
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel>
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Activity Log
                </h3>
                <InvoiceActivityLog activities={invoice.activities ?? []} />
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {invoice.notes && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Notes
                </h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Terms & Conditions
                </h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {invoice.terms}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
