"use client";

import { Monitor, Tablet, Smartphone, Sun, Moon, RotateCcw, ExternalLink } from "lucide-react";
import { Button, Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DeviceType, ThemeMode } from "@/lib/preview";

interface DeviceToolbarProps {
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onReset?: () => void;
  onOpenExternal?: () => void;
}

const deviceOptions: { value: DeviceType; icon: typeof Monitor; label: string }[] = [
  { value: "desktop", icon: Monitor, label: "Desktop" },
  { value: "tablet", icon: Tablet, label: "Tablet" },
  { value: "mobile", icon: Smartphone, label: "Mobile" },
];

const themeOptions: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
];

export function DeviceToolbar({
  device,
  onDeviceChange,
  theme,
  onThemeChange,
  onReset,
  onOpenExternal,
}: DeviceToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-3 sm:px-4 py-2">
      {/* Left: Device Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden sm:inline text-sm font-medium text-muted-foreground">Device:</span>
        <div className="flex items-center border rounded-lg p-0.5">
          {deviceOptions.map((option) => {
            const Icon = option.icon;
            const isActive = device === option.value;

            return (
              <Tooltip key={option.value} content={option.label}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeviceChange(option.value)}
                  className={cn(
                    "min-h-[40px] min-w-[40px]",
                    isActive
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground"
                  )}
                  aria-label={option.label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Center: Theme Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden sm:inline text-sm font-medium text-muted-foreground">Theme:</span>
        <div className="flex items-center border rounded-lg p-0.5">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;

            return (
              <Tooltip key={option.value} content={option.label}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onThemeChange(option.value)}
                  className={cn(
                    "min-h-[40px] min-w-[40px]",
                    isActive
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground"
                  )}
                  aria-label={option.label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {onReset && (
          <Tooltip content="Reset Preview">
            <Button variant="ghost" size="sm" onClick={onReset} className="min-h-[44px] min-w-[44px] p-0 flex items-center justify-center">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </Tooltip>
        )}
        {onOpenExternal && (
          <Tooltip content="Open in New Tab">
            <Button variant="ghost" size="sm" onClick={onOpenExternal} className="min-h-[44px] min-w-[44px] p-0 flex items-center justify-center">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
