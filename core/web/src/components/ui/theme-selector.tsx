"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { getAppTheme, type AppThemeType } from "@/lib/themes";

// =====================================================
// Theme Selector Types
// =====================================================

type ThemeSelectorVariant = "grid" | "list" | "dropdown";
type ThemeSelectorSize = "sm" | "md" | "lg";

interface ThemeSelectorProps {
  variant?: ThemeSelectorVariant;
  size?: ThemeSelectorSize;
  showDescription?: boolean;
  showPsychology?: boolean;
  className?: string;
  onThemeChange?: (themeId: AppThemeType) => void;
}

// =====================================================
// Size Configurations
// =====================================================

const sizeConfig: Record<
  ThemeSelectorSize,
  { colorSwatch: string; text: string; gap: string; padding: string }
> = {
  sm: {
    colorSwatch: "h-4 w-4",
    text: "text-xs",
    gap: "gap-1.5",
    padding: "p-2",
  },
  md: {
    colorSwatch: "h-5 w-5",
    text: "text-sm",
    gap: "gap-2",
    padding: "p-3",
  },
  lg: {
    colorSwatch: "h-6 w-6",
    text: "text-base",
    gap: "gap-3",
    padding: "p-4",
  },
};

// =====================================================
// Check Icon Component
// =====================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// =====================================================
// Chevron Icon Component
// =====================================================

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// =====================================================
// Color Preview Component
// =====================================================

interface ColorPreviewProps {
  themeId: AppThemeType;
  size: ThemeSelectorSize;
  isSelected?: boolean;
}

function ColorPreview({ themeId, size, isSelected }: ColorPreviewProps) {
  const theme = getAppTheme(themeId);
  const colors = theme.light;
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center", config.gap)}>
      {/* Primary color swatch */}
      <div
        className={cn(
          "rounded-full ring-1 ring-black/10",
          config.colorSwatch,
          isSelected && "ring-2 ring-primary"
        )}
        style={{ backgroundColor: colors.primary }}
        title="Primary"
      />
      {/* Accent color swatch */}
      <div
        className={cn(
          "rounded-full ring-1 ring-black/10",
          config.colorSwatch,
          isSelected && "ring-2 ring-primary"
        )}
        style={{ backgroundColor: colors.accent }}
        title="Accent"
      />
    </div>
  );
}

// =====================================================
// Theme Option Component (for grid/list)
// =====================================================

interface ThemeOptionProps {
  themeId: AppThemeType;
  isSelected: boolean;
  onSelect: () => void;
  size: ThemeSelectorSize;
  showDescription: boolean;
  showPsychology: boolean;
  variant: ThemeSelectorVariant;
}

