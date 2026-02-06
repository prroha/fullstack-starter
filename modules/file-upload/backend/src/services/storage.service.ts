import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export type StorageType = 's3' | 'local';

export interface StorageConfig {
  type: StorageType;
  // S3 config
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3Endpoint?: string;
  // Local config
  localPath?: string;
  localBaseUrl?: string;
}

export interface UploadOptions {
  filename?: string;
  contentType?: string;
  folder?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  size?: number;
  contentType?: string;
  error?: string;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified?: Date;
  contentType?: string;
}

export interface ListResult {
  files: FileInfo[];
  nextCursor?: string;
  hasMore: boolean;
}

// =============================================================================
// Storage Service
// =============================================================================

export class StorageService {
  private type: StorageType;
  private s3Client: S3Client | null = null;
  private s3Bucket: string = '';
  private localPath: string = '';
  private localBaseUrl: string = '';

  constructor(config: StorageConfig) {
    this.type = config.type;

    if (this.type === 's3') {
      this.initS3(config);
    } else {
      this.initLocal(config);
    }
  }

  private initS3(config: StorageConfig): void {
    if (!config.s3Bucket) {
      throw new Error('S3_BUCKET is required for S3 storage');
    }
    if (!config.s3Region) {
      throw new Error('S3_REGION is required for S3 storage');
    }

    this.s3Bucket = config.s3Bucket;

    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: config.s3Region,
    };

