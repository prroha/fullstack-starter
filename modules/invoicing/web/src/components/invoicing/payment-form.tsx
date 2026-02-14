"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import type { PaymentCreateInput, PaymentMethod } from "../../lib/invoicing/types";
import { PAYMENT_METHOD_OPTIONS } from "../../lib/invoicing/constants";

interface PaymentFormProps {
  maxAmount?: number;
  currency?: string;
  onSubmit: (data: PaymentCreateInput) => Promise<void>;
  onCancel?: () => void;
}

export default function PaymentForm({
  maxAmount,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (maxAmount !== undefined && amountCents > maxAmount) {
      setError("Amount exceeds the remaining balance");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        amount: amountCents,
        method,
        reference: reference.trim() || undefined,
        paidAt: new Date(paidAt).toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payAmount" required>
            Amount
          </Label>
          <Input
            id="payAmount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payMethod" required>
            Payment Method
          </Label>
          <Select
            value={method}
            onChange={(val) => setMethod(val as PaymentMethod)}
            options={PAYMENT_METHOD_OPTIONS}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payDate" required>
            Payment Date
          </Label>
          <Input
            id="payDate"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payRef">Reference / Note</Label>
          <Input
            id="payRef"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Check #1234, Transaction ID, etc."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          Record Payment
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
