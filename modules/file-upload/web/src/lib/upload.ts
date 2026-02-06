'use client';

// =============================================================================
// Types
// =============================================================================

export interface UploadedFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
  originalName: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  file?: UploadedFile;
  files?: UploadedFile[];
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  isPublic?: boolean;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export interface PresignedUploadOptions {
  filename: string;
  contentType: string;
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const UPLOAD_ENDPOINT = `${API_BASE_URL}/upload`;

// =============================================================================
// Upload Service Class
// =============================================================================

export class UploadService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || UPLOAD_ENDPOINT;
  }

  /**
   * Upload a single file with progress tracking
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { folder, isPublic = false, onProgress, signal } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Build URL with query params
      const params = new URLSearchParams();
      if (folder) params.set('folder', folder);
      if (isPublic) params.set('public', 'true');
      const url = `${this.baseUrl}?${params.toString()}`;

      // Handle abort
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });
      }

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      // Completion handler
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            resolve({
              success: false,
              error: response.error || `Upload failed with status ${xhr.status}`,
            });
          }
        } catch {
          resolve({
            success: false,
            error: 'Failed to parse server response',
          });
        }
      });

      // Error handler
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      // Abort handler
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: 'Upload cancelled',
        });
      });

      // Send request
      xhr.open('POST', url);
      xhr.withCredentials = true; // Include cookies for auth
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { folder, isPublic = false, onProgress, signal } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      files.forEach((file) => {
        formData.append('files', file);
      });

      // Build URL with query params
      const params = new URLSearchParams();
      if (folder) params.set('folder', folder);
      if (isPublic) params.set('public', 'true');
      const url = `${this.baseUrl}/multiple?${params.toString()}`;

      // Handle abort
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });
      }

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      // Completion handler
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            resolve({
              success: false,
              error: response.error || `Upload failed with status ${xhr.status}`,
            });
          }
        } catch {
          resolve({
            success: false,
            error: 'Failed to parse server response',
          });
        }
      });

      // Error handler
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      xhr.open('POST', url);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  /**
   * Upload a single file to public storage (optional auth)
   */
  async uploadPublicFile(
    file: File,
    options: Omit<UploadOptions, 'isPublic'> = {}
  ): Promise<UploadResult> {
    const { onProgress, signal } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      const url = `${this.baseUrl}/public`;

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload cancelled'));
        });
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            resolve({
              success: false,
              error: response.error || `Upload failed with status ${xhr.status}`,
            });
          }
        } catch {
          resolve({
            success: false,
            error: 'Failed to parse server response',
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      xhr.open('POST', url);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  /**
   * Get a presigned URL for direct upload to S3
   */
  async getPresignedUrl(
    options: PresignedUploadOptions
  ): Promise<{ key: string; uploadUrl: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/presigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          filename: options.filename,
          contentType: options.contentType,
          folder: options.folder,
        }),
        signal: options.signal,
      });

      const data = await response.json();

      if (data.success) {
        return {
          key: data.key,
          uploadUrl: data.uploadUrl,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Upload directly to S3 using a presigned URL
   */
  async uploadWithPresignedUrl(
    file: File,
    uploadUrl: string,
    options: { onProgress?: (progress: UploadProgress) => void; signal?: AbortSignal } = {}
  ): Promise<boolean> {
    const { onProgress, signal } = options;

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
          resolve(false);
        });
      }

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        resolve(xhr.status >= 200 && xhr.status < 300);
      });

      xhr.addEventListener('error', () => {
        resolve(false);
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  /**
   * Get a signed URL for accessing a private file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/signed-url/${encodeURIComponent(key)}?expires=${expiresIn}`,
        {
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        return data.url;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      return data.success === true;
    } catch {
      return false;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(
    prefix: string = '',
    limit: number = 100,
    cursor?: string
  ): Promise<{ files: { key: string; size: number; lastModified?: string }[]; nextCursor?: string; hasMore: boolean } | null> {
    try {
      const params = new URLSearchParams();
      if (prefix) params.set('prefix', prefix);
      params.set('limit', limit.toString());
      if (cursor) params.set('cursor', cursor);

      const response = await fetch(`${this.baseUrl}/list?${params.toString()}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        return {
          files: data.files,
          nextCursor: data.nextCursor,
          hasMore: data.hasMore,
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const uploadService = new UploadService();

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Check if file size is within limit
 */
export function isFileSizeAllowed(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: { maxSize?: number; allowedTypes?: string[] } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)} limit`,
    };
  }

  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type || 'unknown'} is not allowed`,
    };
  }

  return { valid: true };
}
