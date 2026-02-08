"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Settings Toggle Component
// =====================================================

interface SettingsToggleProps {
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Main label text */
  label: string;
  /** Secondary description text */
  description?: string;
  /** Current toggle value */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A settings item with a toggle switch.
 */
function SettingsToggle({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className,
}: SettingsToggleProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3",
        "border-b last:border-b-0 border-border",
        disabled && "opacity-50",
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      )}

      {/* Label and Description */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>

      {/* Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full",
          "border-2 border-transparent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-muted",
          disabled && "cursor-not-allowed"
        )}
      >
        <span className="sr-only">{label}</span>
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg",
            "ring-0 transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export { SettingsToggle };
export type { SettingsToggleProps };
