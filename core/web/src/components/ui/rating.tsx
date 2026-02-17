"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Rating Component
// =====================================================

export type RatingSize = "sm" | "md" | "lg";

export interface RatingProps {
  /** Current rating value */
  value?: number;
  /** Default value for uncontrolled mode */
  defaultValue?: number;
  /** Maximum rating value */
  max?: number;
  /** Whether half-star ratings are allowed */
  allowHalf?: boolean;
  /** Whether the rating is read-only */
  readOnly?: boolean;
  /** Whether the rating is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: RatingSize;
  /** Color for filled stars */
  filledColor?: string;
  /** Color for empty stars */
  emptyColor?: string;
  /** Custom filled icon element */
  filledIcon?: React.ReactNode;
  /** Custom empty icon element */
  emptyIcon?: React.ReactNode;
  /** Custom half-filled icon element */
  halfIcon?: React.ReactNode;
  /** Whether to show the numeric value text */
  showValue?: boolean;
  /** Custom value formatter */
  valueFormat?: (value: number, max: number) => string;
  /** Callback when rating changes */
  onChange?: (value: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  "aria-label"?: string;
  /** ID for the rating */
  id?: string;
  /** Name for form submission */
  name?: string;
}

// Default star icon (filled)
const _StarHalfIcon = ({ className, filledColor: _filledColor, emptyColor: _emptyColor }: { className?: string; filledColor?: string; emptyColor?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="half-star-gradient">
        <stop offset="50%" stopColor="currentColor" />
        <stop offset="50%" stopColor="transparent" />
      </linearGradient>
    </defs>
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="url(#half-star-gradient)"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);

const StarFilledIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Default star icon (empty)
const StarEmptyIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);


const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      max = 5,
      allowHalf = false,
      readOnly = false,
      disabled = false,
      size = "md",
      filledColor = "text-warning",
      emptyColor = "text-muted-foreground/30",
      filledIcon,
      emptyIcon,
      halfIcon,
      showValue = false,
      valueFormat = (v, m) => `${v}/${m}`,
      onChange,
      className,
      "aria-label": ariaLabel = "Rating",
      id,
      name,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;
    const displayValue = hoverValue !== null ? hoverValue : currentValue;

    // Size configurations
    const sizes = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    };

    const gapSizes = {
      sm: "gap-0.5",
      md: "gap-1",
      lg: "gap-1.5",
    };

    const textSizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    const isInteractive = !readOnly && !disabled;

    // Handle click on a star
    const handleClick = (starIndex: number, isHalf: boolean = false) => {
      if (!isInteractive) return;

      const newValue = isHalf && allowHalf ? starIndex + 0.5 : starIndex + 1;

      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    // Handle mouse move for half-star detection
    const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
      if (!isInteractive) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const isLeftHalf = x < rect.width / 2;

      if (allowHalf && isLeftHalf) {
        setHoverValue(starIndex + 0.5);
      } else {
        setHoverValue(starIndex + 1);
      }
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
      setHoverValue(null);
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!isInteractive) return;

      const step = allowHalf ? 0.5 : 1;
      let newValue = currentValue;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          newValue = Math.min(currentValue + step, max);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          newValue = Math.max(currentValue - step, 0);
          break;
        case "Home":
          newValue = 0;
          break;
        case "End":
          newValue = max;
          break;
        default:
          return;
      }

      event.preventDefault();

      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    // Render a single star
    const renderStar = (index: number) => {
      const starValue = index + 1;
      const isFilled = displayValue >= starValue;
      const isHalfFilled = allowHalf && !isFilled && displayValue >= starValue - 0.5;

      const iconClass = cn(sizes[size], "transition-transform", isInteractive && "hover:scale-110");

      let starElement: React.ReactNode;

      if (isFilled) {
        starElement = filledIcon ? (
          <span className={cn(iconClass, filledColor)}>{filledIcon}</span>
        ) : (
          <StarFilledIcon className={cn(iconClass, filledColor)} />
        );
      } else if (isHalfFilled) {
        starElement = halfIcon ? (
          <span className={cn(iconClass, filledColor)}>{halfIcon}</span>
        ) : (
          <span className={cn("relative", iconClass)}>
            {/* Empty star as background */}
            {emptyIcon ? (
              <span className={cn("absolute inset-0", emptyColor)}>{emptyIcon}</span>
            ) : (
              <StarEmptyIcon className={cn("absolute inset-0", emptyColor)} />
            )}
            {/* Half-filled overlay */}
            <svg
              className={cn("relative", filledColor)}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              style={{ clipPath: "inset(0 50% 0 0)" }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
        );
      } else {
        starElement = emptyIcon ? (
          <span className={cn(iconClass, emptyColor)}>{emptyIcon}</span>
        ) : (
          <StarEmptyIcon className={cn(iconClass, emptyColor)} />
        );
      }

      if (isInteractive) {
        return (
          <button
            key={index}
            type="button"
            className={cn(
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded",
              "cursor-pointer"
            )}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const isLeftHalf = x < rect.width / 2;
              handleClick(index, allowHalf && isLeftHalf);
            }}
            onMouseMove={(e) => handleMouseMove(e, index)}
            aria-label={`Rate ${allowHalf && hoverValue === index + 0.5 ? index + 0.5 : starValue} out of ${max}`}
          >
            {starElement}
          </button>
        );
      }

      return <span key={index}>{starElement}</span>;
    };

    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "inline-flex items-center",
          gapSizes[size],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        role="slider"
        aria-valuenow={currentValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        aria-readonly={readOnly}
        tabIndex={isInteractive ? 0 : -1}
        onKeyDown={handleKeyDown}
        onMouseLeave={handleMouseLeave}
      >
        {/* Hidden input for form submission */}
        {name && (
          <input type="hidden" name={name} value={currentValue} />
        )}

        {/* Stars */}
        {Array.from({ length: max }, (_, index) => renderStar(index))}

        {/* Value text */}
        {showValue && (
          <span className={cn(
            "ml-2 text-muted-foreground",
            textSizes[size]
          )}>
            {valueFormat(currentValue, max)}
          </span>
        )}
      </div>
    );
  }
);

Rating.displayName = "Rating";

export { Rating };
