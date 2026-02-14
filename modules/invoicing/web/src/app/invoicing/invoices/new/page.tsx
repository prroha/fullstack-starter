"use client";

import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import InvoiceForm from "@/components/invoicing/invoice-form";
import { invoiceApi } from "@/lib/invoicing/api";
import type { InvoiceCreateInput } from "@/lib/invoicing/types";

// =============================================================================
// Page Component
// =============================================================================

export default function NewInvoicePage() {
  const router = useRouter();

  const handleSubmit = async (data: InvoiceCreateInput) => {
    const invoice = await invoiceApi.create(data as InvoiceCreateInput);
    router.push(`/invoicing/invoices/${invoice.id}`);
  };

  const handleCancel = () => {
    router.push("/invoicing/invoices");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Invoicing", href: "/invoicing" },
              { label: "Invoices", href: "/invoicing/invoices" },
              { label: "New Invoice" },
            ]}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            New Invoice
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create a new invoice for a client
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <InvoiceForm onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
}
