"use client";

import type { Invoice } from "../../lib/invoicing/types";
import { formatPrice, formatDate } from "../../lib/invoicing/formatters";
import InvoiceStatusBadge from "./invoice-status-badge";

interface InvoiceCardProps {
  invoice: Invoice;
  onClick?: (invoice: Invoice) => void;
}

export default function InvoiceCard({ invoice, onClick }: InvoiceCardProps) {
  const handleClick = () => {
    onClick?.(invoice);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(invoice);
    }
  };

  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 transition-shadow ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      }`}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-foreground truncate">
            {invoice.invoiceNumber}
          </span>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <span className="text-sm text-muted-foreground flex-shrink-0">
          {formatDate(invoice.issueDate)}
        </span>
      </div>

      {/* Client info */}
      <div className="mt-2 text-sm text-muted-foreground">
        {invoice.client?.name ?? "Unknown Client"}
        {invoice.client?.companyName && (
          <span className="ml-1">&mdash; {invoice.client.companyName}</span>
        )}
      </div>

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-foreground">
          {formatPrice(invoice.totalAmount, invoice.currency)}
        </span>
        <div className="flex items-center gap-3 text-sm">
          {invoice.amountDue > 0 && (
            <span className="text-muted-foreground">
              Due: {formatPrice(invoice.amountDue, invoice.currency)}
            </span>
          )}
          {onClick && (
            <span className="font-medium text-primary hover:underline">
              View
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
