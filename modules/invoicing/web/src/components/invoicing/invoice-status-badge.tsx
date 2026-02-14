"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import type { InvoiceStatus } from "../../lib/invoicing/types";
import {
  formatInvoiceStatus,
  getInvoiceStatusBadge,
} from "../../lib/invoicing/formatters";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export default function InvoiceStatusBadge({
  status,
}: InvoiceStatusBadgeProps) {
  return (
    <StatusBadge
      status={getInvoiceStatusBadge(status) as "active" | "inactive" | "pending" | "success" | "warning" | "error" | "info"}
      label={formatInvoiceStatus(status)}
      showDot
    />
  );
}
