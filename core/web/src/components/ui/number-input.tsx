"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// NumberInput Component
// =====================================================

export type NumberInputSize = "sm" | "md" | "lg";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "onChange" | "value" | "defaultValue" | "prefix"> {
  /** Current value */
  value?: number;
  /** Default value for uncontrolled mode */
  defaultValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Size variant */
  size?: NumberInputSize;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show an error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Prefix element (e.g., "$") */
  prefix?: React.ReactNode;
  /** Suffix element (e.g., "%") */
  suffix?: React.ReactNode;
  /** Whether to hide the increment/decrement buttons */
  hideButtons?: boolean;
  /** Button position: "sides" or "right" */
  buttonPosition?: "sides" | "right";
  /** Callback when value changes */
  onChange?: (value: number | undefined) => void;
  /** Callback when value changes (with event) */
  onValueChange?: (value: number | undefined, event?: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether to allow empty value (returns undefined) */
  allowEmpty?: boolean;
  /** Precision (number of decimal places) */
  precision?: number;
  /** Format options for display */
  formatOptions?: Intl.NumberFormatOptions;
  /** Additional CSS classes */
  className?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      min,
      max,
      step = 1,
      size = "md",
      disabled = false,
      error = false,
      errorMessage,
      prefix,
      suffix,
      hideButtons = false,
      buttonPosition = "sides",
      onChange,
      onValueChange,
      allowEmpty = false,
      precision,
      formatOptions: _formatOptions,
      className,
      id,
      name,
      placeholder,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [internalValue, setInternalValue] = React.useState<number | undefined>(defaultValue);
    const [inputText, setInputText] = React.useState<string>(
      defaultValue !== undefined ? String(defaultValue) : ""
    );
    const [isFocused, setIsFocused] = React.useState(false);

    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = errorMessage ? `${inputId}-error` : undefined;

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // Update input text when controlled value changes
    React.useEffect(() => {
      if (isControlled && !isFocused) {
        setInputText(controlledValue !== undefined ? String(controlledValue) : "");
      }
    }, [controlledValue, isControlled, isFocused]);

    // Size configurations
    const inputSizes = {
      sm: "h-8 text-sm",
      md: "h-9 text-sm",
      lg: "h-10 text-base",
    };

    const buttonSizes = {
      sm: "h-8 w-8",
      md: "h-9 w-9",
      lg: "h-10 w-10",
    };

    const stackedButtonSizes = {
      sm: "h-4 w-6",
      md: "h-[18px] w-7",
      lg: "h-5 w-8",
    };

    const iconSizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    // Clamp and round value
    const clampValue = (val: number): number => {
      let clamped = val;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      if (precision !== undefined) {
        clamped = Number(clamped.toFixed(precision));
      }
      return clamped;
    };

    // Update value
    const updateValue = (newValue: number | undefined, event?: React.ChangeEvent<HTMLInputElement>) => {
      const clampedValue = newValue !== undefined ? clampValue(newValue) : undefined;

      if (!isControlled) {
        setInternalValue(clampedValue);
      }

      onChange?.(clampedValue);
      onValueChange?.(clampedValue, event);
    };

    // Handle increment
    const handleIncrement = () => {
      if (disabled) return;

      const current = currentValue ?? min ?? 0;
      const newValue = current + step;

      if (max !== undefined && newValue > max) return;

      updateValue(newValue);
      setInputText(String(clampValue(newValue)));
    };

    // Handle decrement
    const handleDecrement = () => {
      if (disabled) return;

      const current = currentValue ?? max ?? 0;
      const newValue = current - step;

      if (min !== undefined && newValue < min) return;

      updateValue(newValue);
      setInputText(String(clampValue(newValue)));
    };

    // Handle direct input change
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      setInputText(text);

      // Allow empty input
      if (text === "" || text === "-") {
        if (allowEmpty) {
          updateValue(undefined, event);
        }
        return;
      }

      // Parse the number
      const parsed = parseFloat(text);
      if (!isNaN(parsed)) {
        updateValue(parsed, event);
      }
    };

    // Handle blur - validate and format
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      if (inputText === "" || inputText === "-") {
        if (allowEmpty) {
          updateValue(undefined);
          setInputText("");
        } else {
          // Reset to min or 0
          const resetValue = min ?? 0;
          updateValue(resetValue);
          setInputText(String(resetValue));
        }
        return;
      }

      const parsed = parseFloat(inputText);
      if (!isNaN(parsed)) {
        const clamped = clampValue(parsed);
        updateValue(clamped);
        setInputText(String(clamped));
      } else {
        // Invalid input - reset
        const resetValue = currentValue ?? min ?? 0;
        setInputText(String(resetValue));
      }

      props.onBlur?.(event);
    };

    // Handle focus
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      event.target.select();
      props.onFocus?.(event);
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          handleIncrement();
          break;
        case "ArrowDown":
          event.preventDefault();
          handleDecrement();
          break;
        case "Enter":
          // Validate on enter
          handleBlur(event as unknown as React.FocusEvent<HTMLInputElement>);
          break;
      }

      props.onKeyDown?.(event);
    };

    // Check if buttons should be disabled
    const isIncrementDisabled = disabled || (max !== undefined && (currentValue ?? 0) >= max);
    const isDecrementDisabled = disabled || (min !== undefined && (currentValue ?? 0) <= min);

    // Button component
    const Button = ({
      onClick,
      isDisabled,
      children,
      ariaLabel: btnAriaLabel,
      className: btnClassName,
    }: {
      onClick: () => void;
      isDisabled: boolean;
      children: React.ReactNode;
      ariaLabel: string;
      className?: string;
    }) => (
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        aria-label={btnAriaLabel}
        tabIndex={-1}
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-colors",
          btnClassName
        )}
      >
        {children}
      </button>
    );

    // Minus icon
    const MinusIcon = () => (
      <svg
        className={iconSizes[size]}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );

    // Plus icon
    const PlusIcon = () => (
      <svg
        className={iconSizes[size]}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );

    // Chevron up icon
    const ChevronUpIcon = () => (
      <svg
        className={cn(iconSizes[size], "h-3 w-3")}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    );

    // Chevron down icon
    const ChevronDownIcon = () => (
      <svg
        className={cn(iconSizes[size], "h-3 w-3")}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );

    const inputElement = (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        id={inputId}
        name={name}
        value={inputText}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={cn(errorId, ariaDescribedBy).trim() || undefined}
        aria-invalid={error || undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full bg-transparent text-center outline-none",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          inputSizes[size],
          prefix && "pl-1",
          suffix && "pr-1"
        )}
        {...props}
      />
    );

    return (
      <div className={cn("inline-flex flex-col", className)}>
        <div
          className={cn(
            "inline-flex items-center",
            buttonPosition === "sides" && "gap-1"
          )}
        >
          {/* Left/Decrement button (sides position) */}
          {!hideButtons && buttonPosition === "sides" && (
            <Button
              onClick={handleDecrement}
              isDisabled={isDecrementDisabled}
              ariaLabel="Decrease value"
              className={cn(buttonSizes[size], "rounded-md")}
            >
              <MinusIcon />
            </Button>
          )}

          {/* Input container */}
          <div
            className={cn(
              "inline-flex items-center rounded-md border border-input bg-background",
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
              error && "border-destructive focus-within:ring-destructive",
              disabled && "opacity-50 cursor-not-allowed",
              inputSizes[size],
              buttonPosition === "right" && !hideButtons && "rounded-r-none"
            )}
          >
            {/* Prefix */}
            {prefix && (
              <span className="pl-2.5 text-muted-foreground select-none">
                {prefix}
              </span>
            )}

            {inputElement}

            {/* Suffix */}
            {suffix && (
              <span className="pr-2.5 text-muted-foreground select-none">
                {suffix}
              </span>
            )}
          </div>

          {/* Right stacked buttons (right position) */}
          {!hideButtons && buttonPosition === "right" && (
            <div className="inline-flex flex-col -ml-px">
              <Button
                onClick={handleIncrement}
                isDisabled={isIncrementDisabled}
                ariaLabel="Increase value"
                className={cn(stackedButtonSizes[size], "rounded-tr-md rounded-bl-none rounded-tl-none rounded-br-none border-b-0")}
              >
                <ChevronUpIcon />
              </Button>
              <Button
                onClick={handleDecrement}
                isDisabled={isDecrementDisabled}
                ariaLabel="Decrease value"
                className={cn(stackedButtonSizes[size], "rounded-br-md rounded-tl-none rounded-tr-none rounded-bl-none")}
              >
                <ChevronDownIcon />
              </Button>
            </div>
          )}

          {/* Right/Increment button (sides position) */}
          {!hideButtons && buttonPosition === "sides" && (
            <Button
              onClick={handleIncrement}
              isDisabled={isIncrementDisabled}
              ariaLabel="Increase value"
              className={cn(buttonSizes[size], "rounded-md")}
            >
              <PlusIcon />
            </Button>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <span
            id={errorId}
            className="mt-1 text-sm text-destructive"
            role="alert"
          >
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
