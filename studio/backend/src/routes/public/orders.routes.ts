import crypto from "crypto";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import {
  generateDownloadPackage,
  getOrderDetails,
  ensureLicenseExists,
} from "../../services/download.service.js";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

// Parameter validation schemas
const orderIdParamSchema = z.object({
  id: z.string().min(1).max(50),
});

/**
 * Validate the download token query parameter against the order's license.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function validateDownloadToken(
  token: unknown,
  license: { downloadToken: string } | null
): void {
  if (!token || typeof token !== "string") {
    throw ApiError.forbidden("Invalid or missing download token");
  }

  if (!license || !license.downloadToken) {
    throw ApiError.forbidden("Invalid or missing download token");
  }

  const providedBuffer = Buffer.from(token);
  const actualBuffer = Buffer.from(license.downloadToken);
  if (
    providedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, actualBuffer)
  ) {
    throw ApiError.forbidden("Invalid or missing download token");
  }
}

/**
 * Mask license key for display (show first and last segments)
 */
function maskLicenseKey(licenseKey: string): string {
  const parts = licenseKey.split("-");
  if (parts.length < 2) {
    return licenseKey;
  }
  const masked = parts.map((part, index) => {
    if (index === 0 || index === parts.length - 1) {
      return part;
    }
    return "*".repeat(part.length);
  });
  return masked.join("-");
}

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/orders/:id
   * Get order details for success page
   * Requires valid download token as query parameter
   */
  fastify.get("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    // Validate id parameter
    const paramResult = orderIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }

    const order = await getOrderDetails(paramResult.data.id);

    // Validate download token
    validateDownloadToken((req.query as Record<string, string>).token, order.license);

    // For security, don't expose the full license key to the public endpoint
    const safeOrder = {
      ...order,
      license: order.license
        ? {
            id: order.license.id,
            status: order.license.status,
            downloadCount: order.license.downloadCount,
            maxDownloads: order.license.maxDownloads,
            // Only show masked license key
            licenseKey: maskLicenseKey(order.license.licenseKey),
          }
        : null,
    };

    return sendSuccess(reply, safeOrder);
  });

  /**
   * GET /api/orders/:id/download
   * Generate and return ZIP file for download
   * Requires valid download token as query parameter
   */
  fastify.get("/:id/download", async (req: FastifyRequest, reply: FastifyReply) => {
    // Validate id parameter
    const paramResult = orderIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }

    const orderId = paramResult.data.id;

    // Ensure license exists before download
    await ensureLicenseExists(orderId);

    // Get order details for filename and token validation
    const order = await getOrderDetails(orderId);

    // Validate download token
    validateDownloadToken((req.query as Record<string, string>).token, order.license);

    // Check if order is completed
    if (order.status !== "COMPLETED") {
      throw ApiError.badRequest("Order must be completed to download");
    }

    // Set response headers for ZIP download
    const filename = `xitolaunch-${order.tier}-${order.orderNumber}.zip`;
    reply.header("Content-Type", "application/zip");
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);
    reply.header("Cache-Control", "no-cache, no-store, must-revalidate");
    reply.header("Pragma", "no-cache");
    reply.header("Expires", "0");

    // Generate and stream the ZIP file using the raw response stream
    await generateDownloadPackage(orderId, reply.raw);
  });

  /**
   * POST /api/orders/:id/generate-license
   * Generate license key if not already generated
   * Called when order is completed
   * Requires valid download token as query parameter
   */
  fastify.post("/:id/generate-license", async (req: FastifyRequest, reply: FastifyReply) => {
    // Validate id parameter
    const paramResult = orderIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }

    const licenseKey = await ensureLicenseExists(paramResult.data.id);

    // Get order to validate token
    const order = await getOrderDetails(paramResult.data.id);

    // Validate download token
    validateDownloadToken((req.query as Record<string, string>).token, order.license);

    return sendSuccess(reply, {
      licenseKey: maskLicenseKey(licenseKey),
      message: "License generated successfully",
    });
  });
};

export { routePlugin as publicOrdersRoutes };
