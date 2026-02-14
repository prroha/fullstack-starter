"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import { Spinner } from "@/components/ui/spinner";
import { clientApi, taxRateApi } from "../../lib/invoicing/api";
import { CURRENCY_OPTIONS } from "../../lib/invoicing/constants";
import type {
  RecurringInvoice,
  RecurringCreateInput,
  RecurringUpdateInput,
  RecurringFrequency,
  InvoicingClient,
  TaxRate,
  InvoiceItemInput,
} from "../../lib/invoicing/types";

interface RecurringFormProps {
  recurring?: RecurringInvoice | null;
  onSubmit: (data: RecurringCreateInput | RecurringUpdateInput) => Promise<void>;
  onCancel?: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

export default function RecurringForm({
  recurring,
  onSubmit,
  onCancel,
}: RecurringFormProps) {
  const [clients, setClients] = useState<InvoicingClient[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientId, setClientId] = useState(recurring?.clientId ?? "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(
    recurring?.frequency ?? "MONTHLY"
  );
  const [startDate, setStartDate] = useState(
    recurring?.startDate
      ? new Date(recurring.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    recurring?.endDate
      ? new Date(recurring.endDate).toISOString().split("T")[0]
      : ""
  );
  const [maxOccurrences, setMaxOccurrences] = useState(
    recurring?.maxOccurrences ? String(recurring.maxOccurrences) : ""
  );
  const [currency, setCurrency] = useState(recurring?.currency ?? "usd");
  const [notes, setNotes] = useState(recurring?.notes ?? "");
  const [terms, setTerms] = useState(recurring?.terms ?? "");

  // Template items
  const [templateItems, setTemplateItems] = useState<InvoiceItemInput[]>(
    recurring?.templateItems ?? []
  );
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [newTaxId, setNewTaxId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [clientResult, taxRateResult] = await Promise.all([
        clientApi.list(1, 100),
        taxRateApi.list(),
      ]);
      setClients(clientResult.items);
      setTaxRates(taxRateResult);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTemplateItem = () => {
    if (!newDesc.trim() || !newPrice) return;
    setTemplateItems([
      ...templateItems,
      {
        description: newDesc.trim(),
        quantity: parseFloat(newQty) || 1,
        unitPrice: Math.round(parseFloat(newPrice) * 100),
        taxRateId: newTaxId || undefined,
      },
    ]);
    setNewDesc("");
    setNewQty("1");
    setNewPrice("");
    setNewTaxId("");
  };

  const removeTemplateItem = (index: number) => {
    setTemplateItems(templateItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !startDate || templateItems.length === 0) {
      setError("Client, start date, and at least one item are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: RecurringCreateInput | RecurringUpdateInput = {
        clientId,
        frequency,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        templateItems,
        currency,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        maxOccurrences: maxOccurrences ? parseInt(maxOccurrences, 10) : undefined,
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recurring invoice");
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

  const taxRateOptions = [
    { value: "", label: "No Tax" },
    ...taxRates.map((tr) => ({
      value: tr.id,
      label: `${tr.name} (${tr.rate}%)`,
    })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Schedule settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Schedule</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recClientId" required>
              Client
            </Label>
            <Select
              value={clientId}
              onChange={setClientId}
              options={clientOptions}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recFrequency" required>
              Frequency
            </Label>
            <Select
              value={frequency}
              onChange={(val) => setFrequency(val as RecurringFrequency)}
              options={FREQUENCY_OPTIONS}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="recStartDate" required>
              Start Date
            </Label>
            <Input
              id="recStartDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recEndDate">End Date</Label>
            <Input
              id="recEndDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recMaxOccurrences">Max Occurrences</Label>
            <Input
              id="recMaxOccurrences"
              type="number"
              min="1"
              value={maxOccurrences}
              onChange={(e) => setMaxOccurrences(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recCurrency">Currency</Label>
          <Select
            value={currency}
            onChange={setCurrency}
            options={CURRENCY_OPTIONS}
          />
        </div>
      </div>

      {/* Template Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Invoice Items</h3>

        {templateItems.length > 0 && (
          <div className="space-y-2">
            {templateItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {item.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} x ${(item.unitPrice / 100).toFixed(2)}
                  </p>
                </div>
                <span className="font-medium text-foreground">
                  ${((item.quantity * item.unitPrice) / 100).toFixed(2)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeTemplateItem(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
          <div className="flex-1 min-w-[200px] space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Item description"
              className="h-8"
            />
          </div>
          <div className="w-20 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Qty</span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="h-8 text-right"
            />
          </div>
          <div className="w-28 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Unit Price</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
              className="h-8 text-right"
            />
          </div>
          <div className="w-40 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Tax Rate</span>
            <Select
              value={newTaxId}
              onChange={setNewTaxId}
              options={taxRateOptions}
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={addTemplateItem}
            disabled={!newDesc.trim() || !newPrice}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recNotes">Notes</Label>
          <Textarea
            id="recNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for the generated invoices..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recTerms">Terms</Label>
          <Textarea
            id="recTerms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Payment terms..."
            rows={2}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {recurring ? "Update Recurring" : "Create Recurring Invoice"}
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
