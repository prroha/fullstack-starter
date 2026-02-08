"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

// =====================================================
// Theme Toggle Types
// =====================================================

type ThemeToggleVariant = "icon" | "button" | "dropdown";
type ThemeToggleSize = "sm" | "md" | "lg";

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
  size?: ThemeToggleSize;
  showLabel?: boolean;
  className?: string;
}

// =====================================================
// Size Configurations
// =====================================================

const sizeConfig: Record<ThemeToggleSize, { icon: number; button: string }> = {
  sm: { icon: 16, button: "h-8 w-8" },
  md: { icon: 20, button: "h-10 w-10" },
  lg: { icon: 24, button: "h-12 w-12" },
};

// =====================================================
// Sun Icon Component
// =====================================================

function SunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-300"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

// =====================================================
// Moon Icon Component
// =====================================================

function MoonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-300"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

// =====================================================
// Monitor Icon Component (for system theme)
// =====================================================

function MonitorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

// =====================================================
// Theme Toggle Component
// =====================================================

function ThemeToggle({
  variant = "icon",
  size = "md",
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const config = sizeConfig[size];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get current icon based on theme
  const CurrentIcon =
    theme === "system"
      ? MonitorIcon
      : resolvedTheme === "dark"
        ? MoonIcon
        : SunIcon;

  // Get theme label
  const themeLabel =
    theme === "system"
      ? "System"
      : resolvedTheme === "dark"
        ? "Dark"
        : "Light";

  // Simple icon toggle (light/dark only)
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-accent focus-visible:bg-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-colors duration-200",
          config.button,
          className
        )}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      >
        <span className="sr-only">
          {resolvedTheme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"}
        </span>
        {/* Sun icon - visible in dark mode */}
        <SunIcon size={config.icon} />
        {/* Overlay moon icon - visible in light mode */}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-opacity duration-300",
            resolvedTheme === "dark" ? "opacity-0" : "opacity-100"
          )}
        >
          <MoonIcon size={config.icon} />
        </span>
        {/* Sun visible in dark mode */}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-opacity duration-300",
            resolvedTheme === "dark" ? "opacity-100" : "opacity-0"
          )}
        >
          <SunIcon size={config.icon} />
        </span>
      </button>
    );
  }

  // Button with optional label
  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md",
          "text-sm font-medium",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-accent focus-visible:bg-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-colors duration-200",
          showLabel ? "px-3 py-2" : config.button,
          className
        )}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      >
        <CurrentIcon size={config.icon} />
        {showLabel && <span>{themeLabel}</span>}
      </button>
    );
  }

  // Dropdown with all theme options
  if (variant === "dropdown") {
    return (
      <div className={cn("relative", className)} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md",
            "text-sm font-medium",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-accent focus-visible:bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-colors duration-200",
            showLabel ? "px-3 py-2" : config.button
          )}
          aria-label="Select theme"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <CurrentIcon size={config.icon} />
          {showLabel && <span>{themeLabel}</span>}
        </button>

        {isOpen && (
          <div
            className={cn(
              "absolute right-0 mt-2 w-36 origin-top-right",
              "rounded-md border border-border bg-popover p-1 shadow-md",
              "animate-in fade-in-0 zoom-in-95",
              "z-50"
            )}
            role="listbox"
            aria-label="Theme options"
          >
            <button
              onClick={() => {
                setTheme("light");
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5",
                "text-sm text-foreground",
                "hover:bg-accent focus:bg-accent focus:outline-none",
                theme === "light" && "bg-accent"
              )}
              role="option"
              aria-selected={theme === "light"}
            >
              <SunIcon size={16} />
              <span>Light</span>
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5",
                "text-sm text-foreground",
                "hover:bg-accent focus:bg-accent focus:outline-none",
                theme === "dark" && "bg-accent"
              )}
              role="option"
              aria-selected={theme === "dark"}
            >
              <MoonIcon size={16} />
              <span>Dark</span>
            </button>
            <button
              onClick={() => {
                setTheme("system");
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5",
                "text-sm text-foreground",
                "hover:bg-accent focus:bg-accent focus:outline-none",
                theme === "system" && "bg-accent"
              )}
              role="option"
              aria-selected={theme === "system"}
            >
              <MonitorIcon size={16} />
              <span>System</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export { ThemeToggle };
export type { ThemeToggleProps, ThemeToggleVariant, ThemeToggleSize };
