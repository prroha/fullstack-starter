"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Select Component
// =====================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

type SelectOptions = (SelectOption | SelectOptionGroup)[];

// Type guard to check if an option is a group
function isOptionGroup(
  option: SelectOption | SelectOptionGroup
): option is SelectOptionGroup {
  return "options" in option && Array.isArray(option.options);
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> {
  options: SelectOptions;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  size?: "sm" | "md" | "lg";
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      value,
      onChange,
      placeholder,
      disabled,
      error,
      label,
      required,
      size = "md",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    // Content-first sizing: tighter heights and padding
    const sizes = {
      sm: "h-8 px-2 py-1 text-xs",     // 32px (was 36px)
      md: "h-9 px-2.5 py-1.5 text-sm", // 36px (was 40px)
      lg: "h-10 px-3 py-1.5 text-base", // 40px (was 44px)
    };

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(event.target.value);
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            "flex w-full rounded-md border border-input bg-background ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "appearance-none cursor-pointer",
            // Custom dropdown arrow using background image
            "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
            "bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px_16px]",
            "pr-10",
            sizes[size],
            error
              ? "border-destructive ring-destructive focus-visible:ring-destructive"
              : "",
            !value && placeholder && "text-muted-foreground",
            className
          )}
          ref={ref}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) =>
            isOptionGroup(option) ? (
              <optgroup
                key={`group-${option.label}-${index}`}
                label={option.label}
                className="font-semibold text-muted-foreground"
              >
                {option.options.map((groupOption) => (
                  <option key={groupOption.value} value={groupOption.value}>
                    {groupOption.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )
          )}
        </select>
        {error && (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select, isOptionGroup };
export type { SelectProps, SelectOption, SelectOptionGroup, SelectOptions };
