"use client";

import type { InvoiceActivity as ActivityType } from "../../lib/invoicing/types";
import { formatDate } from "../../lib/invoicing/formatters";

interface InvoiceActivityProps {
  activities: ActivityType[];
}

const actionLabels: Record<string, string> = {
  created: "Invoice created",
  updated: "Invoice updated",
  sent: "Invoice sent to client",
  viewed: "Invoice viewed by client",
  payment_recorded: "Payment recorded",
  payment_deleted: "Payment removed",
  voided: "Invoice voided",
  duplicated: "Invoice duplicated",
  status_changed: "Status changed",
};

export default function InvoiceActivityLog({
  activities,
}: InvoiceActivityProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative flex gap-3 pb-6 last:pb-0">
          {/* Timeline line */}
          {index < activities.length - 1 && (
            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
          )}

          {/* Timeline dot */}
          <div className="relative z-10 mt-1.5 h-[15px] w-[15px] flex-shrink-0 rounded-full border-2 border-primary bg-background" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {actionLabels[activity.action] ?? activity.action}
            </p>
            {activity.details && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {activity.details}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
