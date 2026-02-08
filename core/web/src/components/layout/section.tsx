import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Section Component
// =====================================================

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
}

function Section({
  className,
  children,
  title,
  description,
  action,
  padding = "md",
  bordered = false,
  ...props
}: SectionProps) {
  // Content-first spacing: tighter vertical padding
  const paddings = {
    none: "",
    sm: "py-3",  // 12px (was 16px)
    md: "py-6",  // 24px (was 32px)
    lg: "py-8",  // 32px (was 48px)
  };

  return (
    <section
      className={cn(
        paddings[padding],
        bordered && "border-b border-border",
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="space-y-0.5">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// =====================================================
// Section Header Component (standalone)
// =====================================================

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function SectionHeader({
  className,
  title,
  description,
  action,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        // Content-first spacing: tighter gap and margin
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4",
        className
      )}
      {...props}
    >
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// =====================================================
// Card Section Component (section inside a card)
// =====================================================

interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

function CardSection({
  className,
  children,
  title,
  description,
  action,
  ...props
}: CardSectionProps) {
  return (
    <div
      className={cn(
        // Content-first spacing: tighter padding (was p-6)
        "rounded-lg border border-border bg-card p-4",
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div className="space-y-0.5">
            {title && (
              <h3 className="text-lg font-semibold text-card-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// =====================================================
// Empty Section Component (for empty states)
// =====================================================

interface EmptySectionProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptySection({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptySectionProps) {
  return (
    <div
      className={cn(
        // Content-first spacing: tighter vertical padding (was py-12)
        "flex flex-col items-center justify-center py-8 px-3 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-3 text-muted-foreground">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-0.5 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { Section, SectionHeader, CardSection, EmptySection };
export type {
  SectionProps,
  SectionHeaderProps,
  CardSectionProps,
  EmptySectionProps,
};
