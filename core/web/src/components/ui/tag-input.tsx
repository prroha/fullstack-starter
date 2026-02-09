"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// TagInput Component
// =====================================================

interface TagInputProps {
  /** Array of current tags */
  value: string[];
  /** Callback when tags change */
  onChange: (tags: string[]) => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Label text */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Whether to allow duplicate tags */
  allowDuplicates?: boolean;
  /** Characters that trigger tag creation (default: Enter, comma) */
  delimiter?: string | string[];
  /** Custom validation function for tags */
  validateTag?: (tag: string) => boolean | string;
  /** Custom tag renderer */
  renderTag?: (
    tag: string,
    index: number,
    onRemove: () => void
  ) => React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class name */
  className?: string;
  /** Input id */
  id?: string;
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "Type and press Enter...",
      disabled,
      error,
      label,
      required,
      maxTags,
      allowDuplicates = false,
      delimiter = [","],
      validateTag,
      renderTag,
      size = "md",
      className,
      id,
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const [inputValue, setInputValue] = React.useState("");
    const [focusedTagIndex, setFocusedTagIndex] = React.useState<number | null>(
      null
    );
    const [validationError, setValidationError] = React.useState<string | null>(
      null
    );

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Normalize delimiter to array
    const delimiters = React.useMemo(
      () => Array.isArray(delimiter) ? delimiter : [delimiter],
      [delimiter]
    );

    // Size variants
    const containerSizes = {
      sm: "min-h-9 px-2 py-1 text-xs gap-1",
      md: "min-h-10 px-3 py-2 text-sm gap-1.5",
      lg: "min-h-11 px-4 py-2 text-base gap-2",
    };

    const tagSizes = {
      sm: "px-1.5 py-0.5 text-xs gap-0.5",
      md: "px-2 py-0.5 text-xs gap-1",
      lg: "px-2.5 py-1 text-sm gap-1.5",
    };

    const removeButtonSizes = {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    };

    const addTag = React.useCallback(
      (tagValue: string) => {
        const trimmedTag = tagValue.trim();

        if (!trimmedTag) {
          setValidationError(null);
          return false;
        }

        // Check max tags
        if (maxTags && value.length >= maxTags) {
          setValidationError(`Maximum of ${maxTags} tags allowed`);
          return false;
        }

        // Check duplicates
        if (!allowDuplicates && value.includes(trimmedTag)) {
          setValidationError("Duplicate tag not allowed");
          return false;
        }

        // Custom validation
        if (validateTag) {
          const validationResult = validateTag(trimmedTag);
          if (validationResult === false) {
            setValidationError("Invalid tag");
            return false;
          }
          if (typeof validationResult === "string") {
            setValidationError(validationResult);
            return false;
          }
        }

        setValidationError(null);
        onChange([...value, trimmedTag]);
        return true;
      },
      [value, onChange, maxTags, allowDuplicates, validateTag]
    );

    const removeTag = React.useCallback(
      (index: number) => {
        if (disabled) return;
        const newTags = value.filter((_, i) => i !== index);
        onChange(newTags);
        setFocusedTagIndex(null);
        inputRef.current?.focus();
      },
      [value, onChange, disabled]
    );

    const handleInputChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        // Check if the last character is a delimiter
        const lastChar = newValue.slice(-1);
        if (delimiters.includes(lastChar)) {
          const tagToAdd = newValue.slice(0, -1);
          if (addTag(tagToAdd)) {
            setInputValue("");
          }
          return;
        }

