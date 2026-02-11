"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/api";

export interface RefundConfirmModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

export function RefundConfirmModal({
  order,
  open,
  onClose,
  onConfirm,
}: RefundConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(order.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Confirm Refund"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing..." : "Process Refund"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg" role="alert">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-destructive">This action cannot be undone</p>
            <p className="text-sm text-muted-foreground mt-1">
              Processing a refund will change the order status to REFUNDED and revoke any associated licenses.
            </p>
          </div>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Order</span>
            <span className="font-medium">{order.orderNumber}</span>
            <span className="text-muted-foreground">Customer</span>
            <span>{order.customerEmail}</span>
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
