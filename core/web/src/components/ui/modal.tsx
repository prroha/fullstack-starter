"use client";

import * as React from "react";
import { Dialog, DialogBody, DialogFooter, DialogSize } from "./dialog";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title displayed in the header */
  title: string;
  /** Size variant: sm (320px), md (448px), lg (512px) */
  size?: ModalSize;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content (typically action buttons) */
  footer?: React.ReactNode;
  /** Additional class name for the modal container */
  className?: string;
  /** Additional class name for the body content */
  bodyClassName?: string;
  /** Whether clicking the overlay closes the modal (default: true) */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the modal (default: true) */
  closeOnEscape?: boolean;
}

// =====================================================
// Size Mapping
// =====================================================

// Map Modal sizes to Dialog sizes
const sizeMap: Record<ModalSize, DialogSize> = {
  sm: "sm",
  md: "md",
  lg: "lg",
};

// =====================================================
// Modal Component
// =====================================================

/**
 * Modal - A simplified wrapper around Dialog for common modal use cases.
 *
 * Features:
 * - Dark overlay backdrop
 * - Centered on screen
 * - Close button in header
 * - Escape key to close
 * - Focus trapping for accessibility
 * - Smooth open/close animations
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   size="md"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button onClick={handleConfirm}>Confirm</Button>
 *     </>
 *   }
 * >
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 * ```
 */
function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  footer,
  className,
  bodyClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={sizeMap[size]}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEscape={closeOnEscape}
      className={className}
    >
      <DialogBody className={cn(bodyClassName)}>
        {children}
      </DialogBody>
      {footer && (
        <DialogFooter>
          {footer}
        </DialogFooter>
      )}
    </Dialog>
  );
}

Modal.displayName = "Modal";

// =====================================================
// Exports
// =====================================================

export { Modal };
export type { ModalProps, ModalSize };
