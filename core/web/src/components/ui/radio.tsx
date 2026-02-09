"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Radio Option Interface
// =====================================================

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// =====================================================
// Radio Component
// =====================================================

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex items-center gap-2">
        <input
          type="radio"
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn(
            "h-4 w-4 shrink-0 appearance-none rounded-full border border-input bg-background",
            "checked:border-primary checked:bg-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "relative",
            // Inner dot for checked state
            "checked:before:absolute checked:before:left-1/2 checked:before:top-1/2 checked:before:h-1.5 checked:before:w-1.5 checked:before:-translate-x-1/2 checked:before:-translate-y-1/2 checked:before:rounded-full checked:before:bg-primary-foreground",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none cursor-pointer",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Radio.displayName = "Radio";

// =====================================================
// RadioGroup Component
// =====================================================

interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  error?: string;
  label?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
  required?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      name,
      value,
      onChange,
      options,
      disabled = false,
      error,
      label,
      orientation = "vertical",
      className,
      required,
    },
    ref
  ) => {
    const groupId = React.useId();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      let newIndex = currentIndex;

      const getNextEnabledIndex = (start: number, direction: 1 | -1): number => {
        let index = start;
        const length = options.length;
        for (let i = 0; i < length; i++) {
          index = (index + direction + length) % length;
          if (!options[index].disabled) {
            return index;
          }
        }
        return start;
      };

      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          newIndex = getNextEnabledIndex(currentIndex, 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          newIndex = getNextEnabledIndex(currentIndex, -1);
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex && !options[newIndex].disabled) {
        onChange?.(options[newIndex].value);
      }
    };

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <div
            id={`${groupId}-label`}
            className="text-sm font-medium leading-none"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </div>
        )}
        <div
          role="radiogroup"
          aria-labelledby={label ? `${groupId}-label` : undefined}
          aria-describedby={error ? `${groupId}-error` : undefined}
          aria-invalid={!!error}
          aria-required={required}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex",
            orientation === "vertical" ? "flex-col gap-2" : "flex-row flex-wrap gap-4"
          )}
        >
          {options.map((option) => (
            <Radio
              key={option.value}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              disabled={disabled || option.disabled}
              label={option.label}
              aria-checked={value === option.value}
              tabIndex={value === option.value ? 0 : -1}
            />
          ))}
        </div>
        {error && (
          <p
            id={`${groupId}-error`}
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export { Radio, RadioGroup };
export type { RadioProps, RadioGroupProps, RadioOption };
