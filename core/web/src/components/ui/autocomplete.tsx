"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Autocomplete Component
// =====================================================

interface AutocompleteOption {
  value: string;
  label: string;
}

type AutocompleteOptionInput = AutocompleteOption | string;

interface AutocompleteProps {
  /** Array of options - can be {value, label} objects or plain strings */
  options: AutocompleteOptionInput[];
  /** Currently selected value */
  value?: string;
  /** Callback when an option is selected */
  onChange?: (value: string) => void;
  /** Callback when input text changes (for async filtering) */
  onInputChange?: (inputValue: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Label text */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Allow custom values not in the options list */
  allowCustomValue?: boolean;
  /** Show loading spinner while fetching suggestions */
  loading?: boolean;
  /** Text to show when no results match */
  noResultsText?: string;
  /** Custom filter function */
  filterFn?: (option: AutocompleteOption, inputValue: string) => boolean;
  /** Input size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class name */
  className?: string;
  /** Input id */
  id?: string;
  /** Name attribute for form submission */
  name?: string;
}

const normalizeOption = (option: AutocompleteOptionInput): AutocompleteOption => {
  if (typeof option === "string") {
    return { value: option, label: option };
  }
  return option;
};

const defaultFilterFn = (option: AutocompleteOption, inputValue: string): boolean => {
  return option.label.toLowerCase().includes(inputValue.toLowerCase());
};

const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  (
    {
      options,
      value,
      onChange,
      onInputChange,
      placeholder,
      disabled,
      error,
      label,
      required,
      allowCustomValue = false,
      loading = false,
      noResultsText = "No results found",
      filterFn = defaultFilterFn,
      size = "md",
      className,
      id,
      name,
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const listboxId = React.useId();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

    const normalizedOptions = React.useMemo(
      () => options.map(normalizeOption),
      [options]
    );

    // Find the label for the current value
    const selectedOption = React.useMemo(
      () => normalizedOptions.find((opt) => opt.value === value),
      [normalizedOptions, value]
    );

    // Sync input value with selected value
    React.useEffect(() => {
      if (selectedOption) {
        setInputValue(selectedOption.label);
      } else if (value && allowCustomValue) {
        setInputValue(value);
      } else if (!value) {
        setInputValue("");
      }
    }, [selectedOption, value, allowCustomValue]);

    // Filter options based on input
    const filteredOptions = React.useMemo(() => {
      if (!inputValue) return normalizedOptions;
      return normalizedOptions.filter((opt) => filterFn(opt, inputValue));
    }, [normalizedOptions, inputValue, filterFn]);

    // Reset highlighted index when filtered options change
    React.useEffect(() => {
      setHighlightedIndex(-1);
    }, [filteredOptions.length]);

    // Click outside handler
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          // Restore value on blur if not allowing custom values
          if (!allowCustomValue && selectedOption) {
            setInputValue(selectedOption.label);
          } else if (!allowCustomValue && !selectedOption) {
            setInputValue("");
            onChange?.("");
          }
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [allowCustomValue, selectedOption, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsOpen(true);
      onInputChange?.(newValue);

      if (allowCustomValue) {
        onChange?.(newValue);
      }
    };

    const handleInputFocus = () => {
      setIsOpen(true);
    };

    const handleOptionSelect = (option: AutocompleteOption) => {
      setInputValue(option.label);
      onChange?.(option.value);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            handleOptionSelect(filteredOptions[highlightedIndex]);
          } else if (allowCustomValue && inputValue) {
            onChange?.(inputValue);
            setIsOpen(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          // Restore value on escape if not allowing custom values
          if (!allowCustomValue && selectedOption) {
            setInputValue(selectedOption.label);
          }
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    };

    const sizes = {
      sm: "h-9 px-2 py-1 text-xs",
      md: "h-10 px-3 py-2 text-sm",
      lg: "h-11 px-4 py-2 text-base",
    };

    return (
      <div className="flex flex-col gap-1.5" ref={containerRef}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${listboxId}-option-${highlightedIndex}`
                : undefined
            }
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              "flex w-full rounded-md border border-input bg-background ring-offset-background",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              sizes[size],
              "pr-8", // Space for dropdown arrow/loading indicator
              error
                ? "border-destructive ring-destructive focus-visible:ring-destructive"
                : "",
              className
            )}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
          />
          {/* Dropdown arrow or loading spinner */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {loading ? (
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                role="status"
                aria-label="Loading options"
              >
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              <svg
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </div>

          {/* Dropdown list */}
          {isOpen && !disabled && (
            <ul
              id={listboxId}
              role="listbox"
              className={cn(
                "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-background py-1 shadow-lg",
                "focus:outline-none"
              )}
            >
              {loading ? (
                <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                  Loading...
                </li>
              ) : filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground text-center">
                  {noResultsText}
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={option.value === value}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                      highlightedIndex === index &&
                        "bg-accent text-accent-foreground",
                      option.value === value && "font-medium"
                    )}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {option.label}
                    {option.value === value && (
                      <svg
                        className="ml-auto inline-block h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
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
Autocomplete.displayName = "Autocomplete";

export { Autocomplete };
export type { AutocompleteProps, AutocompleteOption };
