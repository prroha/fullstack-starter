import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter for images only
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png, and webp images are allowed"));
  }
};

// Configure multer with 5MB limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * POST /api/admin/uploads/image
 * Upload an image file
 */
router.post("/image", upload.single("image"), (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest("No image file provided");
    }

    const url = `/uploads/${req.file.filename}`;

    sendSuccess(res, { url }, "Image uploaded successfully", 201);
  } catch (error) {
    next(error);
  }
});

export { router as uploadsRoutes };
