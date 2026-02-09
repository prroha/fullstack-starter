"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

type PopoverPosition = "top" | "bottom" | "left" | "right";
type PopoverAlignment = "start" | "center" | "end";

interface PopoverProps {
  /** The content to display in the popover */
  children: React.ReactNode;
  /** The trigger element */
  trigger: React.ReactElement;
  /** Position of the popover relative to the trigger */
  position?: PopoverPosition;
  /** Alignment of the popover along the position axis */
  alignment?: PopoverAlignment;
  /** Whether the popover is open (controlled mode) */
  isOpen?: boolean;
  /** Callback when the popover open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Default open state for uncontrolled mode */
  defaultOpen?: boolean;
  /** Whether to close on click outside */
  closeOnClickOutside?: boolean;
  /** Whether to close on Escape key */
  closeOnEscape?: boolean;
  /** Additional class name for the popover */
  className?: string;
  /** Additional class name for the content container */
  contentClassName?: string;
  /** Whether the popover is disabled */
  disabled?: boolean;
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// =====================================================
// Position Calculation Utilities
// =====================================================

interface Position {
  top: number;
  left: number;
}

function calculatePosition(
  triggerRect: DOMRect,
  popoverRect: DOMRect,
  position: PopoverPosition,
  alignment: PopoverAlignment,
  gap: number = 8
): Position {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let top = 0;
  let left = 0;

  // Calculate primary position
  switch (position) {
    case "top":
      top = triggerRect.top + scrollY - popoverRect.height - gap;
      break;
    case "bottom":
      top = triggerRect.bottom + scrollY + gap;
      break;
    case "left":
      left = triggerRect.left + scrollX - popoverRect.width - gap;
      break;
    case "right":
      left = triggerRect.right + scrollX + gap;
      break;
  }

  // Calculate alignment
  if (position === "top" || position === "bottom") {
    switch (alignment) {
      case "start":
        left = triggerRect.left + scrollX;
        break;
      case "center":
        left = triggerRect.left + scrollX + (triggerRect.width - popoverRect.width) / 2;
        break;
      case "end":
        left = triggerRect.right + scrollX - popoverRect.width;
        break;
    }
  } else {
    switch (alignment) {
      case "start":
        top = triggerRect.top + scrollY;
        break;
      case "center":
        top = triggerRect.top + scrollY + (triggerRect.height - popoverRect.height) / 2;
        break;
      case "end":
        top = triggerRect.bottom + scrollY - popoverRect.height;
        break;
    }
  }

  // Boundary collision detection - keep popover within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Adjust horizontal position
  if (left < scrollX + 8) {
    left = scrollX + 8;
  } else if (left + popoverRect.width > scrollX + viewportWidth - 8) {
    left = scrollX + viewportWidth - popoverRect.width - 8;
  }

  // Adjust vertical position
  if (top < scrollY + 8) {
    top = scrollY + 8;
  } else if (top + popoverRect.height > scrollY + viewportHeight - 8) {
    top = scrollY + viewportHeight - popoverRect.height - 8;
  }

  return { top, left };
}

// =====================================================
// Focus Trap Hook
// =====================================================

function useFocusTrap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  isActive: boolean,
  onEscape?: () => void
) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus the first focusable element or the container
    if (firstElement) {
      firstElement.focus();
    } else {
      container.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Restore focus when popover closes
      previouslyFocused?.focus?.();
    };
  }, [containerRef, isActive, onEscape]);
}

// =====================================================
// Popover Component
// =====================================================

function Popover({
  children,
  trigger,
  position = "bottom",
  alignment = "center",
  isOpen: controlledIsOpen,
  onOpenChange,
  defaultOpen = false,
  closeOnClickOutside = true,
  closeOnEscape = true,
  className,
  contentClassName,
  disabled = false,
}: PopoverProps) {
  // Uncontrolled state
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = React.useState(defaultOpen);

  // Determine if controlled or uncontrolled
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const setIsOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledIsOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const [coords, setCoords] = React.useState<Position>({ top: 0, left: 0 });
  const [mounted, setMounted] = React.useState(false);

  const triggerRef = React.useRef<HTMLElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const popoverId = React.useId();

  // Handle mounting for portal
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update position when open
  React.useEffect(() => {
    if (!isOpen || !triggerRef.current || !popoverRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current || !popoverRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      setCoords(calculatePosition(triggerRect, popoverRect, position, alignment));
    };

    updatePosition();

    // Update on scroll or resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, position, alignment]);

  // Handle click outside
  React.useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    // Add with slight delay to prevent immediate close on trigger click
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeOnClickOutside, setIsOpen]);

  // Handle escape key (handled in focus trap hook)
  const handleEscape = React.useCallback(() => {
    if (closeOnEscape) {
      setIsOpen(false);
    }
  }, [closeOnEscape, setIsOpen]);

  // Focus trap
  useFocusTrap(popoverRef, isOpen, handleEscape);

  // Toggle popover
  const togglePopover = React.useCallback(() => {
    if (disabled) return;
    setIsOpen(!isOpen);
  }, [disabled, isOpen, setIsOpen]);

  // Clone the trigger element to add event handlers and refs
  const triggerElement = React.cloneElement(trigger, {
    ref: triggerRef,
    onClick: (e: React.MouseEvent) => {
      togglePopover();
      trigger.props.onClick?.(e);
    },
    "aria-expanded": isOpen,
    "aria-haspopup": "dialog",
    "aria-controls": isOpen ? popoverId : undefined,
  });

  const popoverContent = isOpen && mounted && (
    <div
      ref={popoverRef}
      id={popoverId}
      role="dialog"
      aria-modal="false"
      tabIndex={-1}
      className={cn(
        "fixed z-50 min-w-[8rem] rounded-lg border border-border bg-background shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        "focus:outline-none",
        className
      )}
      style={{
        top: coords.top,
        left: coords.left,
      }}
    >
      <div className={cn("p-3", contentClassName)}>{children}</div>
    </div>
  );

  return (
    <>
      {triggerElement}
      {mounted && popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
}

// =====================================================
// PopoverContent - Styled content wrapper
// =====================================================

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-sm text-foreground", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

// =====================================================
// PopoverHeader - Header section for popover
// =====================================================

interface PopoverHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const PopoverHeader = React.forwardRef<HTMLDivElement, PopoverHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-1 pb-2 mb-2 border-b border-border font-medium text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverHeader.displayName = "PopoverHeader";

// =====================================================
// PopoverFooter - Footer section for popover
// =====================================================

interface PopoverFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const PopoverFooter = React.forwardRef<HTMLDivElement, PopoverFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-1 pt-2 mt-2 border-t border-border flex items-center justify-end gap-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverFooter.displayName = "PopoverFooter";

// =====================================================
// PopoverClose - Close button for popover
// =====================================================

interface PopoverCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Callback when close is triggered */
  onClose?: () => void;
}

const PopoverClose = React.forwardRef<HTMLButtonElement, PopoverCloseProps>(
  ({ className, onClick, onClose, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onClose?.();
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "text-muted-foreground hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        <span className="sr-only">Close</span>
      </button>
    );
  }
);
PopoverClose.displayName = "PopoverClose";

// =====================================================
// Exports
// =====================================================

export { Popover, PopoverContent, PopoverHeader, PopoverFooter, PopoverClose };
export type {
  PopoverProps,
  PopoverPosition,
  PopoverAlignment,
  PopoverContentProps,
  PopoverHeaderProps,
  PopoverFooterProps,
  PopoverCloseProps,
};
