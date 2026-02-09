"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Progress Component - Types
// =====================================================

export type ProgressSize = "sm" | "md" | "lg";
export type ProgressColor = "default" | "success" | "warning" | "error";
export type ProgressVariant = "linear" | "circular";

interface BaseProgressProps {
  /** Progress value (0-100). If undefined, shows indeterminate state */
  value?: number;
  /** Size variant */
  size?: ProgressSize;
  /** Color variant */
  color?: ProgressColor;
  /** Show label/percentage */
  showLabel?: boolean;
  /** Custom label (overrides percentage display) */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface LinearProgressProps extends BaseProgressProps {
  /** Progress variant */
  variant?: "linear";
}

export interface CircularProgressProps extends BaseProgressProps {
  /** Progress variant */
  variant?: "circular";
  /** Stroke width for circular progress */
  strokeWidth?: number;
}

export type ProgressProps = LinearProgressProps | CircularProgressProps;

// =====================================================
// Size and Color Configurations
// =====================================================

const linearSizeStyles: Record<ProgressSize, string> = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const circularSizeStyles: Record<ProgressSize, { size: number; strokeWidth: number }> = {
  sm: { size: 32, strokeWidth: 3 },
  md: { size: 48, strokeWidth: 4 },
  lg: { size: 64, strokeWidth: 5 },
};

const colorStyles: Record<ProgressColor, string> = {
  default: "bg-primary",
  success: "bg-green-500 dark:bg-green-400",
  warning: "bg-yellow-500 dark:bg-yellow-400",
  error: "bg-red-500 dark:bg-red-400",
};

const circularColorStyles: Record<ProgressColor, string> = {
  default: "stroke-primary",
  success: "stroke-green-500 dark:stroke-green-400",
  warning: "stroke-yellow-500 dark:stroke-yellow-400",
  error: "stroke-red-500 dark:stroke-red-400",
};

const labelSizeStyles: Record<ProgressSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

// =====================================================
// Linear Progress Component
// =====================================================

function LinearProgress({
  value,
  size = "md",
  color = "default",
  showLabel = false,
  label,
  className,
}: LinearProgressProps) {
  const isIndeterminate = value === undefined;
  const clampedValue = isIndeterminate ? 0 : Math.min(100, Math.max(0, value));
  const displayLabel = label ?? `${Math.round(clampedValue)}%`;

  return (
    <div className={cn("w-full", className)}>
      {showLabel && !isIndeterminate && (
        <div className={cn("mb-1 text-right text-muted-foreground", labelSizeStyles[size])}>
          {displayLabel}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isIndeterminate ? "Loading" : displayLabel}
        className={cn(
          "w-full overflow-hidden rounded-full bg-secondary",
          linearSizeStyles[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-in-out",
            colorStyles[color],
            isIndeterminate && "animate-progress-indeterminate"
          )}
          style={{
            width: isIndeterminate ? "50%" : `${clampedValue}%`,
            ...(isIndeterminate && {
              animation: "progress-indeterminate 1.5s ease-in-out infinite",
            }),
          }}
        />
      </div>
    </div>
  );
}

// =====================================================
// Circular Progress Component
// =====================================================

function CircularProgress({
  value,
  size = "md",
  color = "default",
  showLabel = false,
  label,
  className,
  strokeWidth: customStrokeWidth,
}: CircularProgressProps) {
  const isIndeterminate = value === undefined;
  const clampedValue = isIndeterminate ? 0 : Math.min(100, Math.max(0, value));
  const displayLabel = label ?? `${Math.round(clampedValue)}%`;

  const { size: svgSize, strokeWidth: defaultStrokeWidth } = circularSizeStyles[size];
  const strokeWidth = customStrokeWidth ?? defaultStrokeWidth;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={isIndeterminate ? "Loading" : displayLabel}
      className={cn("relative inline-flex items-center justify-center", className)}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className={cn(isIndeterminate && "animate-spin")}
        style={{ animationDuration: isIndeterminate ? "1.4s" : undefined }}
      >
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        {/* Progress circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300 ease-in-out",
            circularColorStyles[color]
          )}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: isIndeterminate ? circumference * 0.75 : strokeDashoffset,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      {showLabel && !isIndeterminate && (
        <span
          className={cn(
            "absolute font-medium text-foreground",
            size === "sm" && "text-[8px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
}

// =====================================================
// Main Progress Component
// =====================================================

/**
 * Progress component for indicating completion or loading state.
 * Supports both linear (bar) and circular (spinner-like) variants.
 *
 * @example
 * ```tsx
 * // Linear determinate progress
 * <Progress value={75} showLabel />
 *
 * // Linear indeterminate progress
 * <Progress />
 *
 * // Circular progress with custom color
 * <Progress variant="circular" value={50} color="success" showLabel />
 *
 * // Size variants
 * <Progress size="sm" value={30} />
 * <Progress size="lg" value={80} color="warning" />
 * ```
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ variant = "linear", ...props }, ref) => {
    if (variant === "circular") {
      return (
        <div ref={ref}>
          <CircularProgress {...(props as CircularProgressProps)} />
        </div>
      );
    }
    return (
      <div ref={ref}>
        <LinearProgress {...(props as LinearProgressProps)} />
      </div>
    );
  }
);
Progress.displayName = "Progress";

// =====================================================
// Additional keyframes for indeterminate animation
// (Add to your global CSS or tailwind config)
// =====================================================
// @keyframes progress-indeterminate {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(200%); }
// }

export { Progress, LinearProgress, CircularProgress };
