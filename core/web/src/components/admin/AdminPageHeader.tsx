"use client";

import { Text, ExportCsvButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface AdminPageHeaderProps {
  title: React.ReactNode;
  description?: string;
  /** Export configuration - if provided, shows export button */
  exportConfig?: {
    label: string;
    onExport: () => Promise<void>;
    successMessage?: string;
  };
  /** Optional action buttons to render on the right */
  actions?: React.ReactNode;
  /** Optional className for the container */
  className?: string;
}

/**
 * Shared header component for admin pages.
 * Includes title, description, optional export button, and action buttons.
 */
export function AdminPageHeader({
  title,
  description,
  exportConfig,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-bold md:text-3xl tracking-tight">{title}</h1>
        {description && <Text color="muted">{description}</Text>}
      </div>
      <div className="flex gap-2">
        {exportConfig && (
          <ExportCsvButton
            label={exportConfig.label}
            onExport={exportConfig.onExport}
            onSuccess={() =>
              toast.success(exportConfig.successMessage || "Export successful")
            }
            onError={(error) => toast.error(error.message || "Export failed")}
          />
        )}
        {actions}
      </div>
    </div>
  );
}

export default AdminPageHeader;
