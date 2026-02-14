"use client";

import { formatPrice } from "../../lib/invoicing/formatters";

interface InvoiceSummaryProps {
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency?: string;
}

export default function InvoiceSummary({
  subtotal,
  taxTotal,
  discountAmount,
  totalAmount,
  amountPaid,
  amountDue,
  currency = "usd",
}: InvoiceSummaryProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="text-foreground">{formatPrice(subtotal, currency)}</span>
      </div>

      {taxTotal > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span className="text-foreground">{formatPrice(taxTotal, currency)}</span>
        </div>
      )}

      {discountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="text-green-600">-{formatPrice(discountAmount, currency)}</span>
        </div>
      )}

      <div className="border-t border-border pt-2">
        <div className="flex justify-between font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{formatPrice(totalAmount, currency)}</span>
        </div>
      </div>

      {amountPaid > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Paid</span>
          <span className="text-green-600">{formatPrice(amountPaid, currency)}</span>
        </div>
      )}

      <div className="flex justify-between font-semibold text-lg border-t border-border pt-2">
        <span className="text-foreground">Amount Due</span>
        <span className={amountDue > 0 ? "text-destructive" : "text-green-600"}>
          {formatPrice(amountDue, currency)}
        </span>
      </div>
    </div>
  );
}
