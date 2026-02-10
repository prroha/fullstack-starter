"use client";

import { useState } from "react";
import { Monitor, Smartphone, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentPreviewProps {
  children: React.ReactNode;
  className?: string;
}

type DeviceMode = "desktop" | "mobile";
type ThemeMode = "light" | "dark";

export function ComponentPreview({ children, className }: ComponentPreviewProps) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [theme, setTheme] = useState<ThemeMode>("light");

  return (
    <div className={cn("rounded-lg border overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/50">
        <span className="text-sm font-medium">Preview</span>
        <div className="flex items-center gap-1">
          {/* Device Toggle */}
          <div className="flex items-center border rounded-md p-0.5">
            <button
              onClick={() => setDevice("desktop")}
              className={cn(
                "p-1.5 rounded transition-colors",
                device === "desktop"
                  ? "bg-background shadow-sm"
                  : "hover:bg-accent"
              )}
              aria-label="Desktop view"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={cn(
                "p-1.5 rounded transition-colors",
                device === "mobile"
                  ? "bg-background shadow-sm"
                  : "hover:bg-accent"
              )}
              aria-label="Mobile view"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center border rounded-md p-0.5 ml-2">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "p-1.5 rounded transition-colors",
                theme === "light"
                  ? "bg-background shadow-sm"
                  : "hover:bg-accent"
              )}
              aria-label="Light theme"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "p-1.5 rounded transition-colors",
                theme === "dark"
                  ? "bg-background shadow-sm"
                  : "hover:bg-accent"
              )}
              aria-label="Dark theme"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div
        className={cn(
          "p-8 bg-background transition-all duration-300",
          device === "mobile" && "max-w-sm mx-auto",
          theme === "dark" && "dark bg-zinc-950"
        )}
      >
        <div className="flex items-center justify-center min-h-[200px]">
          {children}
        </div>
      </div>
    </div>
  );
}
