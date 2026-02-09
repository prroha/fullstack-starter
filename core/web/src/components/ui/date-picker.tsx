"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

// =====================================================
// DatePicker Component
// =====================================================

type DatePickerSize = "sm" | "md" | "lg";

interface DatePickerProps {
  /** Currently selected date */
  value?: Date | null;
  /** Default date for uncontrolled mode */
  defaultValue?: Date | null;
  /** Callback when date changes */
  onChange?: (date: Date | null) => void;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Array of dates that should be disabled */
  disabledDates?: Date[];
  /** Function to determine if a date should be disabled */
  isDateDisabled?: (date: Date) => boolean;
  /** Date format for display (default: "MM/dd/yyyy") */
  format?: string;
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
  size?: DatePickerSize;
  /** Show today button */
  showTodayButton?: boolean;
  /** Show clear button */
  showClearButton?: boolean;
  /** Additional className */
  className?: string;
  /** ID for the input */
  id?: string;
  /** Name attribute */
  name?: string;
}

// Days of the week
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Month names
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Format a date according to the given format string
 * Supported tokens: yyyy, MM, dd, M, d
 */
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return format
    .replace("yyyy", year.toString())
    .replace("MM", month.toString().padStart(2, "0"))
    .replace("dd", day.toString().padStart(2, "0"))
    .replace("M", month.toString())
    .replace("d", day.toString());
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get all days for a month view including padding days from prev/next months
 */
