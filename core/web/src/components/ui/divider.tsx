import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Divider Component
// =====================================================

export type DividerOrientation = "horizontal" | "vertical";
export type DividerVariant = "solid" | "dashed";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation of the divider */
  orientation?: DividerOrientation;
  /** Visual variant */
  variant?: DividerVariant;
  /** Optional label to display in the center */
  label?: string;
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      className,
      orientation = "horizontal",
      variant = "solid",
      label,
      ...props
    },
    ref
  ) => {
    const baseStyles = "bg-border";

    const _variantStyles: Record<DividerVariant, string> = {
      solid: "",
      dashed:
        "bg-transparent border-0 border-border border-dashed",
    };

    // Horizontal divider with optional label
    if (orientation === "horizontal") {
      if (label) {
        return (
          <div
            ref={ref}
            role="separator"
            aria-orientation="horizontal"
            className={cn("flex items-center w-full", className)}
            {...props}
          >
            <div
              className={cn(
                "flex-1 h-px",
                baseStyles,
                variant === "dashed" && "border-t border-dashed border-border bg-transparent"
              )}
            />
            <span className="px-3 text-sm text-muted-foreground">{label}</span>
            <div
              className={cn(
                "flex-1 h-px",
                baseStyles,
                variant === "dashed" && "border-t border-dashed border-border bg-transparent"
              )}
            />
          </div>
        );
      }

      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn(
            "w-full h-px",
            baseStyles,
            variant === "dashed" && "border-t border-dashed border-border bg-transparent",
            className
          )}
          {...props}
        />
      );
    }

    // Vertical divider (cannot have label)
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "h-full w-px self-stretch",
          baseStyles,
          variant === "dashed" && "border-l border-dashed border-border bg-transparent",
          className
        )}
        {...props}
      />
    );
  }
);
Divider.displayName = "Divider";

export { Divider };
