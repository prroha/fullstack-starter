"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSearch } from "@/lib/hooks/use-search";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";

// =====================================================
// Types
// =====================================================

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =====================================================
// Recent Searches Component
// =====================================================

interface RecentSearchesProps {
  searches: string[];
  onSelect: (search: string) => void;
  onRemove: (search: string) => void;
  onClear: () => void;
}

function RecentSearches({
  searches,
  onSelect,
  onRemove,
  onClear,
}: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Searches
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      </div>
      <div className="space-y-0.5">
        {searches.map((search) => (
          <div
            key={search}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent group cursor-pointer"
            onClick={() => onSelect(search)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="flex-1 text-sm text-foreground truncate">
              {search}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(search);
              }}
              className={cn(
                "min-h-[44px] min-w-[44px] flex items-center justify-center",
                "rounded",
                "opacity-50 hover:opacity-100 hover:bg-background",
                "sm:opacity-0 sm:group-hover:opacity-100",
                "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
              aria-label={`Remove "${search}" from recent searches`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 text-muted-foreground"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// Initial State Component
// =====================================================

function InitialState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        Search the app
      </h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Search for users and more. Start typing to see results.
      </p>
    </div>
  );
}

// =====================================================
// Main Component
// =====================================================

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const {
    query,
    setQuery,
    results,
    isLoading,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  } = useSearch();

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      // Small delay to ensure the dialog is rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Handle result click
  const handleResultClick = React.useCallback(() => {
    if (query.trim().length >= 2) {
      addRecentSearch(query);
    }
    onOpenChange(false);
    setQuery("");
  }, [query, addRecentSearch, onOpenChange, setQuery]);

  // Handle recent search select
  const handleRecentSearchSelect = React.useCallback(
    (search: string) => {
      setQuery(search);
      inputRef.current?.focus();
    },
    [setQuery]
  );

  // Handle clear search
  const handleClear = React.useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, [setQuery]);

  // Handle close
  const handleClose = React.useCallback(() => {
    onOpenChange(false);
    setQuery("");
  }, [onOpenChange, setQuery]);

  if (!open) return null;

  const showResults = query.trim().length >= 2 && results;
  const showRecentSearches =
    query.trim().length < 2 && recentSearches.length > 0;
  const showInitialState = query.trim().length < 2 && recentSearches.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-lg",
          "bg-background rounded-xl shadow-2xl border border-border",
          "overflow-hidden",
          "animate-in fade-in-0 zoom-in-95"
        )}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={handleClear}
            isLoading={isLoading}
            placeholder="Search users..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {showResults && (
            <SearchResults results={results} onResultClick={handleResultClick} />
          )}

          {showRecentSearches && (
            <RecentSearches
              searches={recentSearches}
              onSelect={handleRecentSearchSelect}
              onRemove={removeRecentSearch}
              onClear={clearRecentSearches}
            />
          )}

          {showInitialState && <InitialState />}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↓</kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
                <span>select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
                <span>close</span>
              </span>
            </div>
            <span>
              {results?.totalResults !== undefined && query.trim().length >= 2
                ? `${results.totalResults} result${results.totalResults !== 1 ? "s" : ""}`
                : "Type to search"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
