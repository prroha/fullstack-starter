import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

type ResponsiveValue<T> = T | { sm?: T; md?: T; lg?: T; xl?: T };

type GapSize = "none" | "sm" | "md" | "lg" | "xl";
type AlignItems = "start" | "center" | "end" | "stretch";
type JustifyItems = "start" | "center" | "end" | "stretch";

// =====================================================
// Grid Component
// =====================================================

interface GridProps extends React.HTMLAttributes<HTMLElement> {
  /** Content to render inside the grid */
  children: React.ReactNode;
  /** Number of columns - can be a number or responsive object */
  cols?: ResponsiveValue<number>;
  /** Gap between grid items */
  gap?: GapSize;
  /** Override gap for row direction */
  rowGap?: GapSize;
  /** Override gap for column direction */
  colGap?: GapSize;
  /** Align items along the block axis */
  alignItems?: AlignItems;
  /** Justify items along the inline axis */
  justifyItems?: JustifyItems;
  /** Minimum child width for auto-fit grid (e.g., '250px') */
  minChildWidth?: string;
  /** Element type to render as */
  as?: React.ElementType;
  /** Additional CSS classes */
  className?: string;
}

const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

const rowGapClasses: Record<GapSize, string> = {
  none: "gap-y-0",
  sm: "gap-y-2",
  md: "gap-y-4",
  lg: "gap-y-6",
  xl: "gap-y-8",
};

const colGapClasses: Record<GapSize, string> = {
  none: "gap-x-0",
  sm: "gap-x-2",
  md: "gap-x-4",
  lg: "gap-x-6",
  xl: "gap-x-8",
};

const alignItemsClasses: Record<AlignItems, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyItemsClasses: Record<JustifyItems, string> = {
  start: "justify-items-start",
  center: "justify-items-center",
  end: "justify-items-end",
  stretch: "justify-items-stretch",
};

// Column class mappings for responsive grids
const colsClassMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

const smColsClassMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  7: "sm:grid-cols-7",
  8: "sm:grid-cols-8",
  9: "sm:grid-cols-9",
  10: "sm:grid-cols-10",
  11: "sm:grid-cols-11",
  12: "sm:grid-cols-12",
};

const mdColsClassMap: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  7: "md:grid-cols-7",
  8: "md:grid-cols-8",
  9: "md:grid-cols-9",
  10: "md:grid-cols-10",
  11: "md:grid-cols-11",
  12: "md:grid-cols-12",
};

const lgColsClassMap: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8",
  9: "lg:grid-cols-9",
  10: "lg:grid-cols-10",
  11: "lg:grid-cols-11",
  12: "lg:grid-cols-12",
};

const xlColsClassMap: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
  7: "xl:grid-cols-7",
  8: "xl:grid-cols-8",
  9: "xl:grid-cols-9",
  10: "xl:grid-cols-10",
  11: "xl:grid-cols-11",
  12: "xl:grid-cols-12",
};

function getColsClasses(cols: ResponsiveValue<number>): string {
  if (typeof cols === "number") {
    return colsClassMap[cols] || `grid-cols-${cols}`;
  }

  const classes: string[] = [];

  if (cols.sm !== undefined) {
    classes.push(smColsClassMap[cols.sm] || `sm:grid-cols-${cols.sm}`);
  }
  if (cols.md !== undefined) {
    classes.push(mdColsClassMap[cols.md] || `md:grid-cols-${cols.md}`);
  }
  if (cols.lg !== undefined) {
    classes.push(lgColsClassMap[cols.lg] || `lg:grid-cols-${cols.lg}`);
  }
  if (cols.xl !== undefined) {
    classes.push(xlColsClassMap[cols.xl] || `xl:grid-cols-${cols.xl}`);
  }

  // Add base class for smallest breakpoint if sm is defined
  if (cols.sm !== undefined) {
    classes.unshift(colsClassMap[cols.sm] || `grid-cols-${cols.sm}`);
  }

  return classes.join(" ");
}

/**
 * Grid component for creating responsive CSS Grid layouts.
 * Supports fixed column counts, responsive breakpoints, and auto-fit with minimum child width.
 */
