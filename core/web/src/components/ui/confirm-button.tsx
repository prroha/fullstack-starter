"use client";

import * as React from "react";
import { Button, ButtonProps } from "./button";
import { Dialog, DialogHeader, DialogBody, DialogFooter } from "./dialog";

// =====================================================
// Types
// =====================================================

type ConfirmMode = "double-click" | "dialog";

interface ConfirmButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Confirmation pattern to use */
  confirmMode?: ConfirmMode;
  /** Title for dialog mode */
  confirmTitle?: string;
  /** Message for dialog mode */
  confirmMessage?: string;
  /** Label for confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for cancel button in dialog mode (default: "Cancel") */
  cancelLabel?: string;
  /** Callback when action is confirmed */
  onConfirm: () => void;
  /** Original button text (used to show "Are you sure?" state) */
  children: React.ReactNode;
}

// =====================================================
// Constants
// =====================================================

const RESET_TIMEOUT_MS = 3000;

// =====================================================
// ConfirmButton Component
// =====================================================

/**
 * A button that requires confirmation before executing destructive actions.
 *
 * Two confirmation patterns are available:
 * - "double-click": First click shows "Are you sure?", second click within 3 seconds confirms
 * - "dialog": Opens a confirmation dialog before executing
 *
 * @example
 * ```tsx
 * // Double-click pattern (default)
 * <ConfirmButton
 *   variant="destructive"
 *   onConfirm={() => deleteItem()}
 * >
 *   Delete
 * </ConfirmButton>
 *
 * // Dialog pattern
 * <ConfirmButton
 *   confirmMode="dialog"
 *   confirmTitle="Delete Item"
 *   confirmMessage="Are you sure you want to delete this item? This action cannot be undone."
 *   variant="destructive"
 *   onConfirm={() => deleteItem()}
 * >
 *   Delete
 * </ConfirmButton>
 * ```
 */
const ConfirmButton = React.forwardRef<HTMLButtonElement, ConfirmButtonProps>(
  (
    {
      confirmMode = "double-click",
      confirmTitle = "Confirm Action",
      confirmMessage = "Are you sure you want to proceed?",
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      onConfirm,
      children,
      variant = "default",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    // State for double-click mode
    const [isWaitingConfirm, setIsWaitingConfirm] = React.useState(false);
    const resetTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // State for dialog mode
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
      };
    }, []);

    // Reset waiting state after timeout
    const startResetTimer = React.useCallback(() => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(() => {
        setIsWaitingConfirm(false);
        resetTimeoutRef.current = null;
      }, RESET_TIMEOUT_MS);
    }, []);

    // Handle button click based on mode
    const handleClick = React.useCallback(() => {
      if (confirmMode === "dialog") {
        setIsDialogOpen(true);
        return;
      }

      // Double-click mode
      if (isWaitingConfirm) {
        // Second click - confirm action
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = null;
        }
        setIsWaitingConfirm(false);
        onConfirm();
      } else {
        // First click - show confirmation state
        setIsWaitingConfirm(true);
        startResetTimer();
      }
    }, [confirmMode, isWaitingConfirm, onConfirm, startResetTimer]);

    // Handle dialog confirmation
    const handleDialogConfirm = React.useCallback(() => {
      setIsDialogOpen(false);
      onConfirm();
    }, [onConfirm]);

    // Handle dialog cancel
    const handleDialogClose = React.useCallback(() => {
      setIsDialogOpen(false);
    }, []);

    // Determine button appearance for double-click mode
    const buttonVariant = isWaitingConfirm ? "destructive" : variant;
    const buttonText = isWaitingConfirm ? "Are you sure?" : children;

    return (
      <>
        <Button
          ref={ref}
          variant={buttonVariant}
          disabled={disabled}
          onClick={handleClick}
          className={className}
          {...props}
        >
          {buttonText}
        </Button>

        {/* Dialog for dialog mode */}
        {confirmMode === "dialog" && (
          <Dialog
            isOpen={isDialogOpen}
            onClose={handleDialogClose}
            size="sm"
          >
            <DialogHeader showCloseButton={false}>
              <h2 className="text-lg font-semibold text-foreground">
                {confirmTitle}
              </h2>
            </DialogHeader>
            <DialogBody>
              <p className="text-muted-foreground">{confirmMessage}</p>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={handleDialogClose}>
                {cancelLabel}
              </Button>
              <Button variant="destructive" onClick={handleDialogConfirm}>
                {confirmLabel}
              </Button>
            </DialogFooter>
          </Dialog>
        )}
      </>
    );
  }
);
ConfirmButton.displayName = "ConfirmButton";

// =====================================================
// Exports
// =====================================================

export { ConfirmButton };
export type { ConfirmButtonProps, ConfirmMode };
