"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Button Component
// =====================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  /** Render as child element (e.g., Link) with button styling */
  asChild?: boolean;
}

// Button style utilities for use with asChild
const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

// Content-first sizing: slightly tighter padding while maintaining touch-friendliness
const buttonSizes = {
  default: "h-9 px-3 py-1.5",  // 36px height (was 40px), 12px horizontal (was 16px)
  sm: "h-8 rounded-md px-2.5", // 32px height (was 36px), 10px horizontal (was 12px)
  lg: "h-10 rounded-md px-6",  // 40px height (was 44px), 24px horizontal (was 32px)
  icon: "h-9 w-9",             // 36px (was 40px)
};

function getButtonClasses(
  variant: keyof typeof buttonVariants = "default",
  size: keyof typeof buttonSizes = "default",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, asChild, children, disabled, ...props }, ref) => {
    const buttonClasses = getButtonClasses(variant, size, className);

    // If asChild, clone the child element with button styles
    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<Record<string, unknown>>;
      return React.cloneElement(childElement, {
        className: cn(buttonClasses, childElement.props.className as string | undefined),
      } as Record<string, unknown>);
    }

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
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
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