        setInputValue(newValue);
        setValidationError(null);
      },
      [delimiters, addTag]
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        // Enter to add tag
        if (e.key === "Enter") {
          e.preventDefault();
          if (addTag(inputValue)) {
            setInputValue("");
          }
          return;
        }

        // Backspace to remove last tag when input is empty
        if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
          if (focusedTagIndex !== null) {
            // Remove focused tag
            removeTag(focusedTagIndex);
          } else {
            // Focus last tag
            setFocusedTagIndex(value.length - 1);
          }
          return;
        }

        // Arrow keys for tag navigation
        if (e.key === "ArrowLeft" && inputValue === "") {
          e.preventDefault();
          if (focusedTagIndex === null && value.length > 0) {
            setFocusedTagIndex(value.length - 1);
          } else if (focusedTagIndex !== null && focusedTagIndex > 0) {
            setFocusedTagIndex(focusedTagIndex - 1);
          }
          return;
        }

        if (e.key === "ArrowRight") {
          if (focusedTagIndex !== null) {
            e.preventDefault();
            if (focusedTagIndex < value.length - 1) {
              setFocusedTagIndex(focusedTagIndex + 1);
            } else {
              setFocusedTagIndex(null);
              inputRef.current?.focus();
            }
          }
          return;
        }

        // Delete to remove focused tag
        if (e.key === "Delete" && focusedTagIndex !== null) {
          removeTag(focusedTagIndex);
          return;
        }

        // Escape to unfocus tag
        if (e.key === "Escape" && focusedTagIndex !== null) {
          setFocusedTagIndex(null);
          inputRef.current?.focus();
          return;
        }

        // Any other key unfocuses tag
        if (focusedTagIndex !== null && e.key.length === 1) {
          setFocusedTagIndex(null);
        }
      },
      [
        disabled,
        inputValue,
        value,
        focusedTagIndex,
        addTag,
        removeTag,
      ]
    );

    const handleContainerClick = React.useCallback(() => {
      if (!disabled) {
        inputRef.current?.focus();
        setFocusedTagIndex(null);
      }
    }, [disabled]);

    const handleTagClick = React.useCallback(
      (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (!disabled) {
          setFocusedTagIndex(index);
          inputRef.current?.focus();
        }
      },
      [disabled]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent) => {
        // Check if focus is still within the container
        if (!containerRef.current?.contains(e.relatedTarget)) {
          setFocusedTagIndex(null);
          // Optionally add any remaining input as a tag on blur
          if (inputValue.trim()) {
            if (addTag(inputValue)) {
              setInputValue("");
            }
          }
        }
      },
      [inputValue, addTag]
    );

    const displayError = validationError || error;
    const isAtMaxTags = maxTags !== undefined && value.length >= maxTags;

    const defaultTagRenderer = (
      tag: string,
      index: number,
      onRemove: () => void
    ) => (
      <span
        key={index}
        role="button"
        tabIndex={-1}
        onClick={(e) => handleTagClick(e, index)}
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          "bg-primary text-primary-foreground",
          "select-none cursor-pointer",
          tagSizes[size],
          focusedTagIndex === index &&
            "ring-2 ring-ring ring-offset-1 ring-offset-background",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="truncate max-w-[150px]">{tag}</span>
        {!disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "hover:bg-primary-foreground/20",
              "focus:outline-none focus:ring-1 focus:ring-primary-foreground/50",
              removeButtonSizes[size]
            )}
            aria-label={`Remove ${tag}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </span>
    );

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              displayError && "text-destructive"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          onBlur={handleBlur}
          className={cn(
            "flex flex-wrap items-center w-full rounded-md border border-input bg-background ring-offset-background",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            "cursor-text",
            containerSizes[size],
            disabled && "cursor-not-allowed opacity-50",
            displayError &&
              "border-destructive focus-within:ring-destructive"
          )}
        >
          {value.map((tag, index) =>
            renderTag
              ? renderTag(tag, index, () => removeTag(index))
              : defaultTagRenderer(tag, index, () => removeTag(index))
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled || isAtMaxTags}
            aria-invalid={displayError ? true : undefined}
            aria-describedby={displayError ? `${inputId}-error` : undefined}
            className={cn(
              "flex-1 min-w-[120px] bg-transparent outline-none",
              "placeholder:text-muted-foreground",
              "disabled:cursor-not-allowed",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base"
            )}
          />
        </div>
        {displayError && (
          <p
            id={`${inputId}-error`}
            className="text-sm font-medium text-destructive"
            role="alert"
          >
            {displayError}
          </p>
        )}
        {maxTags && (
          <p className="text-xs text-muted-foreground">
            {value.length} / {maxTags} tags
          </p>
        )}
      </div>
    );
  }
);
TagInput.displayName = "TagInput";

export { TagInput };
export type { TagInputProps };
