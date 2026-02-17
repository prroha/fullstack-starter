"use client";

import * as React from "react";
import { useState } from "react";
import { Button, ButtonProps } from "./button";
import { downloadFile, ExportFormat } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useClickOutside, useAsync } from "@/lib/hooks";

// =====================================================
// Icons
// =====================================================

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

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

function CheckIcon({ className }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// =====================================================
// Export Button Props
// =====================================================

export interface ExportButtonProps extends Omit<ButtonProps, "onClick" | "onError"> {
  /**
   * API endpoint URL for server-side export
   */
  url?: string;
  /**
   * Custom filename for the download (without extension)
   */
  filename?: string;
  /**
   * Available export formats
   */
  formats?: ExportFormat[];
  /**
   * Default format to use
   */
  defaultFormat?: ExportFormat;
  /**
   * Whether to show format selection dropdown
   */
  showFormatSelector?: boolean;
  /**
   * Callback for handling export
   * If provided, this will be called instead of the default download behavior
   */
  onExport?: (format: ExportFormat) => Promise<void>;
  /**
   * Callback when export completes successfully
   */
  onSuccess?: () => void;
  /**
   * Callback when export fails
   */
  onError?: (error: Error) => void;
  /**
   * Button label
   */
  label?: string;
  /**
   * Whether to show the download icon
   */
  showIcon?: boolean;
}

// =====================================================
// Export Button Component
// =====================================================

export function ExportButton({
  url,
  filename,
  formats = ["csv"],
  defaultFormat = "csv",
  showFormatSelector = false,
  onExport,
  onSuccess,
  onError,
  label = "Export",
  showIcon = true,
  className,
  variant = "outline",
  size = "sm",
  disabled,
  ...props
}: ExportButtonProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Use click outside hook to close dropdown
  const dropdownRef = useClickOutside<HTMLDivElement>(
    () => setIsDropdownOpen(false),
    { enabled: isDropdownOpen }
  );

  // Use async hook for export operation
  const { execute: performExport, isLoading } = useAsync(
    async (format: ExportFormat) => {
      if (onExport) {
        await onExport(format);
      } else if (url) {
        // Build URL with format query parameter
        const exportUrl = new URL(url, window.location.origin);
        exportUrl.searchParams.set("format", format);

        const downloadFilename = filename
          ? `${filename}.${format}`
          : undefined;

        await downloadFile(exportUrl.toString(), downloadFilename);
      } else {
        throw new Error("Either url or onExport must be provided");
      }
      return true;
    },
    {
      onSuccess: () => {
        setShowSuccess(true);
        onSuccess?.();
        // Reset success state after 2 seconds
        setTimeout(() => setShowSuccess(false), 2000);
        setIsDropdownOpen(false);
      },
      onError: (err) => {
        onError?.(err);
        setIsDropdownOpen(false);
      },
    }
  );

  const handleExport = async (format: ExportFormat = selectedFormat) => {
    if (isLoading || disabled) return;
    setShowSuccess(false);
    await performExport(format);
  };

  // Simple button without format selector
  if (!showFormatSelector || formats.length <= 1) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        disabled={disabled || isLoading}
        isLoading={isLoading}
        onClick={() => handleExport()}
        {...props}
      >
        {!isLoading && showIcon && (
          showSuccess ? (
            <CheckIcon className="text-success" />
          ) : (
            <DownloadIcon />
          )
        )}
        {showSuccess ? "Downloaded" : label}
      </Button>
    );
  }

  // Button with format dropdown
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div className="flex">
        {/* Main export button */}
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2 rounded-r-none", className)}
          disabled={disabled || isLoading}
          isLoading={isLoading}
          onClick={() => handleExport()}
          {...props}
        >
          {!isLoading && showIcon && (
            showSuccess ? (
              <CheckIcon className="text-success" />
            ) : (
              <DownloadIcon />
            )
          )}
          {showSuccess ? "Downloaded" : `${label} (${selectedFormat.toUpperCase()})`}
        </Button>

        {/* Dropdown toggle */}
        <Button
          variant={variant}
          size={size}
          className="rounded-l-none border-l-0 px-2"
          disabled={disabled || isLoading}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-label="Select export format"
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          <ChevronDownIcon className={cn(
            "transition-transform",
            isDropdownOpen && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div
          className="absolute right-0 z-50 mt-1 min-w-[120px] rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
          role="listbox"
        >
          {formats.map((format) => (
            <button
              key={format}
              role="option"
              aria-selected={format === selectedFormat}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                format === selectedFormat && "bg-accent"
              )}
              onClick={() => {
                setSelectedFormat(format);
                handleExport(format);
              }}
            >
              <span>{format.toUpperCase()}</span>
              {format === selectedFormat && (
                <CheckIcon className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Simple Export CSV Button (convenience component)
// =====================================================

export interface ExportCsvButtonProps extends Omit<ExportButtonProps, "formats" | "defaultFormat" | "showFormatSelector"> {}

export function ExportCsvButton(props: ExportCsvButtonProps) {
  return (
    <ExportButton
      {...props}
      formats={["csv"]}
      defaultFormat="csv"
      showFormatSelector={false}
    />
  );
}

// =====================================================
// Export My Data Button (for user profile/settings)
// =====================================================

export interface ExportMyDataButtonProps extends Omit<ExportButtonProps, "url" | "formats" | "filename"> {
  /**
   * Base API URL (defaults to NEXT_PUBLIC_API_URL)
   */
  apiBaseUrl?: string;
}

export function ExportMyDataButton({
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  label = "Export My Data",
  ...props
}: ExportMyDataButtonProps) {
  const timestamp = new Date().toISOString().split("T")[0];

  return (
    <ExportButton
      {...props}
      url={`${apiBaseUrl}/v1/users/me/export`}
      filename={`my-data-${timestamp}`}
      formats={["json", "csv"]}
      defaultFormat="json"
      showFormatSelector={true}
      label={label}
    />
  );
}
