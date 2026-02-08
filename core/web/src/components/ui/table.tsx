import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Table Components
// =====================================================

// -----------------------------------------------------
// Table - Main wrapper element
// -----------------------------------------------------

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Whether the table should take full width */
  fullWidth?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, fullWidth = true, ...props }, ref) => {
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn(
            "caption-bottom text-sm",
            fullWidth && "w-full",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = "Table";

// -----------------------------------------------------
// TableHeader - Header section wrapper (thead)
// -----------------------------------------------------

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

// -----------------------------------------------------
// TableBody - Body section wrapper (tbody)
// -----------------------------------------------------

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

// -----------------------------------------------------
// TableFooter - Footer section wrapper (tfoot)
// -----------------------------------------------------

export interface TableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  TableFooterProps
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

// -----------------------------------------------------
// TableRow - Table row element (tr)
// -----------------------------------------------------

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Whether the row is selected */
  selected?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors",
        "hover:bg-muted/50",
        "data-[state=selected]:bg-muted",
        selected && "bg-muted",
        className
      )}
      data-state={selected ? "selected" : undefined}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

// -----------------------------------------------------
// TableHead - Table header cell (th)
// -----------------------------------------------------

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-3 text-left align-middle font-medium text-muted-foreground",
        "[&:has([role=checkbox])]:pr-0",
        "[&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

// -----------------------------------------------------
// TableCell - Table data cell (td)
// -----------------------------------------------------

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-3 align-middle",
        "[&:has([role=checkbox])]:pr-0",
        "[&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

// -----------------------------------------------------
// TableCaption - Table caption element
// -----------------------------------------------------

export interface TableCaptionProps
  extends React.HTMLAttributes<HTMLTableCaptionElement> {}

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

// -----------------------------------------------------
// Exports
// -----------------------------------------------------

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
