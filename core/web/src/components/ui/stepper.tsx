"use client";

import * as React from "react";
import { icons } from "lucide-react";
import { cn } from "@/lib/utils";

// =====================================================
// Stepper Component - Types
// =====================================================

export type StepState = "pending" | "active" | "completed" | "error";
export type StepperOrientation = "horizontal" | "vertical";
export type IconName = keyof typeof icons;

export interface Step {
  /** Unique identifier for the step */
  id: string;
  /** Step label/title */
  label: string;
  /** Optional description text */
  description?: string;
  /** Optional custom icon (Lucide icon name) */
  icon?: IconName;
  /** Whether this step is disabled */
  disabled?: boolean;
  /** Optional custom state override */
  state?: StepState;
}

export interface StepperContextValue {
  activeStep: number;
  orientation: StepperOrientation;
  isLinear: boolean;
  clickable: boolean;
  steps: Step[];
  onStepClick: (index: number) => void;
  getStepState: (index: number) => StepState;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);

function useStepperContext() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("Stepper components must be used within a Stepper component");
  }
  return context;
}

// =====================================================
// Stepper Props
// =====================================================

export interface StepperProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Array of step configurations */
  steps: Step[];
  /** Current active step index (0-based) */
  activeStep?: number;
  /** Callback when step is clicked */
  onStepChange?: (index: number) => void;
  /** Stepper orientation */
  orientation?: StepperOrientation;
  /** Whether navigation is linear (can only go to next step) */
  isLinear?: boolean;
  /** Whether steps are clickable */
  clickable?: boolean;
  /** Completed steps override (array of indices) */
  completedSteps?: number[];
  /** Error steps (array of indices) */
  errorSteps?: number[];
}

// =====================================================
// Step Indicator Component
// =====================================================

interface StepIndicatorProps {
  index: number;
  step: Step;
  state: StepState;
  orientation: StepperOrientation;
}

function StepIndicator({ index, step, state, orientation }: StepIndicatorProps) {
  const iconSize = orientation === "horizontal" ? 20 : 18;

  const stateStyles: Record<StepState, string> = {
    pending: "border-muted-foreground bg-background text-muted-foreground",
    active: "border-primary bg-primary text-primary-foreground",
    completed: "border-primary bg-primary text-primary-foreground",
    error: "border-destructive bg-destructive text-destructive-foreground",
  };

  const renderIcon = () => {
    if (state === "completed") {
      const CheckIcon = icons.Check;
      return <CheckIcon size={iconSize} aria-hidden="true" />;
    }

    if (state === "error") {
      const XIcon = icons.X;
      return <XIcon size={iconSize} aria-hidden="true" />;
    }

    if (step.icon) {
      const CustomIcon = icons[step.icon];
      if (CustomIcon) {
        return <CustomIcon size={iconSize} aria-hidden="true" />;
      }
    }

    return <span className="text-sm font-medium">{index + 1}</span>;
  };

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
        stateStyles[state],
        orientation === "vertical" && "h-7 w-7"
      )}
    >
      {renderIcon()}
    </div>
  );
}

// =====================================================
// Step Connector Component
// =====================================================

interface StepConnectorProps {
  index: number;
  isLast: boolean;
  orientation: StepperOrientation;
}

function StepConnector({ index, isLast, orientation }: StepConnectorProps) {
  const { getStepState } = useStepperContext();

  if (isLast) return null;

  const currentState = getStepState(index);
  const isCompleted = currentState === "completed";

  if (orientation === "horizontal") {
    return (
      <div
        className={cn(
          "mx-2 h-0.5 flex-1 transition-colors duration-200",
          isCompleted ? "bg-primary" : "bg-muted-foreground/30"
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        "ml-[14px] mt-1 mb-1 w-0.5 flex-1 min-h-[24px] transition-colors duration-200",
        isCompleted ? "bg-primary" : "bg-muted-foreground/30"
      )}
      aria-hidden="true"
    />
  );
}

// =====================================================
// Step Label Component
// =====================================================

interface StepLabelProps {
  step: Step;
  state: StepState;
  orientation: StepperOrientation;
}

function StepLabel({ step, state, orientation }: StepLabelProps) {
  const stateTextStyles: Record<StepState, string> = {
    pending: "text-muted-foreground",
    active: "text-foreground font-medium",
    completed: "text-foreground",
    error: "text-destructive",
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        orientation === "horizontal" ? "items-center text-center" : "items-start ml-3"
      )}
    >
      <span className={cn("text-sm transition-colors duration-200", stateTextStyles[state])}>
        {step.label}
      </span>
      {step.description && (
        <span
          className={cn(
            "text-xs text-muted-foreground mt-0.5",
            orientation === "horizontal" && "max-w-[120px]",
            state === "error" && "text-destructive/70"
          )}
        >
          {step.description}
        </span>
      )}
    </div>
  );
}

// =====================================================
// Step Item Component
// =====================================================

interface StepItemProps {
  step: Step;
  index: number;
  isLast: boolean;
}

