"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { recurringApi, invoiceApi } from "@/lib/invoicing/api";
import type { RecurringInvoice, Invoice, RecurringUpdateInput } from "@/lib/invoicing/types";
import {
  formatRecurringFrequency,
  formatRecurringStatus,
  formatDate,
  formatPrice,
  getRecurringStatusBadge,
} from "@/lib/invoicing/formatters";
import RecurringForm from "@/components/invoicing/recurring-form";
import InvoiceCard from "@/components/invoicing/invoice-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";

export default function RecurringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [recurring, setRecurring] = useState<RecurringInvoice | null>(null);
  const [generatedInvoices, setGeneratedInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recurringApi.getById(id);
      setRecurring(data);

      // Fetch invoices for this client
      if (data.clientId) {
        try {
          const invoiceResult = await invoiceApi.list({
            clientId: data.clientId,
            page: 1,
            limit: 10,
          });
          setGeneratedInvoices(invoiceResult.items);
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recurring invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePause = async () => {
    await recurringApi.pause(id);
    fetchData();
  };

  const handleResume = async () => {
    await recurringApi.resume(id);
    fetchData();
  };

  const handleCancel = async () => {
    await recurringApi.cancel(id);
    fetchData();
  };

  const handleUpdate = async (data: RecurringUpdateInput) => {
    await recurringApi.update(id, data as RecurringUpdateInput);
    setIsEditing(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !recurring) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error ?? "Recurring invoice not found"}</p>
          <Button onClick={() => router.push("/invoicing/recurring")} className="mt-4">
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  const totalAmount = recurring.templateItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Invoicing", href: "/invoicing" },
            { label: "Recurring", href: "/invoicing/recurring" },
            { label: recurring.client?.name ?? "Details" },
          ]}
        />

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {recurring.client?.name ?? "Recurring Invoice"}
            </h1>
            <StatusBadge
              status={getRecurringStatusBadge(recurring.status) as "active" | "inactive" | "pending" | "success" | "warning" | "error" | "info"}
              label={formatRecurringStatus(recurring.status)}
              showDot
            />
          </div>

          <div className="flex items-center gap-2">
            {recurring.status === "ACTIVE" && (
              <Button variant="outline" onClick={handlePause}>
                Pause
              </Button>
            )}
            {recurring.status === "PAUSED" && (
              <Button variant="outline" onClick={handleResume}>
                Resume
              </Button>
            )}
            {recurring.status !== "CANCELLED" && (
              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Cancel Recurring"
                confirmMessage="Are you sure? No more invoices will be generated from this template."
                onConfirm={handleCancel}
                variant="outline"
              >
                Cancel Schedule
              </ConfirmButton>
            )}
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel Edit" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          {isEditing ? (
            <RecurringForm
              recurring={recurring}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <Tabs>
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Generated Invoices</Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel>
                  <div className="space-y-6 py-4">
                    {/* Schedule info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Frequency</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatRecurringFrequency(recurring.frequency)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Amount per Invoice</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatPrice(totalAmount, recurring.currency)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Next Issue Date</p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatDate(recurring.nextIssueDate)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Occurrences</p>
                        <p className="text-lg font-semibold text-foreground">
                          {recurring.occurrences}
                          {recurring.maxOccurrences
                            ? ` / ${recurring.maxOccurrences}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="text-foreground">{formatDate(recurring.startDate)}</span>
                      </div>
                      {recurring.endDate && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">End Date:</span>
                          <span className="text-foreground">{formatDate(recurring.endDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Template Items */}
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-foreground">
                        Template Items
                      </h3>
                      <div className="space-y-2">
                        {recurring.templateItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {item.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} x {formatPrice(item.unitPrice, recurring.currency)}
                              </p>
                            </div>
                            <span className="font-medium text-foreground">
                              {formatPrice(item.quantity * item.unitPrice, recurring.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {recurring.notes && (
                      <div>
                        <h3 className="mb-1 font-semibold text-foreground">Notes</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {recurring.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* Generated Invoices Tab */}
                <TabPanel>
                  <div className="py-4">
                    {generatedInvoices.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {generatedInvoices.map((invoice) => (
                          <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            onClick={() =>
                              router.push(`/invoicing/invoices/${invoice.id}`)
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">
                        No invoices generated yet.
                      </p>
                    )}
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
