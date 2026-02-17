'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { uploadService, formatFileSize, type UploadedFile } from '../lib/upload';

// =============================================================================
// Types
// =============================================================================

export interface FileInfo {
  key: string;
  size: number;
  lastModified?: string;
  url?: string;
  contentType?: string;
  originalName?: string;
}

export interface FileListProps {
  /** Initial list of files (can be UploadedFile[] from uploads) */
  files?: (UploadedFile | FileInfo)[];
  /** Prefix/folder to list files from (overrides files prop) */
  prefix?: string;
  /** Whether to auto-fetch files from server */
  autoFetch?: boolean;
  /** Called when a file is deleted */
  onDelete?: (key: string) => void;
  /** Called when a file is clicked */
  onFileClick?: (file: FileInfo) => void;
  /** Custom className */
  className?: string;
  /** Enable delete functionality */
  allowDelete?: boolean;
  /** Show file sizes */
  showSize?: boolean;
  /** Show last modified date */
  showDate?: boolean;
  /** Enable file preview */
  enablePreview?: boolean;
  /** Number of files to fetch per page */
  pageSize?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Grid or list view */
  view?: 'grid' | 'list';
}

interface InternalFileInfo extends FileInfo {
  isDeleting?: boolean;
  previewUrl?: string;
}

// =============================================================================
// File List Component
// =============================================================================