const Grid = React.forwardRef<HTMLElement, GridProps>(
  (
    {
      children,
      cols = { sm: 1, md: 2, lg: 3 },
      gap = "md",
      rowGap,
      colGap,
      alignItems,
      justifyItems,
      minChildWidth,
      as: Component = "div",
      className,
      style,
      ...props
    },
    ref
  ) => {
    // Build gap classes
    const gapClass = rowGap || colGap ? "" : gapClasses[gap];
    const rowGapClass = rowGap ? rowGapClasses[rowGap] : "";
    const colGapClass = colGap ? colGapClasses[colGap] : "";

    // Build alignment classes
    const alignClass = alignItems ? alignItemsClasses[alignItems] : "";
    const justifyClass = justifyItems ? justifyItemsClasses[justifyItems] : "";

    // Build column classes (only if not using minChildWidth)
    const colsClass = minChildWidth ? "" : getColsClasses(cols);

    // Build inline styles for auto-fit grid
    const gridStyle: React.CSSProperties = minChildWidth
      ? {
          gridTemplateColumns: `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`,
          ...style,
        }
      : style || {};

    return (
      <Component
        ref={ref}
        className={cn(
          "grid",
          colsClass,
          gapClass,
          rowGapClass,
          colGapClass,
          alignClass,
          justifyClass,
          className
        )}
        style={Object.keys(gridStyle).length > 0 ? gridStyle : undefined}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Grid.displayName = "Grid";

// =====================================================
// GridItem Component
// =====================================================

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns to span - can be a number or responsive object */
  colSpan?: ResponsiveValue<number>;
  /** Number of rows to span */
  rowSpan?: number;
  /** Additional CSS classes */
  className?: string;
}

// Column span class mappings
const colSpanClassMap: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

const smColSpanClassMap: Record<number, string> = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
  5: "sm:col-span-5",
  6: "sm:col-span-6",
  7: "sm:col-span-7",
  8: "sm:col-span-8",
  9: "sm:col-span-9",
  10: "sm:col-span-10",
  11: "sm:col-span-11",
  12: "sm:col-span-12",
};

const mdColSpanClassMap: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};

const lgColSpanClassMap: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};

const xlColSpanClassMap: Record<number, string> = {
  1: "xl:col-span-1",
  2: "xl:col-span-2",
  3: "xl:col-span-3",
  4: "xl:col-span-4",
  5: "xl:col-span-5",
  6: "xl:col-span-6",
  7: "xl:col-span-7",
  8: "xl:col-span-8",
  9: "xl:col-span-9",
  10: "xl:col-span-10",
  11: "xl:col-span-11",
  12: "xl:col-span-12",
};

// Row span class mappings
const rowSpanClassMap: Record<number, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
  4: "row-span-4",
  5: "row-span-5",
  6: "row-span-6",
};

function getColSpanClasses(colSpan: ResponsiveValue<number>): string {
  if (typeof colSpan === "number") {
    return colSpanClassMap[colSpan] || `col-span-${colSpan}`;
  }

  const classes: string[] = [];

  if (colSpan.sm !== undefined) {
    classes.push(smColSpanClassMap[colSpan.sm] || `sm:col-span-${colSpan.sm}`);
  }
  if (colSpan.md !== undefined) {
    classes.push(mdColSpanClassMap[colSpan.md] || `md:col-span-${colSpan.md}`);
  }
  if (colSpan.lg !== undefined) {
    classes.push(lgColSpanClassMap[colSpan.lg] || `lg:col-span-${colSpan.lg}`);
  }
  if (colSpan.xl !== undefined) {
    classes.push(xlColSpanClassMap[colSpan.xl] || `xl:col-span-${colSpan.xl}`);
  }

  // Add base class for smallest breakpoint if sm is defined
  if (colSpan.sm !== undefined) {
    classes.unshift(colSpanClassMap[colSpan.sm] || `col-span-${colSpan.sm}`);
  }

  return classes.join(" ");
}

/**
 * GridItem component for controlling individual grid item placement.
 * Supports responsive column spans and row spans.
 */
const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ colSpan, rowSpan, className, children, ...props }, ref) => {
    const colSpanClass = colSpan ? getColSpanClasses(colSpan) : "";
    const rowSpanClass = rowSpan
      ? rowSpanClassMap[rowSpan] || `row-span-${rowSpan}`
      : "";

    return (
      <div
        ref={ref}
        className={cn(colSpanClass, rowSpanClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GridItem.displayName = "GridItem";

export { Grid, GridItem };
export type { GridProps, GridItemProps, ResponsiveValue, GapSize, AlignItems, JustifyItems };
