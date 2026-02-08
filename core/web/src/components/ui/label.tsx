import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Label Component
// =====================================================

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** ID of the form element this label is for */
  htmlFor?: string;
  /** Whether the associated field is required (shows asterisk) */
  required?: boolean;
  /** Whether the associated field is disabled (muted style) */
  disabled?: boolean;
  /** Children elements */
  children: React.ReactNode;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, htmlFor, required, disabled, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={cn(
          "text-sm font-medium leading-none",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          disabled && "cursor-not-allowed text-muted-foreground opacity-70",
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);
Label.displayName = "Label";

export { Label };
