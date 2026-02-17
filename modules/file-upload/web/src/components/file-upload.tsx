'use client';

/**
 * File Upload Component
 *
 * A drag-and-drop file upload component using core UI components.
 * Uses core Progress, Button, and Spinner for consistent UI.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  uploadService,
  formatFileSize,
  validateFile,
  type UploadProgress,
  type UploadedFile,
} from '../lib/upload';

// =============================================================================
// Types
// =============================================================================

export interface FileUploadProps {
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum number of files when multiple is true */
  maxFiles?: number;
  /** Folder to upload to */
  folder?: string;
  /** Upload to public storage */
  isPublic?: boolean;
  /** Called when files are successfully uploaded */
  onUpload?: (files: UploadedFile[]) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accept attribute for input */
  accept?: string;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: UploadedFile;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

// =============================================================================
// File Icon Component (domain-specific)
// =============================================================================

function FileIcon({ mimeType }: { mimeType: string }) {
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  if (isImage) {
    return (
      <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (isPdf) {
    return (
      <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  }

  return (
    <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

// =============================================================================
// Status Icons
// =============================================================================

function SuccessIcon() {
  return (
    <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-5 h-5 text-destructive" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// =============================================================================
// File Upload Component
// =============================================================================

export function FileUpload({
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  multiple = false,
  maxFiles = 10,
  folder,
  isPublic = false,
  onUpload,
  onError,
  className = '',
  disabled = false,
  accept,
  label = 'Upload files',
  helperText,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate accept string from allowed types if not provided
  const acceptString = accept || allowedTypes.join(',');

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Validate and add files to the queue
   */
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validatedFiles: FileWithProgress[] = [];
      const errors: string[] = [];

      // Check max files limit
      const currentCount = files.filter((f) => f.status !== 'error').length;
      const availableSlots = multiple ? maxFiles - currentCount : 1;

      if (fileArray.length > availableSlots) {
        errors.push(`Can only upload ${availableSlots} more file(s)`);
        fileArray.splice(availableSlots);
      }

      for (const file of fileArray) {
        const validation = validateFile(file, { maxSize, allowedTypes });

        if (validation.valid) {
          validatedFiles.push({
            file,
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            progress: 0,
            status: 'pending',
          });
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      }

      if (errors.length > 0) {
        onError?.(errors.join('. '));
      }

      if (validatedFiles.length > 0) {
        if (multiple) {
          setFiles((prev) => [...prev, ...validatedFiles]);
        } else {
          setFiles(validatedFiles);
        }
      }
    },
    [files, maxSize, allowedTypes, multiple, maxFiles, onError]
  );

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input to allow selecting the same file again
      e.target.value = '';
    },
    [addFiles]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles, disabled]
  );

  /**
   * Upload all pending files
   */
  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    abortControllerRef.current = new AbortController();
    const uploadedFiles: UploadedFile[] = [];

    for (const fileWithProgress of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id ? { ...f, status: 'uploading' as const } : f
        )
      );

      try {
        const result = await uploadService.uploadFile(fileWithProgress.file, {
          folder,
          isPublic,
          signal: abortControllerRef.current.signal,
          onProgress: (progress: UploadProgress) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileWithProgress.id
                  ? { ...f, progress: progress.percentage }
                  : f
              )
            );
          },
        });

        if (result.success && result.file) {
          uploadedFiles.push(result.file);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileWithProgress.id
                ? { ...f, status: 'success' as const, progress: 100, result: result.file }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileWithProgress.id
                ? { ...f, status: 'error' as const, error: result.error || 'Upload failed' }
                : f
            )
          );
          onError?.(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithProgress.id
              ? { ...f, status: 'error' as const, error: errorMessage }
              : f
          )
        );
        onError?.(errorMessage);
      }
    }

    setIsUploading(false);
    abortControllerRef.current = null;

    if (uploadedFiles.length > 0) {
      onUpload?.(uploadedFiles);
    }
  }, [files, folder, isPublic, onUpload, onError]);

  /**
   * Cancel upload
   */
  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsUploading(false);
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'uploading' ? { ...f, status: 'pending' as const, progress: 0 } : f
      )
    );
  }, []);

  /**
   * Remove a file from the queue
   */
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  /**
   * Open file browser
   */
  const openFileBrowser = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // Computed values
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const hasFiles = files.length > 0;

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileBrowser}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        {/* Upload Icon */}
        <svg
          className={cn('mx-auto h-12 w-12', isDragging ? 'text-primary' : 'text-muted-foreground')}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="mt-4">
          <span className="text-sm font-medium text-primary hover:text-primary/80">
            {label}
          </span>
          <span className="text-sm text-muted-foreground"> or drag and drop</span>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {helperText || `Max ${formatFileSize(maxSize)} per file`}
        </p>
      </div>

      {/* File List */}
      {hasFiles && (
        <div className="mt-4 space-y-2">
          {files.map((fileWithProgress) => (
            <div
              key={fileWithProgress.id}
              className="flex items-center gap-3 p-3 bg-card rounded-lg border"
            >
              {/* File Icon */}
              <div className="flex-shrink-0">
                <FileIcon mimeType={fileWithProgress.file.type} />
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {fileWithProgress.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(fileWithProgress.file.size)}
                </p>

                {/* Progress Bar - Using core Progress component */}
                {fileWithProgress.status === 'uploading' && (
                  <Progress
                    value={fileWithProgress.progress}
                    size="sm"
                    className="mt-2"
                  />
                )}

                {/* Error Message */}
                {fileWithProgress.status === 'error' && (
                  <p className="mt-1 text-xs text-destructive">{fileWithProgress.error}</p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {fileWithProgress.status === 'success' && <SuccessIcon />}
                {fileWithProgress.status === 'error' && <ErrorIcon />}
                {fileWithProgress.status === 'uploading' && <Spinner size="sm" />}
                {fileWithProgress.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileWithProgress.id);
                    }}
                    className="text-muted-foreground hover:text-foreground h-7 w-7"
                    aria-label={`Remove ${fileWithProgress.file.name}`}
                  >
                    <CloseIcon />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons - Using core Button component */}
      {hasFiles && (
        <div className="mt-4 flex gap-2">
          {pendingCount > 0 && !isUploading && (
            <Button
              onClick={uploadFiles}
              disabled={disabled}
            >
              Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
            </Button>
          )}

          {isUploading && (
            <Button
              variant="destructive"
              onClick={cancelUpload}
            >
              Cancel
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={clearFiles}
            disabled={isUploading}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
