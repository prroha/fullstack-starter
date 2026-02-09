"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Controlled open state */
  open?: boolean;
  /** Default open state for uncontrolled mode */
  defaultOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether the collapsible is disabled */
  disabled?: boolean;
}

export interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Custom expand icon */
  expandIcon?: React.ReactNode;
  /** Custom collapse icon */
  collapseIcon?: React.ReactNode;
  /** Whether to show the default chevron icon */
  showIcon?: boolean;
  /** Icon position */
  iconPosition?: "left" | "right";
}

export interface CollapsibleContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Force mount the content (useful for animations) */
  forceMount?: boolean;
}

// =====================================================
// Collapsible Context
// =====================================================

interface CollapsibleContextValue {
  open: boolean;
  disabled: boolean;
  onToggle: () => void;
  triggerId: string;
  contentId: string;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error(
      "Collapsible components must be used within a Collapsible"
    );
  }
  return context;
}

// =====================================================
// Collapsible Component
// =====================================================

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      className,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const triggerId = React.useId();
    const contentId = React.useId();

    // Determine if controlled or uncontrolled
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const onToggle = React.useCallback(() => {
      if (disabled) return;

      if (!isControlled) {
        setUncontrolledOpen((prev) => !prev);
      }
      onOpenChange?.(!open);
    }, [disabled, isControlled, open, onOpenChange]);

    return (
      <CollapsibleContext.Provider
        value={{ open, disabled, onToggle, triggerId, contentId }}
      >
        <div
          ref={ref}
          className={cn(className)}
          data-state={open ? "open" : "closed"}
          data-disabled={disabled || undefined}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = "Collapsible";

// =====================================================
// Collapsible Trigger Component
// =====================================================

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(
  (
    {
      className,
      children,
      expandIcon,
      collapseIcon,
      showIcon = true,
      iconPosition = "right",
      ...props
    },
    ref
  ) => {
    const { open, disabled, onToggle, triggerId, contentId } =
      useCollapsibleContext();

    const defaultIcon = (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );

    const icon = showIcon ? (
      <span
        className={cn(
          "flex-shrink-0 text-muted-foreground transition-transform duration-200",
          open && !collapseIcon && "rotate-180"
        )}
      >
        {open
          ? collapseIcon ?? expandIcon ?? defaultIcon
          : expandIcon ?? defaultIcon}
      </span>
    ) : null;

    return (
      <button
        ref={ref}
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-2 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {iconPosition === "left" && icon}
        <span className="flex-1">{children}</span>
        {iconPosition === "right" && icon}
      </button>
    );
  }
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

// =====================================================
// Collapsible Content Component
// =====================================================

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, children, forceMount = false, ...props }, ref) => {
  const { open, triggerId, contentId } = useCollapsibleContext();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(undefined);

  // Measure content height for animation
  React.useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  // Don't render if not open and not forced
  if (!open && !forceMount) {
    return null;
  }

  return (
    <div
      ref={ref}
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      aria-hidden={!open}
      className={cn(
        "overflow-hidden transition-all duration-200 ease-in-out",
        !open && "opacity-0",
        open && "opacity-100"
      )}
      style={{
        height: forceMount ? (open ? height : 0) : undefined,
      }}
    >
      <div ref={contentRef} className={cn(className)} {...props}>
        {children}
      </div>
    </div>
  );
});
CollapsibleContent.displayName = "CollapsibleContent";

// =====================================================
// Exports
// =====================================================

export { Collapsible, CollapsibleTrigger, CollapsibleContent, useCollapsibleContext };
