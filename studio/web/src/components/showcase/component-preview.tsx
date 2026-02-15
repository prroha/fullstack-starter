"use client";

import { useState, useId } from "react";
import { Monitor, Smartphone, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentPreviewProps {
  children: React.ReactNode;
  className?: string;
  /** Optional label for the preview */
  label?: string;
}

type DeviceMode = "desktop" | "mobile";
type ThemeMode = "light" | "dark";

interface ToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function ToggleButton({ isActive, onClick, icon, label }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-1.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        isActive ? "bg-background shadow-sm" : "hover:bg-accent"
      )}
      aria-label={label}
      aria-pressed={isActive}
    >
      {icon}
    </button>
  );
}

export function ComponentPreview({ children, className, label }: ComponentPreviewProps) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const previewId = useId();

  return (
    <div
      className={cn("rounded-lg border", className)}
      role="region"
      aria-labelledby={`${previewId}-label`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/50 rounded-t-lg">
        <span id={`${previewId}-label`} className="text-sm font-medium">
          {label ?? "Preview"}
        </span>
        <div className="flex items-center gap-1">
          {/* Device Toggle */}
          <div
            className="flex items-center border rounded-md p-0.5"
            role="group"
            aria-label="Device view selector"
          >
            <ToggleButton
              isActive={device === "desktop"}
              onClick={() => setDevice("desktop")}
              icon={<Monitor className="h-4 w-4" aria-hidden="true" />}
              label="Desktop view"
            />
            <ToggleButton
              isActive={device === "mobile"}
              onClick={() => setDevice("mobile")}
              icon={<Smartphone className="h-4 w-4" aria-hidden="true" />}
              label="Mobile view"
            />
          </div>

          {/* Theme Toggle */}
          <div
            className="flex items-center border rounded-md p-0.5 ml-2"
            role="group"
            aria-label="Preview theme selector"
          >
            <ToggleButton
              isActive={theme === "light"}
              onClick={() => setTheme("light")}
              icon={<Sun className="h-4 w-4" aria-hidden="true" />}
              label="Light theme preview"
            />
            <ToggleButton
              isActive={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon={<Moon className="h-4 w-4" aria-hidden="true" />}
              label="Dark theme preview"
            />
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div
        className={cn(
          "p-8 transition-all duration-300 bg-background text-foreground",
          device === "mobile" && "max-w-sm mx-auto"
        )}
        data-theme={theme}
      >
        <div className="flex items-center justify-center min-h-[200px]">
          {children}
        </div>
      </div>
    </div>
  );
}
