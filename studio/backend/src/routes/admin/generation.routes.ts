import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";
import { emailService } from "../../services/email.service.js";
import crypto from "crypto";

const router = Router();

// Validation schema
const generateSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(100).optional(),
  tier: z.string().min(1),
  selectedFeatures: z.array(z.string()).min(1),
  templateId: z.string().optional().nullable(),
  sendEmail: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/admin/generate
 * Generate a project for a customer without payment
 */
router.post("/", async (req, res, next) => {
  try {
    const data = generateSchema.parse(req.body);

    // Get or create customer user
    let user = await prisma.studioUser.findUnique({
      where: { email: data.customerEmail },
    });

    if (!user) {
      user = await prisma.studioUser.create({
        data: {
          email: data.customerEmail,
          name: data.customerName || null,
          emailVerified: true,
        },
      });
    }

    // Get tier details
    const tier = await prisma.pricingTier.findUnique({
      where: { slug: data.tier },
    });

    if (!tier) {
      throw ApiError.badRequest("Invalid tier selected");
    }

    // Verify template exists if specified
    if (data.templateId) {
      const template = await prisma.template.findUnique({
        where: { id: data.templateId },
      });
      if (!template) {
        throw ApiError.badRequest("Invalid template selected");
      }
    }

    // Generate order number
    const orderNumber = `FS-M-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    // Create order (marked as completed, manual payment)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        customerEmail: data.customerEmail,
        customerName: data.customerName || null,
        tier: data.tier,
        templateId: data.templateId || null,
        selectedFeatures: data.selectedFeatures,
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        currency: "usd",
        status: "COMPLETED",
        paymentMethod: "manual",
        paidAt: new Date(),
      },
    });

    // Create license
    const licenseKey = `FS-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const downloadToken = crypto.randomBytes(32).toString("hex");

    const license = await prisma.license.create({
      data: {
        orderId: order.id,
        licenseKey,
        downloadToken,
        maxDownloads: 10,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    // Audit log
    await prisma.studioAuditLog.create({
      data: {
        adminId: req.user?.id,
        adminEmail: req.user?.email,
        action: "MANUAL_GENERATE",
        entityType: "order",
        entityId: order.id,
        newValues: {
          orderNumber,
          customerEmail: data.customerEmail,
          tier: data.tier,
          featuresCount: data.selectedFeatures.length,
          templateId: data.templateId,
          notes: data.notes,
        },
      },
    });

    // Send email if requested
    if (data.sendEmail && emailService.isConfigured()) {
      try {
        const downloadUrl = `${process.env.CORS_ORIGIN || "http://localhost:3002"}/download/${downloadToken}`;
        await emailService.sendOrderConfirmation({
          customerEmail: data.customerEmail,
          customerName: data.customerName || "Customer",
          orderNumber,
          tier: data.tier,
          tierName: tier.name,
          selectedFeatures: data.selectedFeatures,
          subtotal: 0,
          discount: 0,
          total: 0,
          licenseKey,
          downloadUrl,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the generation if email fails
      }
    }

    sendSuccess(res, {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        tier: order.tier,
        status: order.status,
        selectedFeatures: order.selectedFeatures,
        createdAt: order.createdAt,
      },
      license: {
        id: license.id,
        licenseKey: license.licenseKey,
        downloadToken: license.downloadToken,
        expiresAt: license.expiresAt,
      },
      downloadUrl: `/api/admin/orders/${order.id}/download`,
    }, "Project generated successfully", 201);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/generate/options
 * Get available options for generation (tiers, features, templates)
 */
router.get("/options", async (_req, res, next) => {
  try {
    const [tiers, features, templates] = await Promise.all([
      prisma.pricingTier.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          slug: true,
          name: true,
          price: true,
          includedFeatures: true,
        },
      }),
      prisma.feature.findMany({
        where: { isActive: true },
        orderBy: [{ module: { displayOrder: "asc" } }, { displayOrder: "asc" }],
        select: {
          slug: true,
          name: true,
          price: true,
          tier: true,
          requires: true,
          conflicts: true,
          module: {
            select: { name: true, slug: true, category: true },
          },
        },
      }),
      prisma.template.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          tier: true,
          includedFeatures: true,
        },
      }),
    ]);

    sendSuccess(res, { tiers, features, templates });
  } catch (error) {
    next(error);
  }
});

export { router as generationRoutes };
