import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const routePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyMultipart, {
    limits: { fileSize: MAX_FILE_SIZE },
  });

  /**
   * POST /api/admin/uploads/image
   * Upload an image file
   */
  fastify.post("/image", async (req: FastifyRequest, reply: FastifyReply) => {
    const file = await req.file();

    if (!file) {
      throw ApiError.badRequest("No image file provided");
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw ApiError.badRequest("Only jpg, jpeg, png, and webp images are allowed");
    }

    // Validate extension
    const ext = path.extname(file.filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw ApiError.badRequest("Only jpg, jpeg, png, and webp images are allowed");
    }

    // Read file buffer
    const buffer = await file.toBuffer();

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw ApiError.badRequest("File size must be less than 5MB");
    }

    // Generate unique filename
    const uniqueName = `${uuidv4()}${ext}`;
    const uploadsDir = path.join(process.cwd(), "uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write file to disk
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${uniqueName}`;

    return sendSuccess(reply, { url }, "Image uploaded successfully", 201);
  });
};

export { routePlugin as uploadsRoutes };
