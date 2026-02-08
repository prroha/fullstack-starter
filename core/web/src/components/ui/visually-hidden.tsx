import * as React from "react";

// =====================================================
// VisuallyHidden Component
// =====================================================

export interface VisuallyHiddenProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Content to be hidden visually but accessible to screen readers */
  children: React.ReactNode;
}

/**
 * Hides content visually while keeping it accessible to screen readers.
 * Useful for providing context to assistive technologies without affecting
 * the visual layout.
 */
const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);
VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
