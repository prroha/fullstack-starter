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
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PROCESSING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-red-500/10 text-red-600 dark:text-red-400",
  REFUNDED: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  CANCELLED: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
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
        orderStatusStyles[status] || "bg-gray-500/10 text-gray-600",
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
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  EXPIRED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  REVOKED: "bg-red-500/10 text-red-600 dark:text-red-400",
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
        licenseStatusStyles[status] || "bg-gray-500/10 text-gray-600",
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
  STARTER: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  PRO: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  BUSINESS: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  ENTERPRISE: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
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
        tierStyles[normalizedTier] || "bg-gray-500/10 text-gray-600",
        className
      )}
    >
      {displayTier}
    </span>
  );
}
