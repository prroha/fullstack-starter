"use client";

import * as React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type BreadcrumbSeparator = "/" | ">" | "chevron" | React.ReactNode;

export interface BreadcrumbItem {
  /** Label to display */
  label: string;
  /** Link href (optional - if not provided, item is non-clickable) */
  href?: string;
  /** Click handler (alternative to href) */
  onClick?: () => void;
  /** Icon to display before label */
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Separator between items */
  separator?: BreadcrumbSeparator;
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Maximum number of items to show before collapsing */
  maxItems?: number;
  /** Truncate labels longer than this length */
  maxLabelLength?: number;
  /** Additional class name */
  className?: string;
}

// =====================================================
// Icons
// =====================================================

function HomeIcon({ className }: { className?: string }) {
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
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function EllipsisIcon({ className }: { className?: string }) {
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
        d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}

// =====================================================
// Helper Components
// =====================================================

interface BreadcrumbSeparatorElementProps {
  separator: BreadcrumbSeparator;
}

function BreadcrumbSeparatorElement({ separator }: BreadcrumbSeparatorElementProps) {
  const baseClasses = "mx-2 text-muted-foreground flex-shrink-0";

  if (separator === "/") {
    return <span className={baseClasses}>/</span>;
  }

  if (separator === ">") {
    return <span className={baseClasses}>&gt;</span>;
  }

  if (separator === "chevron") {
    return <ChevronRightIcon className={cn(baseClasses, "h-4 w-4")} />;
  }

  // Custom separator
  return <span className={baseClasses}>{separator}</span>;
}

interface BreadcrumbLinkProps {
  item: BreadcrumbItem;
  isLast: boolean;
  showHomeIcon: boolean;
  isFirst: boolean;
  maxLabelLength?: number;
}

function BreadcrumbLink({
  item,
  isLast,
  showHomeIcon,
  isFirst,
  maxLabelLength,
}: BreadcrumbLinkProps) {
  const truncatedLabel =
    maxLabelLength && item.label.length > maxLabelLength
      ? `${item.label.slice(0, maxLabelLength)}...`
      : item.label;

  const content = (
    <>
      {isFirst && showHomeIcon && !item.icon ? (
        <HomeIcon className="h-4 w-4 flex-shrink-0" />
      ) : item.icon ? (
        <span className="flex-shrink-0 h-4 w-4">{item.icon}</span>
      ) : null}
      <span
        className={cn(
          "truncate",
          maxLabelLength && item.label.length > maxLabelLength && "max-w-[120px]"
        )}
        title={item.label.length > (maxLabelLength || Infinity) ? item.label : undefined}
      >
        {truncatedLabel}
      </span>
    </>
  );

  const baseClasses = cn(
    "inline-flex items-center gap-1.5 text-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
  );

  // Last item (current page) - non-clickable
  if (isLast) {
    return (
      <span
        className={cn(baseClasses, "font-medium text-foreground")}
        aria-current="page"
      >
        {content}
      </span>
    );
  }

  // Clickable link
  if (item.href) {
    return (
      <NextLink
        href={item.href}
        className={cn(
          baseClasses,
          "text-muted-foreground hover:text-foreground transition-colors"
        )}
      >
        {content}
      </NextLink>
    );
  }

  // Clickable button (onClick handler)
  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className={cn(
          baseClasses,
          "text-muted-foreground hover:text-foreground transition-colors"
        )}
      >
        {content}
      </button>
    );
  }

  // Non-clickable text (no href or onClick)
  return (
    <span className={cn(baseClasses, "text-muted-foreground")}>{content}</span>
  );
}

// =====================================================
// Breadcrumb Component
// =====================================================

function Breadcrumb({
  items,
  separator = "chevron",
  showHomeIcon = false,
  maxItems,
  maxLabelLength,
  className,
}: BreadcrumbProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Determine which items to show based on maxItems and expansion state
  const visibleItems = React.useMemo(() => {
    if (!maxItems || items.length <= maxItems || isExpanded) {
      return items;
    }

    // Show first item, ellipsis, and last (maxItems - 1) items
    const itemsToShowAtEnd = maxItems - 1;
    return [
      items[0],
      { label: "...", href: undefined } as BreadcrumbItem, // Ellipsis placeholder
      ...items.slice(-itemsToShowAtEnd),
    ];
  }, [items, maxItems, isExpanded]);

  const shouldShowEllipsis =
    maxItems && items.length > maxItems && !isExpanded;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center flex-wrap">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isFirst = index === 0;
          const isEllipsis = shouldShowEllipsis && index === 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {/* Separator (except before first item) */}
              {index > 0 && (
                <BreadcrumbSeparatorElement separator={separator} />
              )}

              {/* Ellipsis button (collapsed items) */}
              {isEllipsis ? (
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className={cn(
                    "inline-flex items-center justify-center h-6 w-6 rounded-md",
                    "text-muted-foreground hover:text-foreground hover:bg-accent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  aria-label={`Show ${items.length - maxItems!} more items`}
                >
                  <EllipsisIcon className="h-4 w-4" />
                </button>
              ) : (
                <BreadcrumbLink
                  item={item}
                  isLast={isLast}
                  showHomeIcon={showHomeIcon}
                  isFirst={isFirst}
                  maxLabelLength={maxLabelLength}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// =====================================================
// Exports
// =====================================================

export { Breadcrumb };
