import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Request } from "express";
import { ApiError } from "./error.middleware.js";
import { ErrorCodes } from "../utils/response.js";

// Allowed image types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const AVATAR_DIR = path.join(UPLOAD_DIR, "avatars");

// Ensure upload directories exist
function ensureUploadDirs(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  }
}

ensureUploadDirs();

// Configure storage
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as AllowedMimeType)) {
    cb(
      ApiError.badRequest(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
        ErrorCodes.INVALID_INPUT
      )
    );
    return;
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(
      ApiError.badRequest(
        `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
        ErrorCodes.INVALID_INPUT
      )
    );
    return;
  }

  cb(null, true);
};

// Avatar upload middleware
export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: imageFileFilter,
});

/**
 * Delete a file from the uploads directory
 */
export function deleteUploadedFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure the file is within the uploads directory (security)
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(UPLOAD_DIR)) {
      reject(new Error("Invalid file path"));
      return;
    }

    fs.unlink(normalizedPath, (err) => {
      if (err) {
        // Ignore if file doesn't exist
        if (err.code === "ENOENT") {
          resolve();
          return;
        }
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Get the full file path for an avatar filename
 */
export function getAvatarPath(filename: string): string {
  return path.join(AVATAR_DIR, path.basename(filename));
}

/**
 * Get the public URL path for an avatar
 */
export function getAvatarUrl(filename: string): string {
  return `/uploads/avatars/${path.basename(filename)}`;
}

// Export constants for use in other modules
export { UPLOAD_DIR, AVATAR_DIR, MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
