import multer, { FileFilterCallback, type Multer, type StorageEngine } from 'multer';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as path from 'path';
import * as crypto from 'crypto';

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

export default {
  createSingleUpload,
  createMultipleUpload,
  createDiskUpload,
  requireFile,
  requireFiles,
  uploadImage,
  uploadDocument,
  uploadImages,
};
