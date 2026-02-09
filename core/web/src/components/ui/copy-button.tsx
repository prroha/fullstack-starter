"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type CopyButtonSize = "sm" | "md" | "lg";

export type CopyButtonVariant = "default" | "outline" | "ghost";

export interface CopyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Text to copy to clipboard */
  text: string;
  /** Duration to show success state in milliseconds */
  copiedDuration?: number;
  /** Whether to show text label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Custom copied label text */
  copiedLabel?: string;
  /** Size variant */
  size?: CopyButtonSize;
  /** Style variant */
  variant?: CopyButtonVariant;
  /** Callback when copy succeeds */
  onCopySuccess?: () => void;
  /** Callback when copy fails */
  onCopyError?: (error: Error) => void;
  /** Custom tooltip text */
  tooltip?: string;
  /** Custom copied tooltip text */
  copiedTooltip?: string;
}

// =====================================================
// Size & Variant Configuration
// =====================================================

const sizeConfig: Record<
  CopyButtonSize,
  { button: string; icon: string; text: string }
> = {
  sm: {
    button: "h-7 px-2 gap-1.5",
    icon: "h-3.5 w-3.5",
    text: "text-xs",
  },
  md: {
    button: "h-9 px-3 gap-2",
    icon: "h-4 w-4",
    text: "text-sm",
  },
  lg: {
    button: "h-11 px-4 gap-2.5",
    icon: "h-5 w-5",
    text: "text-base",
  },
};

const variantConfig: Record<CopyButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
};

// =====================================================
// Icon Components
// =====================================================

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// =====================================================
// CopyButton Component
// =====================================================

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      className,
      text,
      copiedDuration = 2000,
      showLabel = false,
      label = "Copy",
      copiedLabel = "Copied!",
      size = "md",
      variant = "outline",
      onCopySuccess,
      onCopyError,
      tooltip = "Copy to clipboard",
      copiedTooltip = "Copied!",
      disabled,
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const handleCopy = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopySuccess?.();

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Reset after duration
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, copiedDuration);
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Failed to copy");
        onCopyError?.(err);
        console.error("Failed to copy to clipboard:", err);
      }
    }, [text, copiedDuration, onCopySuccess, onCopyError]);

    const sizeStyles = sizeConfig[size];
    const variantStyles = variantConfig[variant];

    const displayLabel = copied ? copiedLabel : label;
    const currentTooltip = copied ? copiedTooltip : tooltip;

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleCopy}
        disabled={disabled}
        aria-label={currentTooltip}
        title={currentTooltip}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-colors",
          variantStyles,
          sizeStyles.button,
          !showLabel && "px-2",
          className
        )}
        {...props}
      >
        {copied ? (
          <CheckIcon className={cn(sizeStyles.icon, "text-green-500")} />
        ) : (
          <CopyIcon className={sizeStyles.icon} />
        )}
        {showLabel && (
          <span className={sizeStyles.text}>{displayLabel}</span>
        )}
      </button>
    );
  }
);
CopyButton.displayName = "CopyButton";

// =====================================================
// CopyableText Component (Bonus utility component)
// =====================================================

export interface CopyableTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text to display and copy */
  text: string;
  /** Truncate long text */
  truncate?: boolean;
  /** Copy button size */
  buttonSize?: CopyButtonSize;
  /** Copy button variant */
  buttonVariant?: CopyButtonVariant;
}

const CopyableText = React.forwardRef<HTMLDivElement, CopyableTextProps>(
  (
    {
      className,
      text,
      truncate = false,
      buttonSize = "sm",
      buttonVariant = "ghost",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 rounded-md bg-muted px-2 py-1",
          className
        )}
        {...props}
      >
        <code
          className={cn(
            "text-sm font-mono",
            truncate && "truncate max-w-[200px]"
          )}
          title={truncate ? text : undefined}
        >
          {text}
        </code>
        <CopyButton text={text} size={buttonSize} variant={buttonVariant} />
      </div>
    );
  }
);
CopyableText.displayName = "CopyableText";

// =====================================================
// Exports
// =====================================================

export { CopyButton, CopyableText };
