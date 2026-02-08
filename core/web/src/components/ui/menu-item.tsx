import * as React from "react";
import { cn } from "@/lib/utils";
import { Kbd } from "./kbd";

// =====================================================
// Types
// =====================================================

export interface MenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to display before label */
  icon?: React.ReactNode;
  /** Menu item label */
  label: string;
  /** Keyboard shortcut to display */
  shortcut?: string;
  /** Whether the item is destructive (e.g., delete action) */
  destructive?: boolean;
}

// =====================================================
// MenuItem Component
// =====================================================

const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  (
    {
      className,
      icon,
      label,
      shortcut,
      disabled = false,
      destructive = false,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-sm",
          "text-sm text-left",
          "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
          "disabled:pointer-events-none disabled:opacity-50",
          destructive
            ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:text-destructive"
            : "hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <span className="flex-shrink-0 h-4 w-4" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Label */}
        <span className="flex-1 truncate">{label}</span>

        {/* Keyboard shortcut */}
        {shortcut && (
          <Kbd className="ml-auto">{shortcut}</Kbd>
        )}
      </button>
    );
  }
);
MenuItem.displayName = "MenuItem";

export { MenuItem };