function ThemeOption({
  themeId,
  isSelected,
  onSelect,
  size,
  showDescription,
  showPsychology,
  variant,
}: ThemeOptionProps) {
  const theme = getAppTheme(themeId);
  const colors = theme.light;
  const config = sizeConfig[size];

  const isGrid = variant === "grid";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex rounded-lg border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        config.padding,
        isGrid
          ? "flex-col items-start"
          : "flex-row items-center justify-between",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute right-2 top-2">
          <CheckIcon className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "flex",
          isGrid ? "flex-col gap-2 w-full" : "flex-row items-center gap-3"
        )}
      >
        {/* Preview colors */}
        <div
          className={cn(
            "flex items-center gap-1",
            isGrid && "justify-center py-2"
          )}
        >
          <div
            className="h-8 w-8 rounded-l-md"
            style={{ backgroundColor: colors.primary }}
          />
          <div
            className="h-8 w-8 rounded-r-md"
            style={{ backgroundColor: colors.accent }}
          />
        </div>

        {/* Text content */}
        <div className={cn("flex flex-col", isGrid && "items-center text-center")}>
          <span
            className={cn(
              "font-medium text-foreground",
              config.text,
              isSelected && "text-primary"
            )}
          >
            {theme.name}
          </span>

          {showDescription && (
            <span className={cn("text-muted-foreground", size === "lg" ? "text-sm" : "text-xs")}>
              {theme.description}
            </span>
          )}

          {showPsychology && (
            <span
              className={cn(
                "mt-1 text-muted-foreground italic",
                size === "lg" ? "text-xs" : "text-[10px]"
              )}
            >
              {theme.psychology}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// =====================================================
// Theme Selector Component
// =====================================================

function ThemeSelector({
  variant = "grid",
  size = "md",
  showDescription = true,
  showPsychology = false,
  className,
  onThemeChange,
}: ThemeSelectorProps) {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const config = sizeConfig[size];

  // Handle theme selection
  const handleSelect = React.useCallback(
    (themeId: AppThemeType) => {
      setTheme(themeId);
      onThemeChange?.(themeId);
      if (variant === "dropdown") {
        setIsOpen(false);
      }
    },
    [setTheme, onThemeChange, variant]
  );

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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Get current theme config
  const currentThemeConfig = getAppTheme(currentTheme);

  // Grid layout
  if (variant === "grid") {
    return (
      <div
        className={cn(
          "grid gap-3",
          size === "sm" && "grid-cols-3 sm:grid-cols-4",
          size === "md" && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          size === "lg" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {availableThemes.map((theme) => (
          <ThemeOption
            key={theme.id}
            themeId={theme.id}
            isSelected={currentTheme === theme.id}
            onSelect={() => handleSelect(theme.id)}
            size={size}
            showDescription={showDescription}
            showPsychology={showPsychology}
            variant={variant}
          />
        ))}
      </div>
    );
  }

  // List layout
  if (variant === "list") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {availableThemes.map((theme) => (
          <ThemeOption
            key={theme.id}
            themeId={theme.id}
            isSelected={currentTheme === theme.id}
            onSelect={() => handleSelect(theme.id)}
            size={size}
            showDescription={showDescription}
            showPsychology={showPsychology}
            variant={variant}
          />
        ))}
      </div>
    );
  }

  // Dropdown layout
  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border",
          "text-foreground",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          config.padding,
          "border-border bg-card"
        )}
        aria-label="Select theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          <ColorPreview
            themeId={currentTheme}
            size={size}
            isSelected={false}
          />
          <div className="flex flex-col items-start">
            <span className={cn("font-medium", config.text)}>
              {currentThemeConfig.name}
            </span>
            {showDescription && (
              <span className="text-xs text-muted-foreground">
                {currentThemeConfig.description}
              </span>
            )}
          </div>
        </div>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 text-muted-foreground",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-2",
            "max-h-80 overflow-auto",
            "rounded-lg border border-border bg-popover shadow-lg",
            "animate-in fade-in-0 zoom-in-95"
          )}
          role="listbox"
          aria-label="Theme options"
        >
          {availableThemes.map((theme) => {
            const themeConfig = getAppTheme(theme.id);
            const colors = themeConfig.light;
            const isSelected = currentTheme === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2",
                  "text-left",
                  "hover:bg-accent focus:bg-accent focus:outline-none",
                  isSelected && "bg-primary/5"
                )}
                role="option"
                aria-selected={isSelected}
              >
                {/* Color swatches */}
                <div className="flex items-center gap-1">
                  <div
                    className="h-6 w-6 rounded-l-md"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <div
                    className="h-6 w-6 rounded-r-md"
                    style={{ backgroundColor: colors.accent }}
                  />
                </div>

                {/* Text */}
                <div className="flex flex-1 flex-col">
                  <span
                    className={cn(
                      "font-medium",
                      config.text,
                      isSelected && "text-primary"
                    )}
                  >
                    {theme.name}
                  </span>
                  {showDescription && (
                    <span className="text-xs text-muted-foreground">
                      {theme.description}
                    </span>
                  )}
                </div>

                {/* Check mark */}
                {isSelected && (
                  <CheckIcon className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Exports
// =====================================================

export { ThemeSelector };
export type { ThemeSelectorProps, ThemeSelectorVariant, ThemeSelectorSize };
