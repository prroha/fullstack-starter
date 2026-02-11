"use client";

import { Modal } from "@/components/ui";
import { OrderStatusBadge } from "@/components/admin";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/api";

export interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({
  order,
  open,
  onClose,
}: OrderDetailsModalProps) {
  if (!order) return null;

  return (
    <Modal isOpen={open} onClose={onClose} title={`Order ${order.orderNumber}`} size="lg">
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Customer Info */}
        <section className="border rounded-lg p-4 space-y-2" aria-labelledby="customer-info-heading">
          <h3 id="customer-info-heading" className="font-medium">Customer Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{order.customerEmail}</span>
            <span className="text-muted-foreground">Name</span>
            <span>{order.customerName || "-"}</span>
          </div>
        </section>

        {/* Order Info */}
        <section className="border rounded-lg p-4 space-y-2" aria-labelledby="order-details-heading">
          <h3 id="order-details-heading" className="font-medium">Order Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Tier</span>
            <span>{order.tier}</span>
            <span className="text-muted-foreground">Template</span>
            <span>{order.template?.name || "Custom"}</span>
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatCurrency(order.total)}</span>
            {order.coupon && (
              <>
                <span className="text-muted-foreground">Coupon</span>
                <span className="text-success">{order.coupon.code}</span>
              </>
            )}
          </div>
        </section>

        {/* Payment Info */}
        <section className="border rounded-lg p-4 space-y-2" aria-labelledby="payment-info-heading">
          <h3 id="payment-info-heading" className="font-medium">Payment Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Created</span>
            <span>{formatDateTime(order.createdAt)}</span>
            <span className="text-muted-foreground">Paid At</span>
            <span>{order.paidAt ? formatDateTime(order.paidAt) : "-"}</span>
            <span className="text-muted-foreground">Stripe ID</span>
            <span className="font-mono text-xs truncate">
              {order.stripePaymentIntentId || "-"}
            </span>
          </div>
        </section>

        {/* License Info */}
        {order.license && (
          <section className="border rounded-lg p-4 space-y-2" aria-labelledby="license-info-heading">
            <h3 id="license-info-heading" className="font-medium">License Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">License Status</span>
              <span>{order.license.status}</span>
              <span className="text-muted-foreground">Downloads</span>
              <span>{order.license.downloadCount}</span>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
