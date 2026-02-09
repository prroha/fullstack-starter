"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

type SearchInputSize = "sm" | "md" | "lg";

interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  /** Size variant */
  size?: SearchInputSize;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds (default: 300) */
  debounceDelay?: number;
  /** Whether the search is loading */
  loading?: boolean;
  /** Keyboard shortcut hint to display (e.g., "K" for Cmd+K) */
  shortcutHint?: string;
  /** Callback when value changes (immediate, before debounce) */
  onChange?: (value: string) => void;
  /** Callback when search is triggered (after debounce) */
  onSearch?: (value: string) => void;
  /** Callback when input is cleared */
  onClear?: () => void;
  /** Additional class name for container */
  className?: string;
  /** Additional class name for input element */
  inputClassName?: string;
  /** Initial value */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
}

// =====================================================
// Debounce Hook
// =====================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =====================================================
// Icons
// =====================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={cn("animate-spin", className)}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        className="opacity-75"
      />
    </svg>
  );
}

// =====================================================
// Size Configuration
// =====================================================

const sizeConfig: Record<
  SearchInputSize,
  {
    container: string;
    input: string;
    icon: string;
    clearButton: string;
    shortcutBadge: string;
  }
> = {
  sm: {
    container: "h-8",
    input: "text-xs px-7",
    icon: "h-3.5 w-3.5 left-2",
    clearButton: "h-3.5 w-3.5",
    shortcutBadge: "text-[9px] px-1 py-0.5",
  },
  md: {
    container: "h-9",
    input: "text-sm px-9",
    icon: "h-4 w-4 left-2.5",
    clearButton: "h-4 w-4",
    shortcutBadge: "text-[10px] px-1.5 py-0.5",
  },
  lg: {
    container: "h-11",
    input: "text-base px-11",
    icon: "h-5 w-5 left-3",
    clearButton: "h-5 w-5",
    shortcutBadge: "text-xs px-1.5 py-0.5",
  },
};

// =====================================================
// SearchInput Component
// =====================================================

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      size = "md",
      placeholder = "Search...",
      debounceDelay = 300,
      loading = false,
      shortcutHint,
      onChange,
      onSearch,
      onClear,
      className,
      inputClassName,
      defaultValue = "",
      value: controlledValue,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Handle controlled vs uncontrolled
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const value = isControlled ? controlledValue : internalValue;

    // Debounced value
    const debouncedValue = useDebounce(value, debounceDelay);

    // Trigger onSearch when debounced value changes
    const previousDebouncedRef = React.useRef(debouncedValue);
    React.useEffect(() => {
      if (previousDebouncedRef.current !== debouncedValue) {
        previousDebouncedRef.current = debouncedValue;
        onSearch?.(debouncedValue);
      }
    }, [debouncedValue, onSearch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue("");
      }
      onChange?.("");
      onClear?.();
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && value) {
        e.preventDefault();
        handleClear();
      }
    };

    const config = sizeConfig[size];
    const showClearButton = value && !loading;
    const showLoading = loading;
    const showShortcut = shortcutHint && !value && !loading;

    return (
      <div className={cn("relative", config.container, className)}>
        {/* Search Icon */}
        <SearchIcon
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
            config.icon
          )}
        />

        {/* Input */}
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="searchbox"
          aria-label={placeholder}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "flex h-full w-full rounded-md border border-input bg-background ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Hide native search clear button
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            config.input,
            // Right padding for clear button/loading/shortcut
            (showClearButton || showLoading || showShortcut) && "pr-9",
            inputClassName
          )}
          {...props}
        />

        {/* Right side elements */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {/* Loading spinner */}
          {showLoading && (
            <LoaderIcon
              className={cn("text-muted-foreground", config.clearButton)}
            />
          )}

          {/* Clear button */}
          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "flex items-center justify-center rounded-sm",
                "text-muted-foreground hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              )}
              aria-label="Clear search"
            >
              <ClearIcon className={config.clearButton} />
            </button>
          )}

          {/* Keyboard shortcut hint */}
          {showShortcut && (
            <kbd
              className={cn(
                "inline-flex items-center gap-0.5 rounded border border-border bg-muted font-mono text-muted-foreground",
                config.shortcutBadge
              )}
            >
              <span className="text-[0.65em]">⌘</span>
              {shortcutHint}
            </kbd>
          )}
        </div>
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
export type { SearchInputProps, SearchInputSize };
