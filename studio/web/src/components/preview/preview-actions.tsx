"use client";

import { Play, Square, RotateCw, ExternalLink } from "lucide-react";
import { Button, Tooltip } from "@/components/ui";
import type { LivePreviewStatusType } from "./live-preview-status";

interface PreviewActionsProps {
  status: LivePreviewStatusType;
  previewUrl: string | null;
  onLaunch: () => void;
  onStop: () => void;
  onRestart: () => void;
}

export function PreviewActions({
  status,
  previewUrl,
  onLaunch,
  onStop,
  onRestart,
}: PreviewActionsProps) {
  if (status === "idle") {
    return (
      <Button variant="outline" size="sm" onClick={onLaunch} className="min-h-[44px]">
        <Play className="mr-2 h-4 w-4" />
        Launch Live Preview
      </Button>
    );
  }

  if (status === "provisioning") {
    return (
      <Button variant="outline" size="sm" disabled isLoading className="min-h-[44px]">
        Launching...
      </Button>
    );
  }

  if (status === "error") {
    return (
      <Button variant="outline" size="sm" onClick={onLaunch} className="min-h-[44px]">
        <RotateCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip content="Restart Preview">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRestart}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Restart Preview"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Stop Preview">
        <Button
          variant="ghost"
          size="icon"
          onClick={onStop}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Stop Preview"
        >
          <Square className="h-4 w-4" />
        </Button>
      </Tooltip>
      {previewUrl && (
        <Tooltip content="Open in New Tab">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
            className="min-h-[44px] min-w-[44px]"
            aria-label="Open Preview in New Tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
