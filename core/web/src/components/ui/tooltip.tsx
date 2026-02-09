"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

type TooltipPosition = "top" | "bottom" | "left" | "right";
type TooltipVariant = "dark" | "light";

interface TooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode;
  /** Position of the tooltip relative to the trigger */
  position?: TooltipPosition;
  /** Delay in milliseconds before showing the tooltip */
  delay?: number;
  /** Visual variant */
  variant?: TooltipVariant;
  /** Whether to show arrow indicator */
  showArrow?: boolean;
  /** Additional class name for the tooltip */
  className?: string;
  /** The trigger element */
  children: React.ReactElement;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

// =====================================================
// Position Calculation Utilities
// =====================================================

interface Position {
  top: number;
  left: number;
}

function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  position: TooltipPosition,
  gap: number = 8
): Position {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  switch (position) {
    case "top":
      return {
        top: triggerRect.top + scrollY - tooltipRect.height - gap,
        left: triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2,
      };
    case "bottom":
      return {
        top: triggerRect.bottom + scrollY + gap,
        left: triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2,
      };
    case "left":
      return {
        top: triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2,
        left: triggerRect.left + scrollX - tooltipRect.width - gap,
      };
    case "right":
      return {
        top: triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2,
        left: triggerRect.right + scrollX + gap,
      };
  }
}

// =====================================================
// Tooltip Component
// =====================================================

const variantClasses: Record<TooltipVariant, string> = {
  dark: "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900",
  light: "bg-white text-gray-900 border border-border shadow-lg dark:bg-gray-800 dark:text-gray-100",
};

const arrowVariantClasses: Record<TooltipVariant, string> = {
  dark: "border-gray-900 dark:border-gray-100",
  light: "border-white dark:border-gray-800",
};

const arrowPositionClasses: Record<TooltipPosition, string> = {
  top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r",
  bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-t border-l",
  left: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 rotate-45 border-t border-r",
  right: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-l",
};

function Tooltip({
  content,
  position = "top",
  delay = 200,
  variant = "dark",
  showArrow = true,
  className,
  children,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [coords, setCoords] = React.useState<Position>({ top: 0, left: 0 });
  const [mounted, setMounted] = React.useState(false);

  const triggerRef = React.useRef<HTMLElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const tooltipId = React.useId();

  // Handle mounting for portal
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Update position when visible
  React.useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      setCoords(calculatePosition(triggerRect, tooltipRect, position));
    };

    updatePosition();

    // Update on scroll or resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, position]);

  const showTooltip = React.useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clone the child element to add event handlers and refs
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      children.props.onBlur?.(e);
    },
    "aria-describedby": isVisible ? tooltipId : undefined,
  });

  const tooltipContent = isVisible && mounted && (
    <div
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      className={cn(
        "fixed z-50 px-2.5 py-1.5 text-sm rounded-md",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        variantClasses[variant],
        className
      )}
      style={{
        top: coords.top,
        left: coords.left,
      }}
    >
      {content}
      {showArrow && (
        <span
          className={cn(
            "absolute w-2 h-2 bg-inherit",
            arrowPositionClasses[position],
            arrowVariantClasses[variant]
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );

  return (
    <>
      {trigger}
      {mounted && tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
}

// =====================================================
// TooltipTrigger - A wrapper for trigger elements
// =====================================================

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Whether to render as a span or inherit the child element */
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLSpanElement, TooltipTriggerProps>(
  ({ className, children, asChild = false, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ref,
        ...props,
      } as React.HTMLAttributes<HTMLElement>);
    }

    return (
      <span
        ref={ref}
        className={cn("inline-flex", className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

// =====================================================
// Exports
// =====================================================

export { Tooltip, TooltipTrigger };
export type { TooltipProps, TooltipPosition, TooltipVariant, TooltipTriggerProps };