export function FileList({
  files: initialFiles,
  prefix = '',
  autoFetch = false,
  onDelete,
  onFileClick,
  className = '',
  allowDelete = true,
  showSize = true,
  showDate = false,
  enablePreview = true,
  pageSize = 20,
  emptyMessage = 'No files uploaded yet',
  view = 'list',
}: FileListProps) {
  const [files, setFiles] = useState<InternalFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [previewFile, setPreviewFile] = useState<InternalFileInfo | null>(null);

  // Initialize files from props
  useEffect(() => {
    if (initialFiles && !autoFetch) {
      setFiles(
        initialFiles.map((f) => ({
          key: f.key,
          size: f.size,
          url: f.url,
          contentType: f.contentType,
          originalName: 'originalName' in f ? f.originalName : undefined,
        }))
      );
    }
  }, [initialFiles, autoFetch]);

  // Fetch files from server
  const fetchFiles = useCallback(
    async (append = false) => {
      if (!autoFetch) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await uploadService.listFiles(
          prefix,
          pageSize,
          append ? cursor : undefined
        );

        if (result) {
          const newFiles: InternalFileInfo[] = result.files.map((f) => ({
            key: f.key,
            size: f.size,
            lastModified: f.lastModified,
          }));

          if (append) {
            setFiles((prev) => [...prev, ...newFiles]);
          } else {
            setFiles(newFiles);
          }

          setHasMore(result.hasMore);
          setCursor(result.nextCursor);
        } else {
          setError('Failed to load files');
        }
      } catch {
        setError('Failed to load files');
      } finally {
        setIsLoading(false);
      }
    },
    [autoFetch, prefix, pageSize, cursor]
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchFiles();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Delete a file
   */
  const handleDelete = useCallback(
    async (file: InternalFileInfo) => {
      if (!allowDelete) return;

      // Mark as deleting
      setFiles((prev) =>
        prev.map((f) => (f.key === file.key ? { ...f, isDeleting: true } : f))
      );

      const success = await uploadService.deleteFile(file.key);

      if (success) {
        setFiles((prev) => prev.filter((f) => f.key !== file.key));
        onDelete?.(file.key);
      } else {
        // Revert deleting state
        setFiles((prev) =>
          prev.map((f) => (f.key === file.key ? { ...f, isDeleting: false } : f))
        );
        setError(`Failed to delete ${file.key}`);
      }
    },
    [allowDelete, onDelete]
  );

  /**
   * Get preview URL for a file
   */
  const getPreviewUrl = useCallback(async (file: InternalFileInfo) => {
    if (file.url) return file.url;

    const signedUrl = await uploadService.getSignedUrl(file.key);
    return signedUrl;
  }, []);

  /**
   * Open file preview
   */
  const openPreview = useCallback(
    async (file: InternalFileInfo) => {
      if (!enablePreview) {
        onFileClick?.(file);
        return;
      }

      const url = await getPreviewUrl(file);
      if (url) {
        setPreviewFile({ ...file, previewUrl: url });
      }
    },
    [enablePreview, getPreviewUrl, onFileClick]
  );

  /**
   * Close preview modal
   */
  const closePreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  /**
   * Get file name from key
   */
  const getFileName = (file: InternalFileInfo): string => {
    if (file.originalName) return file.originalName;
    const parts = file.key.split('/');
    return parts[parts.length - 1];
  };

  /**
   * Check if file is an image
   */
  const isImage = (file: InternalFileInfo): boolean => {
    const key = file.key.toLowerCase();
    return (
      file.contentType?.startsWith('image/') ||
      key.endsWith('.jpg') ||
      key.endsWith('.jpeg') ||
      key.endsWith('.png') ||
      key.endsWith('.gif') ||
      key.endsWith('.webp')
    );
  };

  /**
   * Format date string
   */
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render loading state
  if (isLoading && files.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <Spinner size="md" />
        <p className="mt-2 text-sm text-muted-foreground">Loading files...</p>
      </div>
    );
  }

  // Render error state
  if (error && files.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <p className="text-destructive">{error}</p>
        {autoFetch && (
          <Button
            variant="link"
            onClick={() => fetchFiles()}
            className="mt-2 text-sm"
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  // Render empty state
  if (files.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
          <Button
            variant="link"
            onClick={() => setError(null)}
            className="ml-2 text-destructive"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* File list */}
      {view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <FileGridItem
              key={file.key}
              file={file}
              fileName={getFileName(file)}
              isImage={isImage(file)}
              showSize={showSize}
              allowDelete={allowDelete}
              onDelete={() => handleDelete(file)}
              onClick={() => openPreview(file)}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {files.map((file) => (
            <FileListItem
              key={file.key}
              file={file}
              fileName={getFileName(file)}
              isImage={isImage(file)}
              showSize={showSize}
              showDate={showDate}
              allowDelete={allowDelete}
              onDelete={() => handleDelete(file)}
              onClick={() => openPreview(file)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={() => fetchFiles(true)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal
          file={previewFile}
          fileName={getFileName(previewFile)}
          isImage={isImage(previewFile)}
          onClose={closePreview}
        />
      )}
    </div>
  );
}

// =============================================================================
// File List Item Component
// =============================================================================

interface FileListItemProps {
  file: InternalFileInfo;
  fileName: string;
  isImage: boolean;
  showSize: boolean;
  showDate: boolean;
  allowDelete: boolean;
  onDelete: () => void;
  onClick: () => void;
  formatDate: (date?: string) => string;
}

function FileListItem({
  file,
  fileName,
  isImage,
  showSize,
  showDate,
  allowDelete,
  onDelete,
  onClick,
  formatDate,
}: FileListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 hover:bg-muted ${
        file.isDeleting ? 'opacity-50' : ''
      }`}
    >
      {/* Thumbnail / Icon */}
      <div
        onClick={onClick}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center cursor-pointer"
      >
        {isImage && file.url ? (
          <img
            src={file.url}
            alt={fileName}
            className="w-10 h-10 object-cover rounded"
          />
        ) : (
          <FileTypeIcon isImage={isImage} />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
        <div className="flex gap-2 text-xs text-muted-foreground">
          {showSize && <span>{formatFileSize(file.size)}</span>}
          {showDate && file.lastModified && (
            <span>{formatDate(file.lastModified)}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {allowDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={file.isDeleting}
          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
        >
          {file.isDeleting ? (
            <Spinner size="sm" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// File Grid Item Component
// =============================================================================

interface FileGridItemProps {
  file: InternalFileInfo;
  fileName: string;
  isImage: boolean;
  showSize: boolean;
  allowDelete: boolean;
  onDelete: () => void;
  onClick: () => void;
}

function FileGridItem({
  file,
  fileName,
  isImage,
  showSize,
  allowDelete,
  onDelete,
  onClick,
}: FileGridItemProps) {
  return (
    <div
      className={`relative group bg-card border border-border rounded-lg overflow-hidden ${
        file.isDeleting ? 'opacity-50' : ''
      }`}
    >
      {/* Thumbnail */}
      <div
        onClick={onClick}
        className="aspect-square cursor-pointer flex items-center justify-center bg-muted"
      >
        {isImage && file.url ? (
          <img src={file.url} alt={fileName} className="w-full h-full object-cover" />
        ) : (
          <FileTypeIcon isImage={isImage} large />
        )}
      </div>

      {/* File Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-foreground truncate">{fileName}</p>
        {showSize && (
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        )}
      </div>

      {/* Delete Button */}
      {allowDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={file.isDeleting}
          className="absolute top-2 right-2 h-7 w-7 bg-card rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          {file.isDeleting ? (
            <Spinner size="xs" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// File Type Icon Component
// =============================================================================

function FileTypeIcon({ isImage, large = false }: { isImage: boolean; large?: boolean }) {
  const sizeClass = large ? 'w-12 h-12' : 'w-8 h-8';

  if (isImage) {
    return (
      <svg className={`${sizeClass} text-success`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }

  return (
    <svg className={`${sizeClass} text-muted-foreground`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
// Preview Modal Component
// =============================================================================

interface PreviewModalProps {
  file: InternalFileInfo;
  fileName: string;
  isImage: boolean;
  onClose: () => void;
}

function PreviewModal({ file, fileName, isImage, onClose }: PreviewModalProps) {
  const url = file.previewUrl || file.url;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-lg max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium truncate">{fileName}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-auto">
          {isImage && url ? (
            <img src={url} alt={fileName} className="max-w-full h-auto mx-auto" />
          ) : url ? (
            <div className="text-center">
              <FileTypeIcon isImage={false} large />
              <p className="mt-4 text-muted-foreground">Preview not available</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-primary hover:text-primary/80"
              >
                Open file
              </a>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Loading...</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted">
          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
          {url && (
            <Button asChild>
              <a href={url} download={fileName}>
                Download
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileList;
