import { Router, Request, Response } from 'express';
import {
  createSingleUpload,
  createMultipleUpload,
  requireFile,
  requireFiles,
} from '../middleware/upload.middleware';
import { getStorageService } from '../services/storage.service';

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
// Router Setup
// =============================================================================

const router = Router();
const storage = getStorageService();

// =============================================================================
// Single File Upload
// =============================================================================

/**
 * POST /upload
 * Upload a single file
 */
router.post(
  '/',
  createSingleUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ],
  }),
  requireFile,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file!;
      const folder = (req.query.folder as string) || undefined;
      const isPublic = req.query.public === 'true';

      const result = await storage.upload(file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        folder,
        isPublic,
      });

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error || 'Upload failed',
        } as UploadResponse);
        return;
      }

      res.json({
        success: true,
        file: {
          key: result.key!,
          url: result.url!,
          size: result.size!,
          contentType: result.contentType!,
          originalName: file.originalname,
        },
      } as UploadResponse);
    } catch (error) {
      console.error('[UploadRoutes] Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as UploadResponse);
    }
  }
);

// =============================================================================
// Multiple Files Upload
// =============================================================================

/**
 * POST /upload/multiple
 * Upload multiple files (max 10)
 */
router.post(
  '/multiple',
  createMultipleUpload({
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 10,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ],
  }),
  requireFiles,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      const folder = (req.query.folder as string) || undefined;
      const isPublic = req.query.public === 'true';

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
        res.status(500).json({
          success: false,
          error: errors.join('; '),
        } as UploadResponse);
        return;
      }

      res.json({
        success: true,
        files: uploadedFiles,
        ...(errors.length > 0 && { partialErrors: errors }),
      });
    } catch (error) {
      console.error('[UploadRoutes] Multiple upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as UploadResponse);
    }
  }
);

// =============================================================================
// Get Signed URL
// =============================================================================

/**
 * GET /upload/signed-url/:key
 * Get a signed URL for a private file
 */
router.get('/signed-url/*', async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params[0];

    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }

    const exists = await storage.exists(key);
    if (!exists) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const expiresIn = parseInt(req.query.expires as string) || 3600;
    const url = await storage.getSignedUrl(key, expiresIn);

    res.json({
      success: true,
      url,
      expiresIn,
    });
  } catch (error) {
    console.error('[UploadRoutes] Signed URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// =============================================================================
// Get Presigned Upload URL
// =============================================================================

/**
 * POST /upload/presigned
 * Get a presigned URL for direct client-side upload
 */
router.post('/presigned', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, contentType, folder } = req.body;

    if (!filename || !contentType) {
      res.status(400).json({
        error: 'filename and contentType are required',
      });
      return;
    }

    // Generate a unique key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const ext = filename.split('.').pop() || '';
    const key = folder
      ? `${folder}/${timestamp}-${random}.${ext}`
      : `${timestamp}-${random}.${ext}`;

    const expiresIn = parseInt(req.query.expires as string) || 3600;
    const url = await storage.getUploadUrl(key, contentType, expiresIn);

    res.json({
      success: true,
      key,
      uploadUrl: url,
      expiresIn,
    });
  } catch (error) {
    console.error('[UploadRoutes] Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// =============================================================================
// Delete File
// =============================================================================

/**
 * DELETE /upload/:key
 * Delete a file
 */
router.delete('/*', async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params[0];

    if (!key) {
      res.status(400).json({ error: 'File key is required' });
      return;
    }

    const exists = await storage.exists(key);
    if (!exists) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const deleted = await storage.delete(key);

    if (!deleted) {
      res.status(500).json({ error: 'Failed to delete file' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[UploadRoutes] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// =============================================================================
// List Files
// =============================================================================

/**
 * GET /upload/list
 * List files in a folder
 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const prefix = (req.query.prefix as string) || '';
    const limit = parseInt(req.query.limit as string) || 100;
    const cursor = req.query.cursor as string | undefined;

    const result = await storage.list(prefix, limit, cursor);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[UploadRoutes] List error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

export default router;