    // Use credentials if provided (for non-IAM role based auth)
    if (config.s3AccessKeyId && config.s3SecretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey,
      };
    }

    // Custom endpoint for S3-compatible services (MinIO, R2, etc)
    if (config.s3Endpoint) {
      clientConfig.endpoint = config.s3Endpoint;
      clientConfig.forcePathStyle = true;
    }

    this.s3Client = new S3Client(clientConfig);
  }

  private initLocal(config: StorageConfig): void {
    this.localPath = config.localPath || './uploads';
    this.localBaseUrl = config.localBaseUrl || '/uploads';
  }

  // ===========================================================================
  // Upload
  // ===========================================================================

  /**
   * Upload a file from a Buffer
   */
  async upload(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const key = this.generateKey(options.filename, options.folder);
      const contentType = options.contentType || 'application/octet-stream';

      if (this.type === 's3') {
        return this.uploadToS3(buffer, key, contentType, options);
      } else {
        return this.uploadToLocal(buffer, key, contentType);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[StorageService] Upload error:', message);
      return { success: false, error: message };
    }
  }

  private async uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    if (!this.s3Client) {
      return { success: false, error: 'S3 client not initialized' };
    }

    const params: PutObjectCommandInput = {
      Bucket: this.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    };

    if (options.isPublic) {
      params.ACL = 'public-read';
    }

    if (options.metadata) {
      params.Metadata = options.metadata;
    }

    await this.s3Client.send(new PutObjectCommand(params));

    const url = options.isPublic
      ? this.getPublicUrl(key)
      : await this.getSignedUrl(key);

    return {
      success: true,
      key,
      url,
      size: buffer.length,
      contentType,
    };
  }

  private async uploadToLocal(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult> {
    const filePath = path.join(this.localPath, key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return {
      success: true,
      key,
      url: `${this.localBaseUrl}/${key}`,
      size: buffer.length,
      contentType,
    };
  }

  // ===========================================================================
  // Download / Read
  // ===========================================================================

  /**
   * Get a file as a Buffer
   */
  async getFile(key: string): Promise<Buffer | null> {
    try {
      if (this.type === 's3') {
        return this.getFileFromS3(key);
      } else {
        return this.getFileFromLocal(key);
      }
    } catch (error) {
      console.error('[StorageService] Get file error:', error);
      return null;
    }
  }

  private async getFileFromS3(key: string): Promise<Buffer | null> {
    if (!this.s3Client) return null;

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      })
    );

    if (!response.Body) return null;

    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  private async getFileFromLocal(key: string): Promise<Buffer | null> {
    const filePath = path.join(this.localPath, key);
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  // ===========================================================================
  // Signed URLs
  // ===========================================================================

  /**
   * Get a signed URL for temporary access to a private file
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.type === 'local') {
      return `${this.localBaseUrl}/${key}`;
    }

    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get a signed URL for uploading (presigned PUT)
   */
  async getUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (this.type === 'local') {
      throw new Error('Presigned uploads not supported for local storage');
    }

    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  /**
   * Delete a file
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.type === 's3') {
        return this.deleteFromS3(key);
      } else {
        return this.deleteFromLocal(key);
      }
    } catch (error) {
      console.error('[StorageService] Delete error:', error);
      return false;
    }
  }

  private async deleteFromS3(key: string): Promise<boolean> {
    if (!this.s3Client) return false;

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      })
    );

    return true;
  }

  private async deleteFromLocal(key: string): Promise<boolean> {
    const filePath = path.join(this.localPath, key);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // List / Exists
  // ===========================================================================

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.type === 's3') {
        if (!this.s3Client) return false;
        await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.s3Bucket,
            Key: key,
          })
        );
        return true;
      } else {
        const filePath = path.join(this.localPath, key);
        await fs.access(filePath);
        return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * List files in a folder
   */
  async list(
    prefix: string = '',
    limit: number = 100,
    cursor?: string
  ): Promise<ListResult> {
    if (this.type === 's3') {
      return this.listFromS3(prefix, limit, cursor);
    } else {
      return this.listFromLocal(prefix, limit);
    }
  }

  private async listFromS3(
    prefix: string,
    limit: number,
    cursor?: string
  ): Promise<ListResult> {
    if (!this.s3Client) {
      return { files: [], hasMore: false };
    }

    const response = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.s3Bucket,
        Prefix: prefix,
        MaxKeys: limit,
        ContinuationToken: cursor,
      })
    );

    const files: FileInfo[] = (response.Contents || []).map((obj) => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified,
    }));

    return {
      files,
      nextCursor: response.NextContinuationToken,
      hasMore: response.IsTruncated || false,
    };
  }

  private async listFromLocal(
    prefix: string,
    limit: number
  ): Promise<ListResult> {
    const dir = path.join(this.localPath, prefix);
    const files: FileInfo[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries.slice(0, limit)) {
        if (entry.isFile()) {
          const filePath = path.join(dir, entry.name);
          const stats = await fs.stat(filePath);
          files.push({
            key: path.join(prefix, entry.name),
            size: stats.size,
            lastModified: stats.mtime,
          });
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return {
      files,
      hasMore: false,
    };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private generateKey(filename?: string, folder?: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = filename ? path.extname(filename) : '';
    const name = `${timestamp}-${random}${ext}`;

    return folder ? `${folder}/${name}` : name;
  }

  private getPublicUrl(key: string): string {
    if (this.type === 'local') {
      return `${this.localBaseUrl}/${key}`;
    }
    return `https://${this.s3Bucket}.s3.amazonaws.com/${key}`;
  }
}

// =============================================================================
// Factory
// =============================================================================

let storageServiceInstance: StorageService | null = null;

/**
 * Get or create the storage service singleton
 */
export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    const type = (process.env.STORAGE_TYPE as StorageType) || 'local';

    storageServiceInstance = new StorageService({
      type,
      s3Bucket: process.env.S3_BUCKET,
      s3Region: process.env.S3_REGION,
      s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
      s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      s3Endpoint: process.env.S3_ENDPOINT,
      localPath: process.env.UPLOAD_LOCAL_PATH || './uploads',
      localBaseUrl: process.env.UPLOAD_BASE_URL || '/uploads',
    });
  }
  return storageServiceInstance;
}

/**
 * Create a custom storage service instance
 */
export function createStorageService(config: StorageConfig): StorageService {
  return new StorageService(config);
}

export default StorageService;