function StepItem({ step, index, isLast }: StepItemProps) {
  const { orientation, clickable, isLinear, activeStep, onStepClick, getStepState } =
    useStepperContext();

  const state = getStepState(index);
  const isClickable =
    clickable && !step.disabled && (!isLinear || index <= activeStep + 1);

  const handleClick = () => {
    if (isClickable) {
      onStepClick(index);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isClickable && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onStepClick(index);
    }
  };

  if (orientation === "horizontal") {
    return (
      <>
        <div
          role="listitem"
          aria-current={state === "active" ? "step" : undefined}
          aria-disabled={step.disabled}
          tabIndex={isClickable ? 0 : undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex flex-col items-center",
            isClickable && "cursor-pointer",
            step.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <StepIndicator index={index} step={step} state={state} orientation={orientation} />
          <div className="mt-2">
            <StepLabel step={step} state={state} orientation={orientation} />
          </div>
        </div>
        <StepConnector index={index} isLast={isLast} orientation={orientation} />
      </>
    );
  }

  // Vertical layout
  return (
    <div role="listitem" className="flex flex-col">
      <div
        aria-current={state === "active" ? "step" : undefined}
        aria-disabled={step.disabled}
        tabIndex={isClickable ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-start",
          isClickable && "cursor-pointer",
          step.disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <StepIndicator index={index} step={step} state={state} orientation={orientation} />
        <StepLabel step={step} state={state} orientation={orientation} />
      </div>
      {!isLast && (
        <StepConnector index={index} isLast={isLast} orientation={orientation} />
      )}
    </div>
  );
}

// =====================================================
// Main Stepper Component
// =====================================================

/**
 * Stepper component for multi-step workflows.
 * Supports horizontal and vertical orientations, linear/non-linear navigation,
 * and customizable step states.
 *
 * @example
 * ```tsx
 * const steps = [
 *   { id: "1", label: "Account", description: "Create your account" },
 *   { id: "2", label: "Profile", description: "Set up your profile" },
 *   { id: "3", label: "Review", description: "Review and submit" },
 * ];
 *
 * // Basic usage
 * <Stepper steps={steps} activeStep={1} />
 *
 * // Vertical with clickable steps
 * <Stepper
 *   steps={steps}
 *   activeStep={0}
 *   orientation="vertical"
 *   clickable
 *   onStepChange={(index) => setActiveStep(index)}
 * />
 *
 * // Non-linear with custom icons
 * const stepsWithIcons = [
 *   { id: "1", label: "Cart", icon: "ShoppingCart" },
 *   { id: "2", label: "Shipping", icon: "Truck" },
 *   { id: "3", label: "Payment", icon: "CreditCard" },
 * ];
 * <Stepper steps={stepsWithIcons} activeStep={1} isLinear={false} clickable />
 *
 * // With error state
 * <Stepper steps={steps} activeStep={1} errorSteps={[1]} />
 * ```
 */
const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      steps,
      activeStep = 0,
      onStepChange,
      orientation = "horizontal",
      isLinear = true,
      clickable = false,
      completedSteps,
      errorSteps,
      className,
      ...props
    },
    ref
  ) => {
    const getStepState = React.useCallback(
      (index: number): StepState => {
        const step = steps[index];

        // Check for explicit state override on the step
        if (step?.state) {
          return step.state;
        }

        // Check for error state
        if (errorSteps?.includes(index)) {
          return "error";
        }

        // Check for explicit completed state
        if (completedSteps?.includes(index)) {
          return "completed";
        }

        // Default logic based on activeStep
        if (index < activeStep) {
          return "completed";
        }

        if (index === activeStep) {
          return "active";
        }

        return "pending";
      },
      [steps, activeStep, completedSteps, errorSteps]
    );

    const handleStepClick = React.useCallback(
      (index: number) => {
        const step = steps[index];
        if (step?.disabled) return;

        if (isLinear) {
          // In linear mode, can only go forward one step or back
          if (index <= activeStep + 1) {
            onStepChange?.(index);
          }
        } else {
          // In non-linear mode, can go to any non-disabled step
          onStepChange?.(index);
        }
      },
      [steps, activeStep, isLinear, onStepChange]
    );

    const contextValue: StepperContextValue = {
      activeStep,
      orientation,
      isLinear,
      clickable,
      steps,
      onStepClick: handleStepClick,
      getStepState,
    };

    return (
      <StepperContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="list"
          aria-label="Progress steps"
          className={cn(
            "w-full",
            orientation === "horizontal"
              ? "flex items-start justify-between"
              : "flex flex-col space-y-0",
            // Responsive: collapse to vertical on small screens for horizontal orientation
            orientation === "horizontal" && "md:flex-row flex-col md:items-start items-stretch",
            className
          )}
          {...props}
        >
          {steps.map((step, index) => (
            <StepItem
              key={step.id}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = "Stepper";

// =====================================================
// Compound Components for Custom Layouts
// =====================================================

export interface StepProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Step index (required for context) */
  index: number;
  /** Whether this step is disabled */
  disabled?: boolean;
  /** Custom content */
  children?: React.ReactNode;
}

/**
 * Individual Step component for custom stepper layouts.
 * Use when you need more control over step rendering.
 */
function StepComponent({ index, disabled, children, className, ...props }: StepProps) {
  const { orientation, clickable, isLinear, activeStep, onStepClick, getStepState, steps } =
    useStepperContext();

  const step = steps[index];
  const state = getStepState(index);
  const isClickable = clickable && !disabled && !step?.disabled && (!isLinear || index <= activeStep + 1);

  const handleClick = () => {
    if (isClickable) {
      onStepClick(index);
    }
  };

  return (
    <div
      role="listitem"
      aria-current={state === "active" ? "step" : undefined}
      aria-disabled={disabled || step?.disabled}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-col items-center" : "items-start",
        isClickable && "cursor-pointer",
        (disabled || step?.disabled) && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Stepper, StepComponent as Step, StepIndicator, StepLabel, StepConnector, useStepperContext };
