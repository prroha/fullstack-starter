"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

type DialogSize = "sm" | "md" | "lg" | "xl" | "full";

interface DialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Dialog title (optional, can also use DialogHeader) */
  title?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Size variant */
  size?: DialogSize;
  /** Whether clicking the overlay closes the dialog */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the dialog */
  closeOnEscape?: boolean;
  /** Additional class name for the dialog container */
  className?: string;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Close button click handler */
  onClose?: () => void;
}

interface DialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

// =====================================================
// Dialog Context
// =====================================================

interface DialogContextValue {
  onClose: () => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog sub-components must be used within a Dialog");
  }
  return context;
}

// =====================================================
// Focus Trap Hook
// =====================================================

function useFocusTrap(containerRef: React.RefObject<HTMLDivElement | null>, isActive: boolean) {
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
      // Restore focus when dialog closes
      previouslyFocused?.focus?.();
    };
  }, [containerRef, isActive]);
}

// =====================================================
// Dialog Component
// =====================================================

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] h-full",
};

function Dialog({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [mounted, setMounted] = React.useState(false);

  // Handle mounting for portal
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus trap
  useFocusTrap(dialogRef, isOpen);

  // Handle overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  }

  if (!mounted || !isOpen) return null;

  const dialogContent = (
    <DialogContext.Provider value={{ onClose, titleId, descriptionId }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        {/* Dialog */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className={cn(
            "w-full bg-background rounded-xl shadow-2xl border border-border",
            "overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            "focus:outline-none",
            sizeClasses[size],
            size === "full" && "flex flex-col",
            className
          )}
        >
          {/* Default title if provided directly */}
          {title && (
            <DialogHeader>
              <h2
                id={titleId}
                className="text-lg font-semibold text-foreground"
              >
                {title}
              </h2>
            </DialogHeader>
          )}
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );

  return createPortal(dialogContent, document.body);
}

// =====================================================
// DialogHeader Component
// =====================================================

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, showCloseButton = true, onClose, children, ...props }, ref) => {
    const context = useDialogContext();
    const handleClose = onClose ?? context.onClose;

    return (
      <div
        ref={ref}
        className={cn(
          // Content-first spacing: tighter padding (was px-6 py-4)
          "flex items-center justify-between gap-3 px-4 py-3 border-b border-border",
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">{children}</div>
        {showCloseButton && (
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-md",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-accent transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label="Close dialog"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
);
DialogHeader.displayName = "DialogHeader";

// =====================================================
// DialogBody Component
// =====================================================

const DialogBody = React.forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Content-first spacing: tighter padding (was px-6 py-4)
          "px-4 py-3 overflow-y-auto flex-1",
          "text-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
DialogBody.displayName = "DialogBody";

// =====================================================
// DialogFooter Component
// =====================================================

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Content-first spacing: tighter padding (was px-6 py-4)
          "flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/50",
          className
        )}
        {...props}
      />
    );
  }
);
DialogFooter.displayName = "DialogFooter";

// =====================================================
// Close Icon
// =====================================================

function CloseIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// =====================================================
// Exports
// =====================================================

export { Dialog, DialogHeader, DialogBody, DialogFooter };
export type { DialogProps, DialogHeaderProps, DialogBodyProps, DialogFooterProps, DialogSize };
