"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// =====================================================
// Icon Components
// =====================================================

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// =====================================================
// Settings Item Component
// =====================================================

interface SettingsItemProps {
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Main label text */
  label: string;
  /** Secondary description text */
  description?: string;
  /** Value or action component on the right side */
  value?: React.ReactNode;
  /** Action component (alternative to value, for buttons/toggles) */
  action?: React.ReactNode;
  /** Link href if this item is a navigation link */
  href?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether to show a chevron (auto-detected if href is provided) */
  showChevron?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Variant for different visual styles */
  variant?: "default" | "danger";
}

/**
 * A single settings item row with icon, label, and optional value/action.
 * Can be a link, button, or static display.
 */
function SettingsItem({
  icon,
  label,
  description,
  value,
  action,
  href,
  onClick,
  disabled = false,
  showChevron,
  className,
  variant = "default",
}: SettingsItemProps) {
  const shouldShowChevron = showChevron ?? !!href;

  const content = (
    <>
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            variant === "danger"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>
      )}

      {/* Label and Description */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium",
            variant === "danger" ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>

      {/* Value or Action */}
      {value && !action && (
        <div className="flex-shrink-0 text-sm text-muted-foreground">{value}</div>
      )}
      {action && <div className="flex-shrink-0">{action}</div>}

      {/* Chevron for links */}
      {shouldShowChevron && (
        <ChevronRightIcon className="flex-shrink-0 text-muted-foreground" />
      )}
    </>
  );

  const baseClasses = cn(
    "flex items-center gap-4 px-4 py-3",
    "transition-colors duration-200",
    !disabled && (href || onClick) && "hover:bg-accent cursor-pointer",
    disabled && "opacity-50 cursor-not-allowed",
    "border-b last:border-b-0 border-border",
    className
  );

  // Render as link
  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  // Render as button
  if (onClick) {
    return (
      <button
        type="button"
        className={cn(baseClasses, "w-full text-left")}
        onClick={onClick}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  // Render as static item
  return <div className={baseClasses}>{content}</div>;
}

export { SettingsItem };
export type { SettingsItemProps };
