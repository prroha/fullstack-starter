"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Stack Component
// =====================================================

type SpacingValue = "none" | "xs" | "sm" | "md" | "lg" | "xl";
type DirectionValue = "vertical" | "horizontal";
type AlignValue = "start" | "center" | "end" | "stretch";
type JustifyValue = "start" | "center" | "end" | "between" | "around" | "evenly";

interface StackProps extends React.HTMLAttributes<HTMLElement> {
  /** Content to stack */
  children: React.ReactNode;
  /** Stack direction */
  direction?: DirectionValue;
  /** Gap between items */
  spacing?: SpacingValue;
  /** Cross-axis alignment */
  align?: AlignValue;
  /** Main-axis alignment */
  justify?: JustifyValue;
  /** Allow items to wrap */
  wrap?: boolean;
  /** Optional divider between items */
  divider?: React.ReactNode;
  /** Render as different element */
  as?: React.ElementType;
}

const Stack = React.forwardRef<HTMLElement, StackProps>(
  (
    {
      className,
      children,
      direction = "vertical",
      spacing = "md",
      align = "stretch",
      justify,
      wrap = false,
      divider,
      as: Component = "div",
      ...props
    },
    ref
  ) => {
    const directionClasses = {
      vertical: "flex-col",
      horizontal: "flex-row",
    };

    const spacingClasses = {
      none: "gap-0",
      xs: "gap-2", // 0.5rem
      sm: "gap-3", // 0.75rem
      md: "gap-4", // 1rem
      lg: "gap-6", // 1.5rem
      xl: "gap-8", // 2rem
    };

    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    };

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };

    // If no divider, render children directly
    if (!divider) {
      return (
        <Component
          ref={ref}
          className={cn(
            "flex",
            directionClasses[direction],
            spacingClasses[spacing],
            alignClasses[align],
            justify && justifyClasses[justify],
            wrap && "flex-wrap",
            className
          )}
          {...props}
        >
          {children}
        </Component>
      );
    }

    // With divider, interleave dividers between children
    const childArray = React.Children.toArray(children).filter(Boolean);
    const itemsWithDividers: React.ReactNode[] = [];

    childArray.forEach((child, index) => {
      itemsWithDividers.push(
        <React.Fragment key={`item-${index}`}>{child}</React.Fragment>
      );

      if (index < childArray.length - 1) {
        itemsWithDividers.push(
          <React.Fragment key={`divider-${index}`}>{divider}</React.Fragment>
        );
      }
    });

    return (
      <Component
        ref={ref}
        className={cn(
          "flex",
          directionClasses[direction],
          spacingClasses[spacing],
          alignClasses[align],
          justify && justifyClasses[justify],
          wrap && "flex-wrap",
          className
        )}
        {...props}
      >
        {itemsWithDividers}
      </Component>
    );
  }
);
Stack.displayName = "Stack";

export { Stack };
export type { StackProps, SpacingValue, DirectionValue, AlignValue, JustifyValue };
