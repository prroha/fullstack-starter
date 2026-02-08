"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Settings Section Component
// =====================================================

interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Section content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A section container for grouping related settings.
 * Provides consistent styling with title, optional description, and bordered container.
 */
function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="rounded-lg border bg-card">{children}</div>
    </div>
  );
}

export { SettingsSection };
export type { SettingsSectionProps };
