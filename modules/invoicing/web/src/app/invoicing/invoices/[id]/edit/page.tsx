"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Alert } from "@/components/feedback/alert";
import InvoiceForm from "@/components/invoicing/invoice-form";
import { invoiceApi } from "@/lib/invoicing/api";
import type { Invoice, InvoiceUpdateInput } from "@/lib/invoicing/types";

// =============================================================================
// Page Component
// =============================================================================

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceApi.getById(id);

      // Only DRAFT invoices can be edited
      if (data.status !== "DRAFT") {
        router.replace(`/invoicing/invoices/${id}`);
        return;
      }

      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSubmit = async (data: InvoiceUpdateInput) => {
    await invoiceApi.update(id, data as InvoiceUpdateInput);
    router.push(`/invoicing/invoices/${id}`);
  };

  const handleCancel = () => {
    router.push(`/invoicing/invoices/${id}`);
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
  // Error state
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
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Invoicing", href: "/invoicing" },
              { label: "Invoices", href: "/invoicing/invoices" },
              {
                label: invoice.invoiceNumber,
                href: `/invoicing/invoices/${id}`,
              },
              { label: "Edit" },
            ]}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Edit {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Update the invoice details below
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <InvoiceForm
            invoice={invoice}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
