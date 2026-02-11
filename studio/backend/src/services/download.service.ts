/**
 * Download Service
 *
 * Handles license management and order validation for downloads.
 * Uses ProjectGenerator for actual code generation.
 */

import { Writable } from "stream";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/errors.js";
import { ProjectGenerator, OrderDetails } from "./generator.service.js";

// =====================================================
// Types
// =====================================================

interface OrderWithDetails {
  id: string;
  orderNumber: string;
  tier: string;
  selectedFeatures: string[];
  customerEmail: string;
  customerName: string | null;
  total: number;
  template: {
    name: string;
    slug: string;
    includedFeatures: string[];
  } | null;
  license: {
    id: string;
    licenseKey: string;
    downloadToken: string;
    downloadCount: number;
    maxDownloads: number;
    status: string;
    expiresAt: Date | null;
  } | null;
}

// =====================================================
// License Management
// =====================================================

/**
 * Generate a license key if not already generated
 */
export async function ensureLicenseExists(orderId: string): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { license: true },
  });

  if (!order) {
    throw ApiError.notFound("Order");
  }

  if (order.status !== "COMPLETED") {
    throw ApiError.badRequest("Order must be completed to generate license");
  }

  if (order.license) {
    return order.license.licenseKey;
  }

  // Generate new license
  const { v4: uuid } = await import("uuid");
  const licenseKey = generateLicenseKey();
  const downloadToken = uuid();

  await prisma.license.create({
    data: {
      orderId,
      licenseKey,
      downloadToken,
      expiresAt: null, // Lifetime license
      maxDownloads: 10,
    },
  });

  return licenseKey;
}

/**
 * Generate a formatted license key
 */
function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = 4;
  const segmentLength = 5;
  const parts: string[] = [];

  for (let i = 0; i < segments; i++) {
    let segment = "";
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }

  return parts.join("-");
}

// =====================================================
// Order Validation
// =====================================================

/**
 * Validate order for download
 */
export async function validateOrderForDownload(
  orderId: string
): Promise<OrderWithDetails> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      template: {
        select: {
          name: true,
          slug: true,
          includedFeatures: true,
        },
      },
      license: true,
    },
  });

  if (!order) {
    throw ApiError.notFound("Order");
  }

  if (order.status !== "COMPLETED") {
    throw ApiError.badRequest("Order must be completed to download");
  }

  if (!order.license) {
    throw ApiError.badRequest("License not found. Please contact support.");
  }

  if (order.license.status !== "ACTIVE") {
    throw ApiError.badRequest(
      `License is ${order.license.status.toLowerCase()}. Please contact support.`
    );
  }

  if (order.license.expiresAt && new Date(order.license.expiresAt) < new Date()) {
    throw ApiError.badRequest("License has expired. Please contact support.");
  }

  if (
    order.license.maxDownloads &&
    order.license.downloadCount >= order.license.maxDownloads
  ) {
    throw ApiError.badRequest(
      "Maximum download limit reached. Please contact support to reset."
    );
  }

  return order as OrderWithDetails;
}

// =====================================================
// Download Package Generation
// =====================================================

/**
 * Generate download package as a ZIP stream
 * Uses ProjectGenerator to copy real code from /core/
 */
export async function generateDownloadPackage(
  orderId: string,
  outputStream: Writable
): Promise<void> {
  // Validate order and get details
  const order = await validateOrderForDownload(orderId);

  // Convert to OrderDetails format for generator
  const orderDetails: OrderDetails = {
    id: order.id,
    orderNumber: order.orderNumber,
    tier: order.tier,
    selectedFeatures: order.selectedFeatures,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    total: order.total,
    template: order.template,
    license: order.license,
  };

  // Create generator and generate project
  const generator = new ProjectGenerator();

  try {
    await generator.generate(orderDetails, outputStream);
  } catch (error) {
    console.error("Project generation failed:", error);
    throw ApiError.internal("Failed to generate project package");
  }

  // Increment download count
  await prisma.license.update({
    where: { id: order.license!.id },
    data: {
      downloadCount: { increment: 1 },
      lastDownloadAt: new Date(),
    },
  });
}

// =====================================================
// Order Details
// =====================================================

/**
 * Get order details for success page
 */
export async function getOrderDetails(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      license: {
        select: {
          id: true,
          licenseKey: true,
          downloadCount: true,
          maxDownloads: true,
          status: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!order) {
    throw ApiError.notFound("Order");
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    tier: order.tier,
    total: order.total,
    discount: order.discount,
    status: order.status,
    selectedFeatures: order.selectedFeatures,
    template: order.template,
    license: order.license,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
  };
}
