"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";
import type { Order, OrderStatus } from "@/lib/api";

// Order status options for the dropdown
const ORDER_STATUSES: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELLED", label: "Cancelled" },
];

export interface StatusUpdateModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (orderId: string, status: OrderStatus) => void;
}

export function StatusUpdateModal({
  order,
  open,
  onClose,
  onUpdate,
}: StatusUpdateModalProps) {
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(order.id, status);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Update Order Status"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || status === order.status}
          >
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="order-status-select" className="block text-sm font-medium mb-2">
            Order: {order.orderNumber}
          </label>
          <select
            id="order-status-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Select order status"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
