import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export interface FieldWrapperProps {
  /** Field label */
  label: string;
  /** Unique ID for the input element (required for accessibility) */
  htmlFor: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Helper hint text */
  hint?: string;
  /** The input element (Input, Select, Textarea, etc.) */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

// =====================================================
// FieldWrapper Component
// =====================================================

/**
 * A simple wrapper for form fields that provides consistent layout
 * with label, error message, and hint text.
 *
 * For use with react-hook-form, prefer the FormField components
 * from @/components/forms instead.
 */
function FieldWrapper({
  label,
  htmlFor,
  error,
  required = false,
  hint,
  children,
  className,
}: FieldWrapperProps) {
  const hasError = Boolean(error);

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label */}
      <label
        htmlFor={htmlFor}
        className={cn(
          "block text-sm font-medium",
          hasError ? "text-destructive" : "text-foreground"
        )}
      >
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {/* Input wrapper */}
      <div className="relative">
        {children}
      </div>

      {/* Hint text */}
      {hint && !hasError && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {/* Error message */}
      {hasError && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { FieldWrapper };
