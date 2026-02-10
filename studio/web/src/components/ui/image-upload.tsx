"use client";

import { useState, useRef, useCallback, ChangeEvent, DragEvent } from "react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<string>;
  onRemove?: () => void;
  isUploading?: boolean;
  className?: string;
  disabled?: boolean;
  aspectRatio?: "square" | "video" | "auto";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  currentImageUrl,
  onUpload,
  onRemove,
  isUploading = false,
  className,
  disabled = false,
  aspectRatio = "video",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a JPEG, PNG, or WebP image.";
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
        // Keep preview after successful upload - the parent will update currentImageUrl
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
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

  const handleRemove = () => {
    if (onRemove && !disabled && !isUploading) {
      setError(null);
      setPreviewUrl(null);
      onRemove();
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Image Display / Drop Zone */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed overflow-hidden cursor-pointer transition-all",
          aspectClasses[aspectRatio],
          "min-h-[120px]",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-border hover:border-primary/50",
          !disabled && !isUploading && "hover:bg-muted/50",
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
        aria-label="Upload image"
      >
        {/* Image Preview */}
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <svg
              className="w-10 h-10 text-muted-foreground mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-muted-foreground text-center">
              {isDragging ? "Drop image here" : "Click or drag to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP. Max 5MB
            </p>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <svg
                className="w-8 h-8 animate-spin text-primary"
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
              <span className="text-sm text-muted-foreground mt-2">Uploading...</span>
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

      {/* Remove button */}
      {displayUrl && onRemove && !isUploading && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className={cn(
            "text-sm text-destructive hover:text-destructive/80 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Remove image
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
