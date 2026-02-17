"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordRequirement {
  label: string;
  validator: (password: string, minLength: number) => boolean;
}

export interface PasswordStrengthMeterProps {
  /** The password to evaluate */
  password: string;
  /** Minimum length requirement (default: 8) */
  minLength?: number;
  /** Whether to show the requirements checklist (default: true) */
  showRequirements?: boolean;
  /** Callback when strength changes */
  onStrengthChange?: (strength: PasswordStrength) => void;
  /** Additional CSS classes */
  className?: string;
}

// =====================================================
// Constants
// =====================================================

const STRENGTH_CONFIG: Record<
  PasswordStrength,
  { color: string; bgColor: string; width: string; label: string }
> = {
  weak: {
    color: "bg-destructive",
    bgColor: "bg-destructive/10",
    width: "w-1/4",
    label: "Weak",
  },
  fair: {
    color: "bg-warning",
    bgColor: "bg-warning/10",
    width: "w-2/4",
    label: "Fair",
  },
  good: {
    color: "bg-warning",
    bgColor: "bg-warning/10",
    width: "w-3/4",
    label: "Good",
  },
  strong: {
    color: "bg-success",
    bgColor: "bg-success/10",
    width: "w-full",
    label: "Strong",
  },
};

const DEFAULT_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: "Minimum 8 characters",
    validator: (password, minLength) => password.length >= minLength,
  },
  {
    label: "Contains uppercase letter",
    validator: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Contains lowercase letter",
    validator: (password) => /[a-z]/.test(password),
  },
  {
    label: "Contains number",
    validator: (password) => /[0-9]/.test(password),
  },
  {
    label: "Contains special character",
    validator: (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  },
];

// =====================================================
// Helper Functions
// =====================================================

function calculateStrength(
  password: string,
  minLength: number,
  requirements: PasswordRequirement[]
): PasswordStrength {
  if (!password) return "weak";

  const passedRequirements = requirements.filter((req) =>
    req.validator(password, minLength)
  ).length;

  const ratio = passedRequirements / requirements.length;

  if (ratio <= 0.25) return "weak";
  if (ratio <= 0.5) return "fair";
  if (ratio <= 0.75) return "good";
  return "strong";
}

// =====================================================
// Check Icon Component
// =====================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

// =====================================================
// Password Strength Meter Component
// =====================================================

const PasswordStrengthMeter = React.forwardRef<
  HTMLDivElement,
  PasswordStrengthMeterProps
>(
  (
    {
      password,
      minLength = 8,
      showRequirements = true,
      onStrengthChange,
      className,
    },
    ref
  ) => {
    const requirements = React.useMemo(() => {
      // Update the first requirement label dynamically based on minLength
      return DEFAULT_REQUIREMENTS.map((req, index) =>
        index === 0 ? { ...req, label: `Minimum ${minLength} characters` } : req
      );
    }, [minLength]);

    const strength = React.useMemo(
      () => calculateStrength(password, minLength, requirements),
      [password, minLength, requirements]
    );

    const config = STRENGTH_CONFIG[strength];

    // Notify parent of strength changes
    const previousStrength = React.useRef<PasswordStrength | null>(null);
    React.useEffect(() => {
      if (onStrengthChange && strength !== previousStrength.current) {
        previousStrength.current = strength;
        onStrengthChange(strength);
      }
    }, [strength, onStrengthChange]);

    const requirementResults = React.useMemo(
      () =>
        requirements.map((req) => ({
          ...req,
          passed: req.validator(password, minLength),
        })),
      [password, minLength, requirements]
    );

    return (
      <div ref={ref} className={cn("space-y-3", className)}>
        {/* Strength Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Password strength</span>
            <span
              className={cn(
                "font-medium ",
                strength === "weak" && "text-destructive",
                strength === "fair" && "text-warning",
                strength === "good" && "text-warning",
                strength === "strong" && "text-success"
              )}
            >
              {password ? config.label : ""}
            </span>
          </div>
          <div
            className={cn(
              "h-2 w-full rounded-full ",
              password ? config.bgColor : "bg-muted"
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                config.color,
                password ? config.width : "w-0"
              )}
            />
          </div>
        </div>

        {/* Requirements Checklist */}
        {showRequirements && (
          <ul className="space-y-1.5 text-sm">
            {requirementResults.map((req, index) => (
              <li
                key={index}
                className={cn(
                  "flex items-center gap-2 ",
                  req.passed
                    ? "text-success"
                    : "text-muted-foreground"
                )}
              >
                {req.passed ? (
                  <CheckIcon className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <XIcon className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{req.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

PasswordStrengthMeter.displayName = "PasswordStrengthMeter";

export { PasswordStrengthMeter };
