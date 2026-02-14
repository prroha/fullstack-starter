"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { clientApi, invoiceApi } from "@/lib/invoicing/api";
import { formatPrice, formatDate } from "@/lib/invoicing/formatters";
import type {
  InvoicingClient,
  ClientCreateInput,
  Invoice,
  PaginatedResponse,
} from "@/lib/invoicing/types";
import ClientForm from "@/components/invoicing/client-form";
import InvoiceCard from "@/components/invoicing/invoice-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: clientId } = use(params);

  const [client, setClient] = useState<InvoicingClient | null>(null);
  const [stats, setStats] = useState<{
    invoiceCount: number;
    totalBilled: number;
    totalPaid: number;
  } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [clientData, statsData, invoiceData] = await Promise.all([
        clientApi.getById(clientId),
        clientApi.getStats(clientId),
        invoiceApi.list({ clientId, page: 1, limit: 50 }),
      ]);
      setClient(clientData);
      setStats(statsData);
      setInvoices(invoiceData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load client");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async (data: ClientCreateInput) => {
    try {
      const updated = await clientApi.update(clientId, data);
      setClient(updated);
      setIsEditing(false);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update client");
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await clientApi.delete(clientId);
      router.push("/invoicing/clients");
    } catch (err) {
      setDeleting(false);
      setError(err instanceof Error ? err.message : "Failed to delete client");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !client) {
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

  if (!client) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Invoicing", href: "/invoicing" },
              { label: "Clients", href: "/invoicing/clients" },
              { label: client.name },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {client.name}
              </h1>
              {client.companyName && (
                <p className="mt-1 text-muted-foreground">
                  {client.companyName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={isEditing ? "secondary" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel Edit" : "Edit"}
              </Button>
              <ConfirmButton
                confirmMode="dialog"
                confirmTitle="Delete Client"
                confirmMessage={`Are you sure you want to delete "${client.name}"? This action cannot be undone. All associated invoices will remain but will no longer be linked to this client.`}
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={handleDelete}
                disabled={deleting}
              >
                Delete
              </ConfirmButton>
              <Button
                onClick={() =>
                  router.push(
                    `/invoicing/invoices/new?clientId=${client.id}`
                  )
                }
              >
                New Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Invoices"
              value={stats.invoiceCount}
              variant="info"
            />
            <StatCard
              label="Total Billed"
              value={formatPrice(stats.totalBilled)}
              variant="default"
            />
            <StatCard
              label="Total Paid"
              value={formatPrice(stats.totalPaid)}
              variant="success"
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs>
          <TabList>
            <Tab>Details</Tab>
            <Tab>Invoices</Tab>
          </TabList>
          <TabPanels>
            {/* Details Tab */}
            <TabPanel>
              <div className="rounded-lg border border-border bg-card p-6">
                {isEditing ? (
                  <ClientForm
                    client={client}
                    onSubmit={handleUpdate}
                    onCancel={() => setIsEditing(false)}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Basic Information
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ReadOnlyField label="Name" value={client.name} />
                        <ReadOnlyField
                          label="Company"
                          value={client.companyName}
                        />
                        <ReadOnlyField label="Email" value={client.email} />
                        <ReadOnlyField label="Phone" value={client.phone} />
                        <ReadOnlyField label="Tax ID" value={client.taxId} />
                      </div>
                    </div>

                    {/* Billing Address */}
                    {client.billingAddress && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Billing Address
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <ReadOnlyField
                            label="Street Address"
                            value={client.billingAddress.line1}
                          />
                          <ReadOnlyField
                            label="Address Line 2"
                            value={client.billingAddress.line2}
                          />
                          <ReadOnlyField
                            label="City"
                            value={client.billingAddress.city}
                          />
                          <ReadOnlyField
                            label="State / Province"
                            value={client.billingAddress.state}
                          />
                          <ReadOnlyField
                            label="Postal Code"
                            value={client.billingAddress.postalCode}
                          />
                          <ReadOnlyField
                            label="Country"
                            value={client.billingAddress.country}
                          />
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {client.notes && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Notes
                        </h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {client.notes}
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="border-t border-border pt-4 text-sm text-muted-foreground">
                      <p>Created: {formatDate(client.createdAt)}</p>
                      <p>Last updated: {formatDate(client.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Invoices Tab */}
            <TabPanel>
              {invoices.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {invoices.map((invoice) => (
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
                <EmptyState
                  icon={FileText}
                  title="No invoices yet"
                  description={`No invoices have been created for ${client.name}. Create one to get started.`}
                  action={{
                    label: "New Invoice",
                    onClick: () =>
                      router.push(
                        `/invoicing/invoices/new?clientId=${client.id}`
                      ),
                  }}
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}

// =============================================================================
// ReadOnlyField Helper
// =============================================================================

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      <p className="text-sm text-foreground">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </p>
    </div>
  );
}
