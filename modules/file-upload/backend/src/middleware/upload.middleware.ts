import { FastifyRequest, FastifyReply } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import * as path from 'path';

// =============================================================================
// Magic Number Signatures for File Type Validation
// =============================================================================

/**
 * File magic numbers (file signatures) for content-based type validation
 * These are the first bytes of each file type
 */
const FILE_SIGNATURES: Record<string, { mime: string; bytes: number[] }[]> = {
  // Images
  jpeg: [
    { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  ],
  png: [
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  gif: [
    { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  webp: [
    // WEBP starts with RIFF....WEBP
    { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  ],
  // Documents
  pdf: [
    { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ],
  // Microsoft Office (ZIP-based formats)
  docx: [
    { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes: [0x50, 0x4b, 0x03, 0x04] },
  ],
  xlsx: [
    { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes: [0x50, 0x4b, 0x03, 0x04] },
  ],
  pptx: [
    { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', bytes: [0x50, 0x4b, 0x03, 0x04] },
  ],
  // Legacy Office formats
  doc: [
    { mime: 'application/msword', bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  ],
};

/**
 * Check if buffer starts with the given bytes
 */
function bufferStartsWith(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Validate file content by checking magic numbers
 */
function validateMagicNumber(buffer: Buffer, declaredMime: string): boolean {
  // Find matching signatures for the declared MIME type
  for (const [_ext, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const sig of signatures) {
      if (sig.mime === declaredMime || declaredMime.includes(sig.mime.split('/')[1])) {
        if (bufferStartsWith(buffer, sig.bytes)) {
          return true;
        }
      }
    }
  }

  // For WEBP, we need additional check for WEBP marker after RIFF
  if (declaredMime === 'image/webp' && buffer.length >= 12) {
    const riff = bufferStartsWith(buffer, [0x52, 0x49, 0x46, 0x46]);
    const webp = buffer.slice(8, 12).toString('ascii') === 'WEBP';
    if (riff && webp) return true;
  }

  // Allow ZIP-based Office formats
  if (
    (declaredMime.includes('openxmlformats') || declaredMime === 'application/zip') &&
    bufferStartsWith(buffer, [0x50, 0x4b, 0x03, 0x04])
  ) {
    return true;
  }

  return false;
}

// =============================================================================
// Fastify Multipart Request Interface
// =============================================================================

/**
 * FastifyRequest augmented with @fastify/multipart methods.
 * These methods are available after registering @fastify/multipart on the Fastify instance.
 */
interface MultipartRequest extends FastifyRequest {
  file(options?: { limits?: { fileSize?: number } }): Promise<MultipartFile | undefined>;
  files(options?: { limits?: { fileSize?: number; files?: number } }): AsyncIterableIterator<MultipartFile>;
}

// =============================================================================
// Types
// =============================================================================

export interface UploadConfig {
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  fieldName?: string;
}

export interface ParsedFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  size: number;
  originalname: string;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_MAX_FILE_SIZE = parseInt(
  process.env.UPLOAD_MAX_FILE_SIZE || '10485760',
  10
); // 10MB

const DEFAULT_ALLOWED_TYPES = process.env.UPLOAD_ALLOWED_TYPES
  ? process.env.UPLOAD_ALLOWED_TYPES.split(',')
  : ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

// =============================================================================
// Dangerous Extensions Check
// =============================================================================

const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
];

// =============================================================================
// File Parsing Helper (uses @fastify/multipart)
// =============================================================================

/**
 * Parse a single file from a multipart request using @fastify/multipart.
 * The caller must have registered @fastify/multipart on the Fastify instance.
 */
export async function parseSingleFile(
  req: FastifyRequest,
  config: UploadConfig = {}
): Promise<ParsedFile> {
  const maxFileSize = config.maxFileSize || DEFAULT_MAX_FILE_SIZE;
  const allowedTypes = config.allowedTypes || DEFAULT_ALLOWED_TYPES;

  const file = await (req as MultipartRequest).file({ limits: { fileSize: maxFileSize } });

  if (!file) {
    throw Object.assign(new Error('No file uploaded'), { statusCode: 400 });
  }

  const buffer = await file.toBuffer();

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    throw Object.assign(
      new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`),
      { statusCode: 400 }
    );
  }

  // Check dangerous extensions
  const ext = path.extname(file.filename).toLowerCase();
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    throw Object.assign(
      new Error('File extension not allowed for security reasons'),
      { statusCode: 400 }
    );
  }

  // Check file size (toBuffer may already enforce limit, but double-check)
  if (buffer.length > maxFileSize) {
    throw Object.assign(
      new Error('File too large'),
      { statusCode: 400, maxSize: maxFileSize }
    );
  }

  return {
    buffer,
    filename: file.filename,
    mimetype: file.mimetype,
    size: buffer.length,
    originalname: file.filename,
  };
}

/**
 * Parse multiple files from a multipart request using @fastify/multipart.
 * The caller must have registered @fastify/multipart on the Fastify instance.
 */
export async function parseMultipleFiles(
  req: FastifyRequest,
  config: UploadConfig = {}
): Promise<ParsedFile[]> {
  const maxFileSize = config.maxFileSize || DEFAULT_MAX_FILE_SIZE;
  const maxFiles = config.maxFiles || 10;
  const allowedTypes = config.allowedTypes || DEFAULT_ALLOWED_TYPES;

  const parts = (req as MultipartRequest).files({ limits: { fileSize: maxFileSize, files: maxFiles } });
  const files: ParsedFile[] = [];

  for await (const part of parts) {
    const buffer = await part.toBuffer();

    // Check MIME type
    if (allowedTypes.length > 0 && !allowedTypes.includes(part.mimetype)) {
      throw Object.assign(
        new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`),
        { statusCode: 400 }
      );
    }

    // Check dangerous extensions
    const ext = path.extname(part.filename).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      throw Object.assign(
        new Error('File extension not allowed for security reasons'),
        { statusCode: 400 }
      );
    }

    if (buffer.length > maxFileSize) {
      throw Object.assign(
        new Error('File too large'),
        { statusCode: 400, maxSize: maxFileSize }
      );
    }

    files.push({
      buffer,
      filename: part.filename,
      mimetype: part.mimetype,
      size: buffer.length,
      originalname: part.filename,
    });
  }

  return files;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate that file content matches declared MIME type.
 * This prevents MIME type spoofing attacks.
 */
export function validateFileContent(file: ParsedFile): { valid: boolean; error?: string } {
  if (!file.buffer) {
    return { valid: true };
  }

  const isValid = validateMagicNumber(file.buffer, file.mimetype);

  if (!isValid) {
    console.warn('[UploadMiddleware] Content mismatch detected:', {
      originalname: file.originalname,
      declaredMime: file.mimetype,
      size: file.size,
    });

    return {
      valid: false,
      error: 'File content does not match declared type',
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files content
 */
export function validateFilesContent(files: ParsedFile[]): { valid: boolean; error?: string } {
  for (const file of files) {
    if (!file.buffer) continue;

    const isValid = validateMagicNumber(file.buffer, file.mimetype);

    if (!isValid) {
      console.warn('[UploadMiddleware] Content mismatch detected:', {
        originalname: file.originalname,
        declaredMime: file.mimetype,
        size: file.size,
      });

      return {
        valid: false,
        error: `File ${file.originalname} content does not match declared type`,
      };
    }
  }

  return { valid: true };
}

// =============================================================================
// Virus Scan Placeholder
// =============================================================================

/**
 * Virus scan placeholder.
 *
 * In production, integrate with a virus scanning service:
 * - ClamAV (open source, self-hosted)
 * - VirusTotal API (cloud-based)
 * - AWS S3 Malware Protection
 * - Other commercial solutions
 */
export function virusScanFile(file: ParsedFile): { safe: boolean; error?: string } {
  if (!file.buffer) {
    return { safe: true };
  }

  // Placeholder: In production, implement actual virus scanning
  // For now, just check for suspiciously small executable-like content
  const suspiciousPatterns = [
    Buffer.from('MZ'), // DOS/Windows executable header
    Buffer.from('\x7fELF'), // Linux executable header
  ];

  const fileStart = file.buffer.slice(0, 4);

  for (const pattern of suspiciousPatterns) {
    if (fileStart.includes(pattern)) {
      console.warn('[UploadMiddleware] Suspicious file detected:', {
        originalname: file.originalname,
        size: file.size,
      });

      return {
        safe: false,
        error: 'File appears to be an executable and was rejected for security',
      };
    }
  }

  return { safe: true };
}

// =============================================================================
// Size Validation Helpers
// =============================================================================

/**
 * Validate file size
 */
export function validateFileSize(file: ParsedFile, maxSizeBytes: number): { valid: boolean; error?: string } {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB, but file is ${fileSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate MIME type
 */
export function validateMimeType(file: ParsedFile, allowedTypes: string[]): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

export default {
  parseSingleFile,
  parseMultipleFiles,
  validateFileContent,
  validateFilesContent,
  virusScanFile,
  validateFileSize,
  validateMimeType,
};
