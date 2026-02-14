"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ConfirmButton } from "@/components/ui/confirm-button";
import type { InvoicePayment } from "../../lib/invoicing/types";
import { formatPrice, formatDate, formatPaymentMethod } from "../../lib/invoicing/formatters";

interface PaymentListProps {
  payments: InvoicePayment[];
  currency?: string;
  onDelete?: (paymentId: string) => Promise<void>;
}

export default function PaymentList({
  payments,
  currency = "usd",
  onDelete,
}: PaymentListProps) {
  if (payments.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No payments recorded yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          {onDelete && <TableHead className="w-20" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{formatDate(payment.paidAt)}</TableCell>
            <TableCell>{formatPaymentMethod(payment.method)}</TableCell>
            <TableCell className="text-muted-foreground">
              {payment.reference || "—"}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatPrice(payment.amount, currency)}
            </TableCell>
            {onDelete && (
              <TableCell className="text-right">
                <ConfirmButton
                  confirmMode="dialog"
                  confirmTitle="Delete Payment"
                  confirmMessage="Are you sure you want to delete this payment? The invoice balance will be recalculated."
                  onConfirm={() => onDelete(payment.id)}
                  variant="ghost"
                  size="sm"
                >
                  Delete
                </ConfirmButton>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
