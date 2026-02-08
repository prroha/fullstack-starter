"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Checkbox Component
// =====================================================

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /** Whether the checkbox is checked (controlled) */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Callback when checked state changes */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Label text to display next to the checkbox */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Whether the checkbox is in an indeterminate state */
  indeterminate?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked,
      defaultChecked,
      onChange,
      disabled,
      label,
      error,
      indeterminate,
      size = "md",
      id,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Handle indeterminate state (can only be set via JavaScript)
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate]);

    const sizes = {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    const labelSizes = {
      sm: "text-sm",
      md: "text-sm",
      lg: "text-base",
    };

    const checkboxElement = (
      <span className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          ref={inputRef}
          id={checkboxId}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          className={cn(
            // Base styles
            "peer appearance-none rounded border border-input bg-background",
            "cursor-pointer",
            // Size
            sizes[size],
            // Focus styles
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
            // Checked state
            "checked:bg-primary checked:border-primary",
            // Indeterminate state (same styling as checked)
            "indeterminate:bg-primary indeterminate:border-primary",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Error state
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {/* Checkmark icon */}
        <svg
          className={cn(
            "pointer-events-none absolute text-primary-foreground opacity-0 transition-opacity",
            "peer-checked:opacity-100 peer-indeterminate:opacity-0",
            size === "sm" && "h-2.5 w-2.5",
            size === "md" && "h-3 w-3",
            size === "lg" && "h-3.5 w-3.5"
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {/* Indeterminate icon (minus sign) */}
        <svg
          className={cn(
            "pointer-events-none absolute text-primary-foreground opacity-0 transition-opacity",
            "peer-indeterminate:opacity-100",
            size === "sm" && "h-2.5 w-2.5",
            size === "md" && "h-3 w-3",
            size === "lg" && "h-3.5 w-3.5"
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
    );

    // If no label, just return the checkbox
    if (!label) {
      return (
        <div className="inline-flex flex-col">
          {checkboxElement}
          {error && (
            <span
              id={`${checkboxId}-error`}
              className="mt-1 text-sm text-destructive"
              role="alert"
            >
              {error}
            </span>
          )}
        </div>
      );
    }

    // With label
    return (
      <div className="flex flex-col">
        <label
          htmlFor={checkboxId}
          className={cn(
            "inline-flex items-center gap-2 cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {checkboxElement}
          <span className={cn("select-none", labelSizes[size])}>{label}</span>
        </label>
        {error && (
          <span
            id={`${checkboxId}-error`}
            className="mt-1 text-sm text-destructive"
            role="alert"
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
export type { CheckboxProps };
