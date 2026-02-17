import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  parseSingleFile,
  parseMultipleFiles,
  validateFileContent,
  virusScanFile,
} from '../middleware/upload.middleware.js';
import { getStorageService } from '../services/storage.service.js';

// =============================================================================
// Auth Middleware Import
// =============================================================================
// Import from core backend - adjust path based on your project structure
// If using as a standalone module, you may need to adjust the import path
import {
  authMiddleware,
  optionalAuthMiddleware,
  AuthenticatedRequest,
} from '../../../../core/backend/src/middleware/auth.middleware.js';

// =============================================================================
// Types
// =============================================================================

interface UploadedFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
  originalName: string;
}

interface UploadResponse {
  success: boolean;
  file?: UploadedFile;
  files?: UploadedFile[];
  error?: string;
}

// =============================================================================
// Routes Plugin
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  const storage = getStorageService();

  // ===========================================================================
  // Single File Upload
  // ===========================================================================

  /**
   * POST /upload
   * Upload a single file (requires authentication)
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const folder = query.folder || undefined;
    const isPublic = query.public === 'true';

    const file = await parseSingleFile(req, {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
      ],
    });

    // Validate file content
    const contentValidation = validateFileContent(file);
    if (!contentValidation.valid) {
      return reply.code(400).send({
        error: contentValidation.error,
        code: 'INVALID_FILE_CONTENT',
      });
    }

    // Virus scan
    const scanResult = virusScanFile(file);
    if (!scanResult.safe) {
      return reply.code(400).send({
        error: scanResult.error,
        code: 'SUSPICIOUS_FILE',
      });
    }

    const result = await storage.upload(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      folder,
      isPublic,
    });

    if (!result.success) {
      return reply.code(500).send({
        success: false,
        error: result.error || 'Upload failed',
      } as UploadResponse);
    }

    return reply.send({
      success: true,
      file: {
        key: result.key!,
        url: result.url!,
        size: result.size!,
        contentType: result.contentType!,
        originalName: file.originalname,
      },
    } as UploadResponse);
  });

  // ===========================================================================
  // Public Single File Upload (Optional Auth)
  // ===========================================================================

  /**
   * POST /upload/public
   * Upload a single file to public storage (optional authentication)
   * Use this for public-facing uploads like profile pictures
   */
  fastify.post('/public', { preHandler: [optionalAuthMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;

    const file = await parseSingleFile(req, {
      maxFileSize: 5 * 1024 * 1024, // 5MB for public uploads
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
    });

    // Validate file content
    const contentValidation = validateFileContent(file);
    if (!contentValidation.valid) {
      return reply.code(400).send({
        error: contentValidation.error,
        code: 'INVALID_FILE_CONTENT',
      });
    }

    // Virus scan
    const scanResult = virusScanFile(file);
    if (!scanResult.safe) {
      return reply.code(400).send({
        error: scanResult.error,
        code: 'SUSPICIOUS_FILE',
      });
    }

    const folder = 'public';

    const result = await storage.upload(file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      folder: userId ? `${folder}/${userId}` : folder,
      isPublic: true,
      metadata: userId ? { uploadedBy: userId } : undefined,
    });

    if (!result.success) {
      return reply.code(500).send({
        success: false,
        error: result.error || 'Upload failed',
      } as UploadResponse);
    }

    return reply.send({
      success: true,
      file: {
        key: result.key!,
        url: result.url!,
        size: result.size!,
        contentType: result.contentType!,
        originalName: file.originalname,
      },
    } as UploadResponse);
  });

  // ===========================================================================
  // Multiple Files Upload
  // ===========================================================================

  /**
   * POST /upload/multiple
   * Upload multiple files (max 10, requires authentication)
   */
  fastify.post('/multiple', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const folder = query.folder || undefined;
    const isPublic = query.public === 'true';

    const files = await parseMultipleFiles(req, {
      maxFileSize: 10 * 1024 * 1024,
      maxFiles: 10,
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
      ],
    });

    if (files.length === 0) {
      return reply.code(400).send({ error: 'No files uploaded' });
    }

    const uploadedFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const result = await storage.upload(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        folder,
        isPublic,
      });

      if (result.success) {
        uploadedFiles.push({
          key: result.key!,
          url: result.url!,
          size: result.size!,
          contentType: result.contentType!,
          originalName: file.originalname,
        });
      } else {
        errors.push(`Failed to upload ${file.originalname}: ${result.error}`);
      }
    }

    if (uploadedFiles.length === 0) {
      return reply.code(500).send({
        success: false,
        error: errors.join('; '),
      } as UploadResponse);
    }

    return reply.send({
      success: true,
      files: uploadedFiles,
      ...(errors.length > 0 && { partialErrors: errors }),
    });
  });

  // ===========================================================================
  // Get Signed URL
  // ===========================================================================

  /**
   * GET /upload/signed-url/*
   * Get a signed URL for a private file (requires authentication)
   */
  fastify.get('/signed-url/*', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const key = (req.params as Record<string, string>)['*'];

    if (!key) {
      return reply.code(400).send({ error: 'File key is required' });
    }

    const exists = await storage.exists(key);
    if (!exists) {
      return reply.code(404).send({ error: 'File not found' });
    }

    const query = req.query as Record<string, string>;
    const expiresIn = parseInt(query.expires) || 3600;
    const url = await storage.getSignedUrl(key, expiresIn);

    return reply.send({
      success: true,
      url,
      expiresIn,
    });
  });

  // ===========================================================================
  // Get Presigned Upload URL
  // ===========================================================================

  /**
   * POST /upload/presigned
   * Get a presigned URL for direct client-side upload (requires authentication)
   */
  fastify.post('/presigned', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { filename, contentType, folder } = req.body as { filename: string; contentType: string; folder?: string };

    if (!filename || !contentType) {
      return reply.code(400).send({
        error: 'filename and contentType are required',
      });
    }

    // Generate a unique key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const ext = filename.split('.').pop() || '';
    const key = folder
      ? `${folder}/${timestamp}-${random}.${ext}`
      : `${timestamp}-${random}.${ext}`;

    const query = req.query as Record<string, string>;
    const expiresIn = parseInt(query.expires) || 3600;
    const url = await storage.getUploadUrl(key, contentType, expiresIn);

    return reply.send({
      success: true,
      key,
      uploadUrl: url,
      expiresIn,
    });
  });

  // ===========================================================================
  // Delete File
  // ===========================================================================

  /**
   * DELETE /upload/*
   * Delete a file (requires authentication)
   */
  fastify.delete('/*', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const key = (req.params as Record<string, string>)['*'];

    if (!key) {
      return reply.code(400).send({ error: 'File key is required' });
    }

    const exists = await storage.exists(key);
    if (!exists) {
      return reply.code(404).send({ error: 'File not found' });
    }

    const deleted = await storage.delete(key);

    if (!deleted) {
      return reply.code(500).send({ error: 'Failed to delete file' });
    }

    return reply.send({ success: true });
  });

  // ===========================================================================
  // List Files
  // ===========================================================================

  /**
   * GET /upload/list
   * List files in a folder (requires authentication)
   */
  fastify.get('/list', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as Record<string, string>;
    const prefix = query.prefix || '';
    const limit = parseInt(query.limit) || 100;
    const cursor = query.cursor || undefined;

    const result = await storage.list(prefix, limit, cursor);

    return reply.send({
      success: true,
      ...result,
    });
  });
};

export default routes;
