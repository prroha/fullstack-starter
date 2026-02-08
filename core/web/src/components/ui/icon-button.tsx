"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type IconButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost";

export type IconButtonSize = "xs" | "sm" | "md" | "lg";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Accessible label (required for accessibility) */
  "aria-label": string;
  /** Button variant */
  variant?: IconButtonVariant;
  /** Button size */
  size?: IconButtonSize;
  /** Loading state */
  isLoading?: boolean;
}

// =====================================================
// IconButton Component
// =====================================================

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon,
      variant = "default",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    };

    const sizes = {
      xs: "h-6 w-6",
      sm: "h-8 w-8",
      md: "h-9 w-9",
      lg: "h-10 w-10",
    };

    const iconSizes = {
      xs: "h-3 w-3",
      sm: "h-4 w-4",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className={cn("animate-spin", iconSizes[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <span className={cn("flex-shrink-0", iconSizes[size])}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton };
