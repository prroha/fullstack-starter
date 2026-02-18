"use client";

import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LivePreviewStatusType = "idle" | "provisioning" | "ready" | "error";

interface LivePreviewStatusProps {
  status: LivePreviewStatusType;
  error?: string | null;
  className?: string;
}

export function LivePreviewStatus({
  status,
  error,
  className,
}: LivePreviewStatusProps) {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm px-3 py-1.5 rounded-md",
        status === "provisioning" && "bg-muted text-muted-foreground",
        status === "ready" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        status === "error" && "bg-destructive/10 text-destructive",
        className
      )}
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {status === "provisioning" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Setting up live preview...</span>
        </>
      )}
      {status === "ready" && (
        <>
          <CheckCircle className="h-4 w-4" />
          <span>Live preview active</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>{error || "Failed to launch preview"}</span>
        </>
      )}
    </div>
  );
}
