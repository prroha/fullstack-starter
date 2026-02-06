import multer, { FileFilterCallback, type Multer, type StorageEngine } from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as path from 'path';
import * as crypto from 'crypto';

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
// Types
// =============================================================================

export interface UploadConfig {
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  fieldName?: string;
}

export interface MulterFile extends Express.Multer.File {
  key?: string;
}

// Extend Request type to include file(s)
declare global {
  namespace Express {
    interface Request {
      file?: MulterFile;
      files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
    }
  }
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
// File Filter
// =============================================================================

function createFileFilter(allowedTypes: string[]) {
  return (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ): void => {
    // Check MIME type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      cb(
        new Error(
          `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        )
      );
      return;
    }

    // Additional security: check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const dangerousExtensions = [
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

    if (dangerousExtensions.includes(ext)) {
      cb(new Error('File extension not allowed for security reasons'));
      return;
    }

    cb(null, true);
  };
}

// =============================================================================
// Memory Storage (for processing before uploading to S3)
// =============================================================================

function createMemoryStorage(): StorageEngine {
  return multer.memoryStorage();
}

// =============================================================================
// Disk Storage (for local file storage)
// =============================================================================

function createDiskStorage(uploadPath: string): StorageEngine {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const random = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `${timestamp}-${random}${ext}`);
    },
  });
}

// =============================================================================
// Upload Middleware Factory
// =============================================================================

/**
 * Create a single file upload middleware
 */
export function createSingleUpload(config: UploadConfig = {}): RequestHandler {
  const upload = multer({
    storage: createMemoryStorage(),
    limits: {
      fileSize: config.maxFileSize || DEFAULT_MAX_FILE_SIZE,
    },
    fileFilter: createFileFilter(config.allowedTypes || DEFAULT_ALLOWED_TYPES),
  });

  const fieldName = config.fieldName || 'file';

  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: 'File too large',
              maxSize: config.maxFileSize || DEFAULT_MAX_FILE_SIZE,
            });
            return;
          }
          res.status(400).json({ error: err.message });
          return;
        }
        if (err instanceof Error) {
          res.status(400).json({ error: err.message });
          return;
        }
        res.status(500).json({ error: 'Upload failed' });
        return;
      }
      next();
    });
  };
}

/**
 * Create a multiple file upload middleware
 */
export function createMultipleUpload(
  config: UploadConfig = {}
): RequestHandler {
  const upload = multer({
    storage: createMemoryStorage(),
    limits: {
      fileSize: config.maxFileSize || DEFAULT_MAX_FILE_SIZE,
      files: config.maxFiles || 10,
    },
    fileFilter: createFileFilter(config.allowedTypes || DEFAULT_ALLOWED_TYPES),
  });

  const fieldName = config.fieldName || 'files';

  return (req: Request, res: Response, next: NextFunction): void => {
    upload.array(fieldName, config.maxFiles || 10)(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: 'File too large',
              maxSize: config.maxFileSize || DEFAULT_MAX_FILE_SIZE,
            });
            return;
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            res.status(400).json({
              error: 'Too many files',
              maxFiles: config.maxFiles || 10,
            });
            return;
          }
          res.status(400).json({ error: err.message });
          return;
        }
        if (err instanceof Error) {
          res.status(400).json({ error: err.message });
          return;
        }
        res.status(500).json({ error: 'Upload failed' });
        return;
      }
      next();
    });
  };
}

/**
 * Create a disk-based upload middleware (for local storage)
 */
export function createDiskUpload(
  uploadPath: string,
  config: UploadConfig = {}
): Multer {
  return multer({
    storage: createDiskStorage(uploadPath),
    limits: {
      fileSize: config.maxFileSize || DEFAULT_MAX_FILE_SIZE,
      files: config.maxFiles || 10,
    },
    fileFilter: createFileFilter(config.allowedTypes || DEFAULT_ALLOWED_TYPES),
  });
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate that a file was uploaded
 */
export function requireFile(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  next();
}

/**
 * Validate that files were uploaded
 */
export function requireFiles(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }
  next();
}

// =============================================================================
// Prebuilt Middleware Instances
// =============================================================================

/** Single image upload (max 5MB, images only) */
export const uploadImage = createSingleUpload({
  maxFileSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  fieldName: 'image',
});

/** Single document upload (max 10MB, PDFs and images) */
export const uploadDocument = createSingleUpload({
  maxFileSize: 10 * 1024 * 1024,
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  fieldName: 'document',
});

/** Multiple images upload (max 5 files, 5MB each) */
export const uploadImages = createMultipleUpload({
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  fieldName: 'images',
});

// =============================================================================
// Content Validation Middleware
// =============================================================================

/**
 * Validate file content matches declared MIME type
 * This prevents MIME type spoofing attacks
 */
export function validateFileContent(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const file = req.file;

  if (!file || !file.buffer) {
    next();
    return;
  }

  // Validate that file content matches declared MIME type
  const isValid = validateMagicNumber(file.buffer, file.mimetype);

  if (!isValid) {
    // Log suspicious upload attempt
    console.warn('[UploadMiddleware] Content mismatch detected:', {
      originalname: file.originalname,
      declaredMime: file.mimetype,
      size: file.size,
    });

    res.status(400).json({
      error: 'File content does not match declared type',
      code: 'INVALID_FILE_CONTENT',
    });
    return;
  }

  next();
}

/**
 * Validate multiple files content
 */
export function validateFilesContent(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    next();
    return;
  }

  for (const file of files) {
    if (!file.buffer) continue;

    const isValid = validateMagicNumber(file.buffer, file.mimetype);

    if (!isValid) {
      console.warn('[UploadMiddleware] Content mismatch detected:', {
        originalname: file.originalname,
        declaredMime: file.mimetype,
        size: file.size,
      });

      res.status(400).json({
        error: `File ${file.originalname} content does not match declared type`,
        code: 'INVALID_FILE_CONTENT',
      });
      return;
    }
  }

  next();
}

// =============================================================================
// Virus Scan Placeholder
// =============================================================================

/**
 * Virus scan placeholder middleware
 *
 * In production, integrate with a virus scanning service:
 * - ClamAV (open source, self-hosted)
 * - VirusTotal API (cloud-based)
 * - AWS S3 Malware Protection
 * - Other commercial solutions
 *
 * Example integration with ClamAV:
 * ```typescript
 * import NodeClam from 'clamscan';
 *
 * const clamscan = await new NodeClam().init({
 *   clamdscan: {
 *     socket: '/var/run/clamav/clamd.ctl',
 *     timeout: 60000,
 *   },
 * });
 *
 * const { isInfected, viruses } = await clamscan.scanBuffer(file.buffer);
 * ```
 */
export function virusScanPlaceholder(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const file = req.file;

  if (!file || !file.buffer) {
    next();
    return;
  }

  // Placeholder: In production, implement actual virus scanning
  // For now, just check for suspiciously small executable-like content
  const suspiciousPatterns = [
    // Common malicious script patterns (simplified)
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

      res.status(400).json({
        error: 'File appears to be an executable and was rejected for security',
        code: 'SUSPICIOUS_FILE',
      });
      return;
    }
  }

  // TODO: Implement actual virus scanning in production
  // Example: await virusScanService.scan(file.buffer);

  next();
}

/**
 * Async virus scan middleware for production use
 * Replace the implementation with your actual virus scanning service
 */
export async function asyncVirusScan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const file = req.file;

  if (!file || !file.buffer) {
    next();
    return;
  }

  try {
    // TODO: Replace with actual virus scan implementation
    // Example with ClamAV:
    // const clamscan = getClamscanInstance();
    // const { isInfected, viruses } = await clamscan.scanBuffer(file.buffer);
    // if (isInfected) {
    //   console.warn('[UploadMiddleware] Virus detected:', viruses);
    //   res.status(400).json({
    //     error: 'File contains malware',
    //     code: 'MALWARE_DETECTED',
    //   });
    //   return;
    // }

    // Placeholder: simulate scan delay
    // await new Promise(resolve => setTimeout(resolve, 10));

    next();
  } catch (error) {
    console.error('[UploadMiddleware] Virus scan error:', error);
    // Fail safe: reject file if scan fails
    res.status(500).json({
      error: 'File security check failed',
      code: 'SCAN_ERROR',
    });
  }
}

// =============================================================================
// Size Validation Helpers
// =============================================================================

/**
 * Create a file size validator middleware
 */
export function validateFileSize(maxSizeBytes: number): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;

    if (!file) {
      next();
      return;
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

      res.status(400).json({
        error: `File too large. Maximum size is ${maxSizeMB}MB, but file is ${fileSizeMB}MB`,
        code: 'FILE_TOO_LARGE',
        maxSize: maxSizeBytes,
        fileSize: file.size,
      });
      return;
    }

    next();
  };
}

/**
 * Create a MIME type validator middleware
 */
export function validateMimeType(allowedTypes: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;

    if (!file) {
      next();
      return;
    }

    if (!allowedTypes.includes(file.mimetype)) {
      res.status(400).json({
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE',
        allowedTypes,
        receivedType: file.mimetype,
      });
      return;
    }

    next();
  };
}

export default {
  createSingleUpload,
  createMultipleUpload,
  createDiskUpload,
  requireFile,
  requireFiles,
  uploadImage,
  uploadDocument,
  uploadImages,
  validateFileContent,
  validateFilesContent,
  virusScanPlaceholder,
  asyncVirusScan,
  validateFileSize,
  validateMimeType,
};
