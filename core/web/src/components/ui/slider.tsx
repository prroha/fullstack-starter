"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Slider Component
// =====================================================

export type SliderSize = "sm" | "md" | "lg";
export type SliderColor = "primary" | "secondary" | "success" | "warning" | "destructive";
export type SliderOrientation = "horizontal" | "vertical";

export interface SliderMark {
  value: number;
  label?: string;
}

export interface SliderProps {
  /** Current value (single slider) */
  value?: number;
  /** Current values (range slider) */
  values?: [number, number];
  /** Default value for uncontrolled single slider */
  defaultValue?: number;
  /** Default values for uncontrolled range slider */
  defaultValues?: [number, number];
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether to enable range mode (two handles) */
  range?: boolean;
  /** Marks/ticks to display */
  marks?: SliderMark[];
  /** Whether to show all marks automatically based on step */
  showAllMarks?: boolean;
  /** Value label display mode */
  valueLabelDisplay?: "off" | "on" | "auto";
  /** Custom value label formatter */
  valueLabelFormat?: (value: number) => string;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: SliderSize;
  /** Color variant */
  color?: SliderColor;
  /** Orientation */
  orientation?: SliderOrientation;
  /** Callback for single value change */
  onChange?: (value: number) => void;
  /** Callback for range value change */
  onRangeChange?: (values: [number, number]) => void;
  /** Callback when dragging starts */
  onChangeStart?: () => void;
  /** Callback when dragging ends */
  onChangeEnd?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  "aria-label"?: string;
  /** Accessible label for range sliders - first handle */
  "aria-label-start"?: string;
  /** Accessible label for range sliders - second handle */
  "aria-label-end"?: string;
  /** ID for the slider */
  id?: string;
  /** Name for form submission */
  name?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value: controlledValue,
      values: controlledValues,
      defaultValue = 0,
      defaultValues = [25, 75],
      min = 0,
      max = 100,
      step = 1,
      range = false,
      marks,
      showAllMarks = false,
      valueLabelDisplay = "auto",
      valueLabelFormat = (v) => String(v),
      disabled = false,
      size = "md",
      color = "primary",
      orientation = "horizontal",
      onChange,
      onRangeChange,
      onChangeStart,
      onChangeEnd,
      className,
      "aria-label": ariaLabel,
      "aria-label-start": ariaLabelStart,
      "aria-label-end": ariaLabelEnd,
      id,
      name,
    },
    ref
  ) => {
    const isHorizontal = orientation === "horizontal";
    const trackRef = React.useRef<HTMLDivElement>(null);

    // Internal state for uncontrolled mode
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [internalValues, setInternalValues] = React.useState<[number, number]>(defaultValues);
    const [isDragging, setIsDragging] = React.useState(false);
    const [activeHandle, setActiveHandle] = React.useState<"start" | "end" | null>(null);
    const [showTooltip, setShowTooltip] = React.useState(false);

    // Determine if controlled
    const isControlled = range
      ? controlledValues !== undefined
      : controlledValue !== undefined;

    const currentValue = isControlled ? controlledValue ?? internalValue : internalValue;
    const currentValues = isControlled
      ? controlledValues ?? internalValues
      : internalValues;

    // Size configurations
    const trackSizes = {
      sm: isHorizontal ? "h-1" : "w-1",
      md: isHorizontal ? "h-2" : "w-2",
      lg: isHorizontal ? "h-3" : "w-3",
    };

    const thumbSizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    const containerSizes = {
      sm: isHorizontal ? "h-4 py-1.5" : "w-4 px-1.5",
      md: isHorizontal ? "h-5 py-1.5" : "w-5 px-1.5",
      lg: isHorizontal ? "h-6 py-1.5" : "w-6 px-1.5",
    };

    // Color configurations
    const trackColors = {
      primary: "bg-primary",
      secondary: "bg-secondary",
      success: "bg-green-500 dark:bg-green-400",
      warning: "bg-yellow-500 dark:bg-yellow-400",
      destructive: "bg-destructive",
    };

    const thumbColors = {
      primary: "border-primary bg-background",
      secondary: "border-secondary bg-background",
      success: "border-green-500 dark:border-green-400 bg-background",
      warning: "border-yellow-500 dark:border-yellow-400 bg-background",
      destructive: "border-destructive bg-background",
    };

    // Calculate percentage from value
    const valueToPercent = (val: number) => {
      return ((val - min) / (max - min)) * 100;
    };

    // Calculate value from percentage
    const percentToValue = (percent: number) => {
      const rawValue = (percent / 100) * (max - min) + min;
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    };

    // Get position from mouse/touch event
    const getPositionFromEvent = (event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
      if (!trackRef.current) return 0;

      const rect = trackRef.current.getBoundingClientRect();
      const clientPosition = "touches" in event
        ? event.touches[0]
        : event;

      if (isHorizontal) {
        const position = clientPosition.clientX - rect.left;
        return (position / rect.width) * 100;
      } else {
        const position = rect.bottom - clientPosition.clientY;
        return (position / rect.height) * 100;
      }
    };

    // Handle value change
    const handleValueChange = (percent: number, handle?: "start" | "end") => {
      const newValue = percentToValue(percent);

      if (range) {
        const newValues = [...currentValues] as [number, number];
        const targetHandle = handle ?? activeHandle ?? "start";

        if (targetHandle === "start") {
          newValues[0] = Math.min(newValue, newValues[1]);
        } else {
          newValues[1] = Math.max(newValue, newValues[0]);
        }

        if (!isControlled) {
          setInternalValues(newValues);
        }
        onRangeChange?.(newValues);
      } else {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      }
    };

    // Mouse/touch event handlers
    const handleMouseDown = (event: React.MouseEvent | React.TouchEvent, handle?: "start" | "end") => {
      if (disabled) return;

      event.preventDefault();
      setIsDragging(true);
      setShowTooltip(true);
      onChangeStart?.();

      if (range && handle) {
        setActiveHandle(handle);
      } else if (range) {
        // Click on track - determine closest handle
        const percent = getPositionFromEvent(event);
        const startDist = Math.abs(valueToPercent(currentValues[0]) - percent);
        const endDist = Math.abs(valueToPercent(currentValues[1]) - percent);
        setActiveHandle(startDist <= endDist ? "start" : "end");
      }

      handleValueChange(getPositionFromEvent(event), handle);
    };

    // Global mouse move handler
    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (event: MouseEvent | TouchEvent) => {
        handleValueChange(getPositionFromEvent(event));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setShowTooltip(false);
        setActiveHandle(null);
        onChangeEnd?.();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove);
      document.addEventListener("touchend", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleMouseMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, activeHandle, currentValues]);

    // Keyboard handler
    const handleKeyDown = (event: React.KeyboardEvent, handle?: "start" | "end") => {
      if (disabled) return;

      let delta = 0;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          delta = step;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          delta = -step;
          break;
        case "PageUp":
          delta = step * 10;
          break;
        case "PageDown":
          delta = -step * 10;
          break;
        case "Home":
          if (range && handle) {
            const newValues = [...currentValues] as [number, number];
            if (handle === "start") {
              newValues[0] = min;
            } else {
              newValues[1] = currentValues[0];
            }
            if (!isControlled) setInternalValues(newValues);
            onRangeChange?.(newValues);
          } else {
            if (!isControlled) setInternalValue(min);
            onChange?.(min);
          }
          event.preventDefault();
          return;
        case "End":
          if (range && handle) {
            const newValues = [...currentValues] as [number, number];
            if (handle === "start") {
              newValues[0] = currentValues[1];
            } else {
              newValues[1] = max;
            }
            if (!isControlled) setInternalValues(newValues);
            onRangeChange?.(newValues);
          } else {
            if (!isControlled) setInternalValue(max);
            onChange?.(max);
          }
          event.preventDefault();
          return;
        default:
          return;
      }

      event.preventDefault();

      if (range && handle) {
        const newValues = [...currentValues] as [number, number];
        if (handle === "start") {
          newValues[0] = Math.max(min, Math.min(newValues[0] + delta, newValues[1]));
        } else {
          newValues[1] = Math.max(newValues[0], Math.min(newValues[1] + delta, max));
        }
        if (!isControlled) setInternalValues(newValues);
        onRangeChange?.(newValues);
      } else {
        const newValue = Math.max(min, Math.min(currentValue + delta, max));
        if (!isControlled) setInternalValue(newValue);
        onChange?.(newValue);
      }
    };

    // Generate marks if showAllMarks is true
    const displayMarks = React.useMemo(() => {
      if (marks) return marks;
      if (!showAllMarks) return [];

      const generatedMarks: SliderMark[] = [];
      for (let val = min; val <= max; val += step) {
        generatedMarks.push({ value: val });
      }
      return generatedMarks;
    }, [marks, showAllMarks, min, max, step]);

    // Render thumb
    const renderThumb = (percent: number, handle?: "start" | "end") => {
      const value = range
        ? (handle === "start" ? currentValues[0] : currentValues[1])
        : currentValue;

      const shouldShowLabel =
        valueLabelDisplay === "on" ||
        (valueLabelDisplay === "auto" && (showTooltip && (activeHandle === handle || (!range && isDragging))));

      const positionStyle = isHorizontal
        ? { left: `${percent}%` }
        : { bottom: `${percent}%` };

      return (
        <div
          key={handle}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={range
            ? (handle === "start" ? ariaLabelStart : ariaLabelEnd)
            : ariaLabel}
          aria-disabled={disabled}
          aria-orientation={orientation}
          className={cn(
            "absolute rounded-full border-2 transition-shadow",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            thumbSizes[size],
            thumbColors[color],
            disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
            isHorizontal ? "-translate-x-1/2 -translate-y-1/2 top-1/2" : "-translate-x-1/2 translate-y-1/2 left-1/2"
          )}
          style={positionStyle}
          onMouseDown={(e) => handleMouseDown(e, handle)}
          onTouchStart={(e) => handleMouseDown(e, handle)}
          onKeyDown={(e) => handleKeyDown(e, handle)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
        >
          {/* Value label tooltip */}
          {shouldShowLabel && (
            <div
              className={cn(
                "absolute whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background",
                isHorizontal
                  ? "-top-8 left-1/2 -translate-x-1/2"
                  : "left-full ml-2 top-1/2 -translate-y-1/2"
              )}
            >
              {valueLabelFormat(value)}
              {isHorizontal && (
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground" />
              )}
            </div>
          )}
        </div>
      );
    };

    const singlePercent = valueToPercent(currentValue);
    const startPercent = valueToPercent(currentValues[0]);
    const endPercent = valueToPercent(currentValues[1]);

    return (
      <div
        ref={ref}
        id={id}
        className={cn(
          "relative",
          isHorizontal ? "w-full" : "h-full min-h-[200px]",
          containerSizes[size],
          disabled && "opacity-50",
          className
        )}
      >
        {/* Hidden input for form submission */}
        {name && (
          <input
            type="hidden"
            name={name}
            value={range ? currentValues.join(",") : currentValue}
          />
        )}

        {/* Track */}
        <div
          ref={trackRef}
          className={cn(
            "absolute rounded-full bg-muted",
            trackSizes[size],
            isHorizontal
              ? "left-0 right-0 top-1/2 -translate-y-1/2"
              : "top-0 bottom-0 left-1/2 -translate-x-1/2",
            !disabled && "cursor-pointer"
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Filled track */}
          <div
            className={cn(
              "absolute rounded-full",
              trackColors[color],
              trackSizes[size]
            )}
            style={
              isHorizontal
                ? range
                  ? { left: `${startPercent}%`, right: `${100 - endPercent}%` }
                  : { left: 0, right: `${100 - singlePercent}%` }
                : range
                  ? { bottom: `${startPercent}%`, top: `${100 - endPercent}%` }
                  : { bottom: 0, top: `${100 - singlePercent}%` }
            }
          />
        </div>

        {/* Marks */}
        {displayMarks.length > 0 && (
          <div className={cn(
            "absolute",
            isHorizontal
              ? "left-0 right-0 top-full mt-1"
              : "top-0 bottom-0 left-full ml-2"
          )}>
            {displayMarks.map((mark) => {
              const percent = valueToPercent(mark.value);
              const isActive = range
                ? mark.value >= currentValues[0] && mark.value <= currentValues[1]
                : mark.value <= currentValue;

              return (
                <div
                  key={mark.value}
                  className={cn(
                    "absolute text-xs",
                    isHorizontal
                      ? "-translate-x-1/2"
                      : "translate-y-1/2"
                  )}
                  style={isHorizontal
                    ? { left: `${percent}%` }
                    : { bottom: `${percent}%` }
                  }
                >
                  <div
                    className={cn(
                      "rounded-full",
                      size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5",
                      isActive ? trackColors[color] : "bg-muted-foreground/50"
                    )}
                  />
                  {mark.label && (
                    <span className={cn(
                      "mt-1 block text-muted-foreground",
                      isHorizontal ? "text-center" : "ml-2"
                    )}>
                      {mark.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Thumb(s) */}
        {range ? (
          <>
            {renderThumb(startPercent, "start")}
            {renderThumb(endPercent, "end")}
          </>
        ) : (
          renderThumb(singlePercent)
        )}
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
