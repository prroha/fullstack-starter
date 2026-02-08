"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Accordion Context
// =====================================================

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggleItem: (value: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
}

// =====================================================
// Accordion Component
// =====================================================

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Type of accordion - single allows one item, multiple allows many */
  type?: "single" | "multiple";
  /** Default expanded item(s) */
  defaultValue?: string | string[];
  /** Controlled value */
  value?: string | string[];
  /** Callback when value changes */
  onValueChange?: (value: string | string[]) => void;
  /** Whether the accordion can be fully collapsed */
  collapsible?: boolean;
}

function Accordion({
  type = "single",
  defaultValue,
  value,
  onValueChange,
  collapsible = true,
  className,
  children,
  ...props
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => {
    if (value !== undefined) {
      return new Set(Array.isArray(value) ? value : value ? [value] : []);
    }
    if (defaultValue !== undefined) {
      return new Set(Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []);
    }
    return new Set();
  });

  // Sync with controlled value
  React.useEffect(() => {
    if (value !== undefined) {
      setExpandedItems(new Set(Array.isArray(value) ? value : value ? [value] : []));
    }
  }, [value]);

  const toggleItem = React.useCallback(
    (itemValue: string) => {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(itemValue)) {
          if (collapsible || (type === "single" && newSet.size === 1)) {
            newSet.delete(itemValue);
          }
        } else {
          if (type === "single") {
            newSet.clear();
          }
          newSet.add(itemValue);
        }

        // Notify parent of change
        if (onValueChange) {
          const result = Array.from(newSet);
          onValueChange(type === "single" ? (result[0] ?? "") : result);
        }

        return newSet;
      });
    },
    [type, collapsible, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleItem, type }}>
      <div
        className={cn("divide-y divide-border rounded-lg border border-border", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// =====================================================
// Accordion Item Component
// =====================================================

interface AccordionItemContextValue {
  value: string;
  isExpanded: boolean;
  triggerId: string;
  contentId: string;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error("AccordionItem components must be used within an AccordionItem");
  }
  return context;
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique value for this item */
  value: string;
  /** Whether this item is disabled */
  disabled?: boolean;
}

function AccordionItem({
  value,
  disabled = false,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const { expandedItems } = useAccordionContext();
  const isExpanded = expandedItems.has(value);
  const triggerId = React.useId();
  const contentId = React.useId();

  return (
    <AccordionItemContext.Provider value={{ value, isExpanded, triggerId, contentId }}>
      <div
        className={cn(
          "first:rounded-t-lg last:rounded-b-lg overflow-hidden",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        data-state={isExpanded ? "open" : "closed"}
        data-disabled={disabled || undefined}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// =====================================================
// Accordion Trigger Component
// =====================================================

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon to show when collapsed (optional, defaults to chevron) */
  icon?: React.ReactNode;
}

function AccordionTrigger({
  className,
  children,
  icon,
  ...props
}: AccordionTriggerProps) {
  const { toggleItem } = useAccordionContext();
  const { value, isExpanded, triggerId, contentId } = useAccordionItemContext();

  return (
    <button
      id={triggerId}
      type="button"
      aria-expanded={isExpanded}
      aria-controls={contentId}
      onClick={() => toggleItem(value)}
      className={cn(
        // Content-first spacing: tighter padding (was py-4 px-4)
        "flex w-full items-center justify-between py-3 px-3 text-left",
        "font-medium text-foreground",
        "hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      {icon ?? (
        <svg
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );
}

// =====================================================
// Accordion Content Component
// =====================================================

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionContentProps) {
  const { isExpanded, triggerId, contentId } = useAccordionItemContext();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      aria-hidden={!isExpanded}
      className={cn(
        "overflow-hidden transition-all duration-200 ease-in-out",
        isExpanded ? "opacity-100" : "opacity-0"
      )}
      style={{
        height: isExpanded ? height : 0,
      }}
    >
      <div
        ref={contentRef}
        // Content-first spacing: tighter padding (was px-4 pb-4)
        className={cn("px-3 pb-3 pt-0 text-muted-foreground", className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

// =====================================================
// Exports
// =====================================================

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps };
