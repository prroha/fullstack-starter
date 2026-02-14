"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import type { RecurringInvoice } from "../../lib/invoicing/types";
import {
  formatRecurringFrequency,
  formatRecurringStatus,
  getRecurringStatusBadge,
  formatDate,
  formatPrice,
} from "../../lib/invoicing/formatters";

interface RecurringCardProps {
  recurring: RecurringInvoice;
  onClick?: (recurring: RecurringInvoice) => void;
}

export default function RecurringCard({
  recurring,
  onClick,
}: RecurringCardProps) {
  const handleClick = () => {
    onClick?.(recurring);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(recurring);
    }
  };

  const totalAmount = recurring.templateItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

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
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground truncate">
            {recurring.client?.name ?? "Unknown Client"}
          </span>
          <StatusBadge
            status={getRecurringStatusBadge(recurring.status) as "active" | "inactive" | "pending" | "success" | "warning" | "error" | "info"}
            label={formatRecurringStatus(recurring.status)}
            showDot
          />
        </div>
        <Badge variant="secondary" size="sm">
          {formatRecurringFrequency(recurring.frequency)}
        </Badge>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
        <p>Next issue: {formatDate(recurring.nextIssueDate)}</p>
        <p>
          {recurring.occurrences} issued
          {recurring.maxOccurrences
            ? ` of ${recurring.maxOccurrences}`
            : ""}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-bold text-foreground">
          {formatPrice(totalAmount, recurring.currency)}
        </span>
        {onClick && (
          <span className="text-sm font-medium text-primary hover:underline">
            View Details
          </span>
        )}
      </div>
    </div>
  );
}