function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: Date[] = [];

  // Add days from previous month
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonthDays - i));
  }

  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Add days from next month to complete the grid (6 rows * 7 days = 42)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      onChange,
      minDate,
      maxDate,
      disabledDates = [],
      isDateDisabled,
      format = "MM/dd/yyyy",
      placeholder = "Select date",
      disabled = false,
      error,
      label,
      required,
      size = "md",
      showTodayButton = true,
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
    const [internalValue, setInternalValue] = React.useState<Date | null>(
      defaultValue ?? null
    );
    const selectedDate = isControlled ? controlledValue : internalValue;

    // Calendar state
    const [isOpen, setIsOpen] = React.useState(false);
    const [viewDate, setViewDate] = React.useState<Date>(
      selectedDate ?? new Date()
    );
    const [focusedDate, setFocusedDate] = React.useState<Date | null>(null);

    // Refs
    const containerRef = React.useRef<HTMLDivElement>(null);
    const calendarRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

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

    // Handle date selection
    const handleSelectDate = (date: Date) => {
      if (isControlled) {
        onChange?.(date);
      } else {
        setInternalValue(date);
        onChange?.(date);
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

    // Handle today button
    const handleToday = () => {
      const today = new Date();
      if (!checkDateDisabled(today)) {
        handleSelectDate(today);
      } else {
        setViewDate(today);
      }
    };

    // Check if a date is disabled
    const checkDateDisabled = (date: Date): boolean => {
      if (disabled) return true;
      if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
      if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999)))
        return true;
      if (disabledDates.some((d) => isSameDay(d, date))) return true;
      if (isDateDisabled?.(date)) return true;
      return false;
    };

    // Navigate months
    const goToPrevMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const goToPrevYear = () => {
      setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    };

    const goToNextYear = () => {
      setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedDate(selectedDate ?? new Date());
        }
        return;
      }

      const currentFocus = focusedDate ?? selectedDate ?? new Date();
      let newDate: Date | null = null;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowLeft":
          e.preventDefault();
          newDate = new Date(currentFocus);
          newDate.setDate(newDate.getDate() - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newDate = new Date(currentFocus);
          newDate.setDate(newDate.getDate() + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          newDate = new Date(currentFocus);
          newDate.setDate(newDate.getDate() - 7);
          break;
        case "ArrowDown":
          e.preventDefault();
          newDate = new Date(currentFocus);
          newDate.setDate(newDate.getDate() + 7);
          break;
        case "Home":
          e.preventDefault();
          newDate = new Date(currentFocus.getFullYear(), currentFocus.getMonth(), 1);
          break;
        case "End":
          e.preventDefault();
          newDate = new Date(currentFocus.getFullYear(), currentFocus.getMonth() + 1, 0);
          break;
        case "PageUp":
          e.preventDefault();
          if (e.shiftKey) {
            goToPrevYear();
          } else {
            goToPrevMonth();
          }
          newDate = new Date(
            viewDate.getFullYear() - (e.shiftKey ? 1 : 0),
            viewDate.getMonth() - (e.shiftKey ? 0 : 1),
            Math.min(currentFocus.getDate(), 28)
          );
          break;
        case "PageDown":
          e.preventDefault();
          if (e.shiftKey) {
            goToNextYear();
          } else {
            goToNextMonth();
          }
          newDate = new Date(
            viewDate.getFullYear() + (e.shiftKey ? 1 : 0),
            viewDate.getMonth() + (e.shiftKey ? 0 : 1),
            Math.min(currentFocus.getDate(), 28)
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedDate && !checkDateDisabled(focusedDate)) {
            handleSelectDate(focusedDate);
          }
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }

      if (newDate) {
        setFocusedDate(newDate);
        // Update view if focused date is in a different month
        if (
          newDate.getMonth() !== viewDate.getMonth() ||
          newDate.getFullYear() !== viewDate.getFullYear()
        ) {
          setViewDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
        }
      }
    };

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

    // Update view date when selected date changes
    React.useEffect(() => {
      if (selectedDate) {
        setViewDate(selectedDate);
      }
    }, [selectedDate]);

    // Get days for current view
    const monthDays = getMonthDays(viewDate.getFullYear(), viewDate.getMonth());

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
          value={selectedDate ? selectedDate.toISOString() : ""}
        />

        {/* Trigger button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={label || "Select date"}
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
              !selectedDate && "text-muted-foreground"
            )}
          >
            {selectedDate ? formatDate(selectedDate, format) : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {showClearButton && selectedDate && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="rounded p-0.5 hover:bg-muted"
                aria-label="Clear date"
              >
                <Icon name="X" size={iconSizes[size]} color="muted" />
              </span>
            )}
            <Icon name="Calendar" size={iconSizes[size]} color="muted" />
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

        {/* Calendar dropdown */}
        {isOpen && (
          <div
            ref={calendarRef}
            role="dialog"
            aria-modal="true"
            aria-label="Choose date"
            className={cn(
              "absolute z-50 mt-1 w-[280px] rounded-md border border-input bg-background p-3 shadow-lg",
              "animate-in fade-in-0 zoom-in-95"
            )}
            onKeyDown={handleKeyDown}
          >
            {/* Header with navigation */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPrevYear}
                  className="rounded p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Previous year"
                >
                  <Icon name="ChevronsLeft" size="sm" />
                </button>
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="rounded p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Previous month"
                >
                  <Icon name="ChevronLeft" size="sm" />
                </button>
              </div>

              <span className="text-sm font-semibold">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="rounded p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Next month"
                >
                  <Icon name="ChevronRight" size="sm" />
                </button>
                <button
                  type="button"
                  onClick={goToNextYear}
                  className="rounded p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Next year"
                >
                  <Icon name="ChevronsRight" size="sm" />
                </button>
              </div>
            </div>

            {/* Day labels */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div
              role="grid"
              aria-label="Calendar"
              className="grid grid-cols-7 gap-1"
            >
              {monthDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isFocused = focusedDate && isSameDay(date, focusedDate);
                const isDisabled = checkDateDisabled(date);
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={index}
                    type="button"
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    onClick={() => !isDisabled && handleSelectDate(date)}
                    disabled={isDisabled}
                    aria-selected={isSelected || undefined}
                    aria-current={isTodayDate ? "date" : undefined}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md text-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      !isCurrentMonth && "text-muted-foreground/50",
                      isCurrentMonth && !isSelected && !isDisabled && "hover:bg-muted",
                      isTodayDate && !isSelected && "border border-primary",
                      isSelected && "bg-primary text-primary-foreground",
                      isFocused && !isSelected && "ring-2 ring-ring",
                      isDisabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer with today button */}
            {showTodayButton && (
              <div className="mt-3 flex justify-center border-t border-input pt-3">
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Today
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker, formatDate, isSameDay, isToday };
export type { DatePickerProps, DatePickerSize };
