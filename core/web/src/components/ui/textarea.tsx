"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Textarea Component
// =====================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Whether to show the character counter */
  showCharacterCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCharacterCount, maxLength, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(
      typeof props.value === "string" ? props.value.length :
      typeof props.defaultValue === "string" ? props.defaultValue.length : 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    // Calculate percentage for color transitions
    const percentage = maxLength ? (charCount / maxLength) * 100 : 0;
    const isWarning = percentage >= 80 && percentage < 100;
    const isError = percentage >= 100;

    const showCounter = showCharacterCount && maxLength !== undefined;

    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        {showCounter && (
          <div
            className={cn(
              "mt-1 text-right text-xs ",
              isError
                ? "text-destructive font-medium animate-pulse"
                : isWarning
                  ? "text-orange-500 font-medium"
                  : "text-muted-foreground"
            )}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
