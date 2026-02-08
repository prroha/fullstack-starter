"use client";

import { useState, useRef, useCallback, ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  initials?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function AvatarUpload({
  currentAvatarUrl,
  initials = "U",
  onUpload,
  onRemove,
  isUploading = false,
  uploadProgress = 0,
  className,
  size = "lg",
  disabled = false,
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const textSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File is too large. Maximum size is 5MB.";
    }
    return null;
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        await onUpload(file);
        setPreviewUrl(null); // Clear preview after successful upload
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload avatar");
        setPreviewUrl(null);
      }
    },
    [onUpload]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = async () => {
    if (onRemove && !disabled && !isUploading) {
      setError(null);
      try {
        await onRemove();
        setPreviewUrl(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove avatar");
      }
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Avatar Display / Drop Zone */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden cursor-pointer transition-all",
          sizeClasses[size],
          isDragging && "ring-4 ring-primary ring-offset-2",
          !disabled && !isUploading && "hover:ring-2 hover:ring-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Upload avatar"
      >
        {/* Avatar Image or Initials */}
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary flex items-center justify-center">
            <span className={cn("font-semibold text-primary-foreground", textSizeClasses[size])}>
              {initials}
            </span>
          </div>
        )}

        {/* Overlay on hover/drag */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
            isDragging || (!disabled && !isUploading) ? "opacity-0 hover:opacity-100" : "opacity-0",
            isDragging && "opacity-100"
          )}
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="relative">
              <svg
                className="w-12 h-12 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                  {uploadProgress}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-hidden="true"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md ",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
        {(currentAvatarUrl || previewUrl) && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md ",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Remove
          </button>
        )}
      </div>

      {/* Hint text */}
      <p className="text-xs text-muted-foreground text-center">
        Drag and drop or click to upload.
        <br />
        JPEG, PNG, GIF, or WebP. Max 5MB.
      </p>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
