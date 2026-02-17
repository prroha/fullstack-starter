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
    bgClass: "bg-success/10",
    textClass: "text-success",
    dotClass: "bg-success",
  },
  inactive: {
    label: "Inactive",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  pending: {
    label: "Pending",
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    dotClass: "bg-warning",
  },
  success: {
    label: "Success",
    bgClass: "bg-success/10",
    textClass: "text-success",
    dotClass: "bg-success",
  },
  warning: {
    label: "Warning",
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    dotClass: "bg-warning",
  },
  error: {
    label: "Error",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    dotClass: "bg-destructive",
  },
  info: {
    label: "Info",
    bgClass: "bg-primary/10",
    textClass: "text-primary",
    dotClass: "bg-primary",
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
