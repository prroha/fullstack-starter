import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "success"
  | "warning"
  | "error"
  | "info";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Status type */
  status: StatusType;
  /** Whether to show the dot indicator */
  showDot?: boolean;
  /** Custom label (overrides default status label) */
  label?: string;
}

// =====================================================
// StatusBadge Component
// =====================================================

const statusConfig: Record<
  StatusType,
  { label: string; bgClass: string; textClass: string; dotClass: string }
> = {
  active: {
    label: "Active",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-400",
    dotClass: "bg-green-500",
  },
  inactive: {
    label: "Inactive",
    bgClass: "bg-gray-100 dark:bg-gray-800",
    textClass: "text-gray-700 dark:text-gray-400",
    dotClass: "bg-gray-500",
  },
  pending: {
    label: "Pending",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
    textClass: "text-yellow-700 dark:text-yellow-400",
    dotClass: "bg-yellow-500",
  },
  success: {
    label: "Success",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-400",
    dotClass: "bg-green-500",
  },
  warning: {
    label: "Warning",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    textClass: "text-orange-700 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
  error: {
    label: "Error",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    textClass: "text-red-700 dark:text-red-400",
    dotClass: "bg-red-500",
  },
  info: {
    label: "Info",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    textClass: "text-blue-700 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, showDot = true, label, ...props }, ref) => {
    const config = statusConfig[status];
    const displayLabel = label ?? config.label;

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
          config.bgClass,
          config.textClass,
          className
        )}
        {...props}
      >
        {showDot && (
          <span
            className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)}
            aria-hidden="true"
          />
        )}
        {displayLabel}
      </span>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
