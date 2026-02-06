# File Upload Module

Production-ready file upload service with S3-compatible storage and local filesystem fallback.

## Features

- **S3 Storage**: Full AWS S3 support with presigned URLs
- **S3-Compatible**: Works with MinIO, Cloudflare R2, DigitalOcean Spaces
- **Local Fallback**: Filesystem storage for development
- **File Validation**: MIME type and extension checking
- **Size Limits**: Configurable max file sizes
- **Batch Upload**: Upload multiple files in one request
- **Presigned URLs**: Direct browser-to-S3 uploads
- **TypeScript**: Full type definitions

## Installation

1. Install dependencies in your backend:

```bash
cd core/backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer @types/multer
```

2. Copy the module files:

```bash
cp modules/file-upload/backend/src/services/storage.service.ts core/backend/src/services/
cp modules/file-upload/backend/src/middleware/upload.middleware.ts core/backend/src/middleware/
cp modules/file-upload/backend/src/routes/upload.routes.ts core/backend/src/routes/
```

3. Register routes in your app:

```typescript
import uploadRoutes from './routes/upload.routes';

app.use('/api/upload', uploadRoutes);
```

4. Add environment variables:

```env
# Storage type: 's3' or 'local'
STORAGE_TYPE=local

# For S3 storage
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=  # Optional: for S3-compatible services

# Upload limits
UPLOAD_MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

## API Endpoints

### Upload Single File

```http
POST /api/upload?folder=images&public=true
Content-Type: multipart/form-data

file: <binary>
```

Response:
```json
{
  "success": true,
  "file": {
    "key": "images/1234567890-abc123.jpg",
    "url": "https://bucket.s3.amazonaws.com/...",
    "size": 102400,
    "contentType": "image/jpeg",
    "originalName": "photo.jpg"
  }
}
```

### Upload Multiple Files

```http
POST /api/upload/multiple?folder=documents
Content-Type: multipart/form-data

files: <binary>
files: <binary>
```

### Get Signed URL (Private Files)

```http
GET /api/upload/signed-url/images/photo.jpg?expires=3600
```

### Get Presigned Upload URL (Direct Upload)

```http
POST /api/upload/presigned
Content-Type: application/json

{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "folder": "uploads"
}
```

### Delete File

```http
DELETE /api/upload/images/photo.jpg
```

### List Files

```http
GET /api/upload/list?prefix=images/&limit=50
```

## Usage Examples

### Backend Service Usage

```typescript
import { getStorageService } from './services/storage.service';

const storage = getStorageService();

// Upload from buffer
const result = await storage.upload(buffer, {
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
  folder: 'avatars',
  isPublic: true,
});

// Get signed URL for private file
const url = await storage.getSignedUrl('documents/private.pdf', 3600);

// Delete file
await storage.delete('uploads/old-file.jpg');
```

### Using Upload Middleware

```typescript
import { uploadImage, requireFile } from './middleware/upload.middleware';

router.post('/avatar', uploadImage, requireFile, async (req, res) => {
  const file = req.file!;
  // Process file.buffer
});
```

### Custom Middleware Configuration

```typescript
import { createSingleUpload } from './middleware/upload.middleware';

const uploadVideo = createSingleUpload({
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['video/mp4', 'video/webm'],
  fieldName: 'video',
});
```

## S3-Compatible Services

### MinIO

```env
STORAGE_TYPE=s3
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minio-access-key
S3_SECRET_ACCESS_KEY=minio-secret-key
S3_ENDPOINT=http://localhost:9000
```

### Cloudflare R2

```env
STORAGE_TYPE=s3
S3_BUCKET=my-bucket
S3_REGION=auto
S3_ACCESS_KEY_ID=r2-access-key
S3_SECRET_ACCESS_KEY=r2-secret-key
S3_ENDPOINT=https://account-id.r2.cloudflarestorage.com
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STORAGE_TYPE` | No | `local` | Storage type: `s3` or `local` |
| `S3_BUCKET` | For S3 | - | S3 bucket name |
| `S3_REGION` | For S3 | - | AWS region |
| `S3_ACCESS_KEY_ID` | For S3 | - | AWS access key (optional with IAM roles) |
| `S3_SECRET_ACCESS_KEY` | For S3 | - | AWS secret key (optional with IAM roles) |
| `S3_ENDPOINT` | No | - | Custom S3 endpoint for compatible services |
| `UPLOAD_MAX_FILE_SIZE` | No | 10MB | Max file size in bytes |
| `UPLOAD_ALLOWED_TYPES` | No | images,pdf | Comma-separated MIME types |

## Pricing Suggestion

$500-800 for full integration including:
- S3 bucket setup and configuration
- Upload UI components
- Image optimization pipeline
- CDN configuration
