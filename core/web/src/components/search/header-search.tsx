"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./search-dialog";

// =====================================================
// Types
// =====================================================

interface HeaderSearchProps {
  className?: string;
}

// =====================================================
// Search Icon
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

// =====================================================
// Keyboard Shortcut Hint
// =====================================================

function ShortcutHint() {
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  return (
    <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
      <span className="text-xs">{isMac ? "\u2318" : "Ctrl"}</span>K
    </kbd>
  );
}

// =====================================================
// Main Component
// =====================================================

export function HeaderSearch({ className }: HeaderSearchProps) {
  const [open, setOpen] = React.useState(false);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Search Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3 py-2",
          "text-sm text-muted-foreground",
          "bg-muted/50 hover:bg-muted transition-colors",
          "border border-border",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        aria-label="Search"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <ShortcutHint />
      </button>

      {/* Search Dialog */}
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

// =====================================================
// Icon-only variant for compact headers
// =====================================================

interface HeaderSearchIconProps {
  className?: string;
}

export function HeaderSearchIcon({ className }: HeaderSearchIconProps) {
  const [open, setOpen] = React.useState(false);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center rounded-md",
          "h-9 w-9",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-accent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        aria-label="Search (Cmd+K)"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
