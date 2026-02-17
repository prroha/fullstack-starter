"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type StatCardVariant = "default" | "success" | "warning" | "error" | "info";

export type StatCardSize = "sm" | "md" | "lg";

export type TrendDirection = "up" | "down" | "neutral";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The main value to display */
  value: string | number;
  /** Label or title for the stat */
  label: string;
  /** Change percentage or value */
  change?: number;
  /** Trend direction (overrides automatic detection from change) */
  trend?: TrendDirection;
  /** Custom trend label */
  trendLabel?: string;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Color variant */
  variant?: StatCardVariant;
  /** Size variant */
  size?: StatCardSize;
  /** Whether the card is clickable */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Loading state */
  isLoading?: boolean;
}

// =====================================================
// Variant Configuration
// =====================================================

const variantConfig: Record<
  StatCardVariant,
  { border: string; iconBg: string; iconColor: string }
> = {
  default: {
    border: "border-border",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
  success: {
    border: "border-success/30",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  warning: {
    border: "border-warning/30",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  error: {
    border: "border-destructive/30",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  info: {
    border: "border-primary/30",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
};

const sizeConfig: Record<
  StatCardSize,
  { padding: string; value: string; label: string; change: string; icon: string; iconWrapper: string }
> = {
  sm: {
    padding: "p-3",
    value: "text-xl font-semibold",
    label: "text-xs",
    change: "text-xs",
    icon: "h-4 w-4",
    iconWrapper: "h-8 w-8",
  },
  md: {
    padding: "p-4",
    value: "text-2xl font-bold",
    label: "text-sm",
    change: "text-sm",
    icon: "h-5 w-5",
    iconWrapper: "h-10 w-10",
  },
  lg: {
    padding: "p-6",
    value: "text-3xl font-bold",
    label: "text-base",
    change: "text-base",
    icon: "h-6 w-6",
    iconWrapper: "h-12 w-12",
  },
};

// =====================================================
// Trend Icon Components
// =====================================================

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}

function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 7l-9.2 9.2M7 7v10h10" />
    </svg>
  );
}

function TrendNeutralIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

// =====================================================
// Skeleton Component
// =====================================================

function StatCardSkeleton({
  size = "md",
  className,
}: {
  size?: StatCardSize;
  className?: string;
}) {
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={cn(
        "rounded-lg border bg-card",
        sizeStyles.padding,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div
          className={cn(
            "rounded-lg bg-muted animate-pulse",
            sizeStyles.iconWrapper
          )}
        />
      </div>
    </div>
  );
}

// =====================================================
// StatCard Component
// =====================================================

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      value,
      label,
      change,
      trend,
      trendLabel,
      icon,
      variant = "default",
      size = "md",
      href,
      onClick,
      isLoading = false,
      ...props
    },
    ref
  ) => {
    // Return skeleton if loading
    if (isLoading) {
      return <StatCardSkeleton size={size} className={className} />;
    }

    const variantStyles = variantConfig[variant];
    const sizeStyles = sizeConfig[size];

    // Determine trend direction from change if not explicitly set
    const effectiveTrend: TrendDirection =
      trend ?? (change !== undefined ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : "neutral");

    // Format change value for display
    const changeDisplay =
      change !== undefined
        ? `${change > 0 ? "+" : ""}${change}%`
        : trendLabel;

    // Determine if the card is interactive
    const isInteractive = !!href || !!onClick;

    // Wrapper component based on interactivity
    const Wrapper = isInteractive
      ? href
        ? "a"
        : "button"
      : "div";

    const wrapperProps = href
      ? { href }
      : onClick
      ? { onClick, type: "button" as const }
      : {};

    // Extract only safe props to spread (exclude event handlers that differ between element types)
    const { style, id, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, role, tabIndex, title } = props;
    const safeProps = { style, id, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, role, tabIndex, title };

    return (
      <Wrapper
        ref={ref as React.Ref<HTMLDivElement & HTMLAnchorElement & HTMLButtonElement>}
        className={cn(
          "rounded-lg border bg-card text-left block w-full",
          variantStyles.border,
          sizeStyles.padding,
          isInteractive && [
            "transition-colors cursor-pointer",
            "hover:bg-accent/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          ],
          className
        )}
        {...wrapperProps}
        {...safeProps}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className={cn("text-muted-foreground", sizeStyles.label)}>
              {label}
            </p>
            <p className={cn("text-foreground mt-1", sizeStyles.value)}>
              {value}
            </p>
            {(changeDisplay || trendLabel) && (
              <div className={cn("flex items-center gap-1 mt-1", sizeStyles.change)}>
                {effectiveTrend === "up" && (
                  <TrendUpIcon className="h-4 w-4 text-success" />
                )}
                {effectiveTrend === "down" && (
                  <TrendDownIcon className="h-4 w-4 text-destructive" />
                )}
                {effectiveTrend === "neutral" && (
                  <TrendNeutralIcon className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    effectiveTrend === "up" && "text-success",
                    effectiveTrend === "down" && "text-destructive",
                    effectiveTrend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {changeDisplay}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "rounded-lg flex items-center justify-center flex-shrink-0",
                sizeStyles.iconWrapper,
                variantStyles.iconBg,
                variantStyles.iconColor
              )}
            >
              <span className={sizeStyles.icon}>{icon}</span>
            </div>
          )}
        </div>
      </Wrapper>
    );
  }
);
StatCard.displayName = "StatCard";

// =====================================================
// Exports
// =====================================================

export { StatCard, StatCardSkeleton };
