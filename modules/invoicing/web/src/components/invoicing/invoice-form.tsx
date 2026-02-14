"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import { Spinner } from "@/components/ui/spinner";
import { clientApi } from "../../lib/invoicing/api";
import { CURRENCY_OPTIONS } from "../../lib/invoicing/constants";
import type {
  Invoice,
  InvoiceCreateInput,
  InvoiceUpdateInput,
  InvoicingClient,
} from "../../lib/invoicing/types";

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSubmit: (data: InvoiceCreateInput | InvoiceUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

export default function InvoiceForm({
  invoice,
  onSubmit,
  onCancel,
}: InvoiceFormProps) {
  const [clients, setClients] = useState<InvoicingClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [clientId, setClientId] = useState(invoice?.clientId ?? "");
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate
      ? new Date(invoice.issueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate
      ? new Date(invoice.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [currency, setCurrency] = useState(invoice?.currency ?? "usd");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [terms, setTerms] = useState(invoice?.terms ?? "");
  const [discountAmount, setDiscountAmount] = useState(
    invoice?.discountAmount ? String(invoice.discountAmount / 100) : ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const result = await clientApi.list(1, 100);
      setClients(result.items);
    } catch {
      // Non-critical
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Auto-set due date 30 days from issue date when creating
  useEffect(() => {
    if (!invoice && issueDate && !dueDate) {
      const date = new Date(issueDate);
      date.setDate(date.getDate() + 30);
      setDueDate(date.toISOString().split("T")[0]);
    }
  }, [invoice, issueDate, dueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !issueDate || !dueDate) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data: InvoiceCreateInput | InvoiceUpdateInput = {
        clientId,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        currency,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        discountAmount: discountAmount
          ? Math.round(parseFloat(discountAmount) * 100)
          : undefined,
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientOptions = [
    { value: "", label: "Select a client..." },
    ...clients.map((c) => ({
      value: c.id,
      label: c.companyName ? `${c.name} (${c.companyName})` : c.name,
    })),
  ];

  if (loadingClients) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clientId" required>
            Client
          </Label>
          <Select
            value={clientId}
            onChange={setClientId}
            options={clientOptions}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={currency}
            onChange={setCurrency}
            options={CURRENCY_OPTIONS}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="issueDate" required>
            Issue Date
          </Label>
          <Input
            id="issueDate"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate" required>
            Due Date
          </Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discountAmount">Discount Amount</Label>
        <Input
          id="discountAmount"
          type="number"
          step="0.01"
          min="0"
          value={discountAmount}
          onChange={(e) => setDiscountAmount(e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes visible to the client on the invoice..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms">Terms & Conditions</Label>
        <Textarea
          id="terms"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="Payment terms, late fees, etc."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {invoice ? "Update Invoice" : "Create Invoice"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
