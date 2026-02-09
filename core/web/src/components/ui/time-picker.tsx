"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

// =====================================================
// TimePicker Component
// =====================================================

type TimePickerSize = "sm" | "md" | "lg";
type TimeFormat = "12" | "24";

interface TimeValue {
  hours: number;
  minutes: number;
}

interface TimePickerProps {
  /** Currently selected time */
  value?: TimeValue | null;
  /** Default time for uncontrolled mode */
  defaultValue?: TimeValue | null;
  /** Callback when time changes */
  onChange?: (time: TimeValue | null) => void;
  /** Time format - 12-hour or 24-hour */
  format?: TimeFormat;
  /** Step interval in minutes (e.g., 15, 30) */
  step?: number;
  /** Minimum selectable time */
  minTime?: TimeValue;
  /** Maximum selectable time */
  maxTime?: TimeValue;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Label for the field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Size variant */
  size?: TimePickerSize;
  /** Show clear button */
  showClearButton?: boolean;
  /** Additional className */
  className?: string;
  /** ID for the input */
  id?: string;
  /** Name attribute */
  name?: string;
}

/**
 * Format time value to display string
 */
function formatTime(time: TimeValue, format: TimeFormat): string {
  if (format === "24") {
    return `${time.hours.toString().padStart(2, "0")}:${time.minutes.toString().padStart(2, "0")}`;
  }

  const period = time.hours >= 12 ? "PM" : "AM";
  const hours12 = time.hours % 12 || 12;
  return `${hours12}:${time.minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Convert time to total minutes for comparison
 */
function timeToMinutes(time: TimeValue): number {
  return time.hours * 60 + time.minutes;
}

/**
 * Check if a time is within the allowed range
 */
function isTimeInRange(
  time: TimeValue,
  minTime?: TimeValue,
  maxTime?: TimeValue
): boolean {
  const timeMinutes = timeToMinutes(time);
  if (minTime && timeMinutes < timeToMinutes(minTime)) return false;
  if (maxTime && timeMinutes > timeToMinutes(maxTime)) return false;
  return true;
}

/**
 * Generate time options based on step interval
 */
function generateTimeOptions(
  step: number,
  minTime?: TimeValue,
  maxTime?: TimeValue
): TimeValue[] {
  const options: TimeValue[] = [];

  for (let hours = 0; hours < 24; hours++) {
    for (let minutes = 0; minutes < 60; minutes += step) {
      const time = { hours, minutes };
      if (isTimeInRange(time, minTime, maxTime)) {
        options.push(time);
      }
    }
  }

  return options;
}

const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      onChange,
      format = "12",
      step = 15,
      minTime,
      maxTime,
      placeholder = "Select time",
      disabled = false,
      error,
      label,
      required,
      size = "md",
      showClearButton = true,
      className,
      id,
      name,
    },
    ref
  ) => {
    const generatedId = React.useId();
    const pickerId = id || generatedId;

    // Determine if controlled or uncontrolled
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = React.useState<TimeValue | null>(
      defaultValue ?? null
    );
    const selectedTime = isControlled ? controlledValue : internalValue;

    // Dropdown state
    const [isOpen, setIsOpen] = React.useState(false);
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

    // Refs
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    // Generate time options
    const timeOptions = React.useMemo(
      () => generateTimeOptions(step, minTime, maxTime),
      [step, minTime, maxTime]
    );

    // Size classes
    const sizes = {
      sm: "h-8 px-2 py-1 text-xs",
      md: "h-9 px-2.5 py-1.5 text-sm",
      lg: "h-10 px-3 py-1.5 text-base",
    };

    const iconSizes = {
      sm: "sm" as const,
      md: "sm" as const,
      lg: "md" as const,
    };

    // Handle time selection
    const handleSelectTime = (time: TimeValue) => {
      if (isControlled) {
        onChange?.(time);
      } else {
        setInternalValue(time);
        onChange?.(time);
      }
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isControlled) {
        onChange?.(null);
      } else {
        setInternalValue(null);
        onChange?.(null);
      }
    };

    // Find currently selected index
    const selectedIndex = React.useMemo(() => {
      if (!selectedTime) return -1;
      return timeOptions.findIndex(
        (t) => t.hours === selectedTime.hours && t.minutes === selectedTime.minutes
      );
    }, [selectedTime, timeOptions]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev <= 0 ? timeOptions.length - 1 : prev - 1
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev >= timeOptions.length - 1 ? 0 : prev + 1
          );
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(timeOptions.length - 1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < timeOptions.length) {
            handleSelectTime(timeOptions[focusedIndex]);
          }
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    };

    // Scroll focused item into view
    React.useEffect(() => {
      if (isOpen && focusedIndex >= 0 && listRef.current) {
        const item = listRef.current.children[focusedIndex] as HTMLElement;
        if (item) {
          item.scrollIntoView({ block: "nearest" });
        }
      }
    }, [focusedIndex, isOpen]);

    // Scroll to selected time when opening
    React.useEffect(() => {
      if (isOpen && selectedIndex >= 0 && listRef.current) {
        const item = listRef.current.children[selectedIndex] as HTMLElement;
        if (item) {
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            item.scrollIntoView({ block: "center" });
          }, 0);
        }
      }
    }, [isOpen, selectedIndex]);

    // Close on outside click
    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div
        ref={containerRef}
        className={cn("relative inline-block w-full", className)}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={pickerId}
            className={cn(
              "mb-1.5 block text-sm font-medium leading-none",
              error && "text-destructive",
              disabled && "cursor-not-allowed opacity-70"
            )}
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}

        {/* Hidden input for form submission */}
        <input
          ref={ref}
          type="hidden"
          id={pickerId}
          name={name}
          value={selectedTime ? `${selectedTime.hours}:${selectedTime.minutes}` : ""}
        />

        {/* Trigger button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={label || "Select time"}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${pickerId}-error` : undefined}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            sizes[size],
            error && "border-destructive ring-destructive focus-visible:ring-destructive"
          )}
        >
          <span
            className={cn(
              "flex-1 text-left truncate",
              !selectedTime && "text-muted-foreground"
            )}
          >
            {selectedTime ? formatTime(selectedTime, format) : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {showClearButton && selectedTime && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="rounded p-0.5 hover:bg-muted"
                aria-label="Clear time"
              >
                <Icon name="X" size={iconSizes[size]} color="muted" />
              </span>
            )}
            <Icon name="Clock" size={iconSizes[size]} color="muted" />
          </div>
        </button>

        {/* Error message */}
        {error && (
          <p
            id={`${pickerId}-error`}
            role="alert"
            className="mt-1.5 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}

        {/* Time options dropdown */}
        {isOpen && (
          <div
            ref={listRef}
            role="listbox"
            aria-label="Available times"
            className={cn(
              "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-background py-1 shadow-lg",
              "animate-in fade-in-0 zoom-in-95"
            )}
            onKeyDown={handleKeyDown}
          >
            {timeOptions.map((time, index) => {
              const isSelected =
                selectedTime &&
                time.hours === selectedTime.hours &&
                time.minutes === selectedTime.minutes;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={`${time.hours}-${time.minutes}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected || undefined}
                  onClick={() => handleSelectTime(time)}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm",
                    "focus-visible:outline-none",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && isFocused && "bg-muted",
                    !isSelected && !isFocused && "hover:bg-muted"
                  )}
                >
                  {formatTime(time, format)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
TimePicker.displayName = "TimePicker";

export { TimePicker, formatTime, timeToMinutes, isTimeInRange };
export type { TimePickerProps, TimePickerSize, TimeFormat, TimeValue };
