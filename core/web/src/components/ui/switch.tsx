"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Switch Component
// =====================================================

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  labelPosition?: "left" | "right";
  className?: string;
  id?: string;
  name?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked = false,
      onChange,
      disabled = false,
      label,
      size = "md",
      labelPosition = "right",
      className,
      id,
      name,
    },
    ref
  ) => {
    // Size configurations for the track (outer container)
    const trackSizes = {
      sm: "h-5 w-9",
      md: "h-6 w-11",
      lg: "h-7 w-14",
    };

    // Size configurations for the thumb (inner circle)
    const thumbSizes = {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    // Translate values for the thumb when checked
    const thumbTranslate = {
      sm: "translate-x-4",
      md: "translate-x-5",
      lg: "translate-x-7",
    };

    // Label text sizes
    const labelSizes = {
      sm: "text-sm",
      md: "text-sm",
      lg: "text-base",
    };

    const handleClick = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    };

    const switchElement = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label && !id ? label : undefined}
        disabled={disabled}
        id={id}
        name={name}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          // Base styles
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full",
          // Focus styles
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Track size
          trackSizes[size],
          // Track color based on state
          checked ? "bg-primary" : "bg-muted",
          // Disabled styles
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        {/* Thumb */}
        <span
          aria-hidden="true"
          className={cn(
            // Base styles
            "pointer-events-none inline-block rounded-full bg-background shadow-sm",
            "transition-transform duration-200 ease-in-out",
            // Ring for better visibility
            "ring-0",
            // Thumb size
            thumbSizes[size],
            // Position - starts with small offset, translates when checked
            "translate-x-1",
            checked && thumbTranslate[size]
          )}
        />
      </button>
    );

    // If no label, return just the switch
    if (!label) {
      return switchElement;
    }

    // With label, wrap in a label element
    const labelElement = (
      <span
        className={cn(
          "select-none",
          labelSizes[size],
          disabled ? "text-muted-foreground" : "text-foreground",
          labelPosition === "left" ? "mr-2" : "ml-2"
        )}
      >
        {label}
      </span>
    );

    return (
      <label
        className={cn(
          "inline-flex items-center",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        {labelPosition === "left" && labelElement}
        {switchElement}
        {labelPosition === "right" && labelElement}
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
export type { SwitchProps };
