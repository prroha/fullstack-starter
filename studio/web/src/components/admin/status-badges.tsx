"use client";

import { cn } from "@/lib/utils";

// =====================================================
// Order Status Badge
// =====================================================

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

const orderStatusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  PROCESSING: "bg-primary/10 text-primary",
  COMPLETED: "bg-success/10 text-success",
  FAILED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        orderStatusStyles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </span>
  );
}

// =====================================================
// License Status Badge
// =====================================================

export type LicenseStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

const licenseStatusStyles: Record<LicenseStatus, string> = {
  ACTIVE: "bg-success/10 text-success",
  EXPIRED: "bg-warning/10 text-warning",
  REVOKED: "bg-destructive/10 text-destructive",
};

export interface LicenseStatusBadgeProps {
  status: LicenseStatus;
  className?: string;
}

export function LicenseStatusBadge({ status, className }: LicenseStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        licenseStatusStyles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </span>
  );
}

// =====================================================
// Tier Badge
// =====================================================

export type PricingTier = "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";

const tierStyles: Record<PricingTier, string> = {
  STARTER: "bg-muted text-muted-foreground",
  PRO: "bg-primary/10 text-primary",
  BUSINESS: "bg-accent/10 text-accent",
  ENTERPRISE: "bg-warning/10 text-warning",
};

export interface TierBadgeProps {
  tier: PricingTier | string;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const normalizedTier = tier.toUpperCase() as PricingTier;
  const displayTier = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        tierStyles[normalizedTier] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {displayTier}
    </span>
  );
}
