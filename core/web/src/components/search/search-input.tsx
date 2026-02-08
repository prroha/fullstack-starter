"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showShortcutHint?: boolean;
  onClear?: () => void;
  isLoading?: boolean;
}

// =====================================================
// Icons
// =====================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// =====================================================
// Keyboard Shortcut Hint
// =====================================================

function ShortcutHint() {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  return (
    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
      <span className="text-xs">{isMac ? "\u2318" : "Ctrl"}</span>K
    </kbd>
  );
}

// =====================================================
// Main Component
// =====================================================

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      showShortcutHint = false,
      onClear,
      isLoading = false,
      value,
      ...props
    },
    ref
  ) => {
    const hasValue = value && String(value).length > 0;

    return (
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Spinner className="text-muted-foreground" />
          ) : (
            <SearchIcon className="text-muted-foreground" />
          )}
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={value}
          className={cn(
            "flex h-11 w-full rounded-lg border border-input bg-background",
            "pl-10 pr-20 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {/* Right Side Actions */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {hasValue && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-md hover:bg-accent"
              aria-label="Clear search"
            >
              <XIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : showShortcutHint ? (
            <ShortcutHint />
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
