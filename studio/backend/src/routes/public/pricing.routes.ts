import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../../config/db.js";
import { sendSuccess } from "../../utils/response.js";
import { ApiError } from "../../utils/errors.js";

// Parameter validation schemas
const slugParamSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_.]+$/),
});

// Request body validation schemas
const calculatePriceSchema = z.object({
  tier: z.string().min(1).max(50),
  templateId: z.string().max(100).optional(),
  selectedFeatures: z.array(z.string().max(100)).max(100),
  couponCode: z.string().max(50).optional(),
});

const routePlugin: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/pricing/tiers
   * List all active pricing tiers
   */
  fastify.get("/tiers", async (_req: FastifyRequest, reply: FastifyReply) => {
    const tiers = await prisma.pricingTier.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        price: true,
        includedFeatures: true,
        isPopular: true,
        displayOrder: true,
        color: true,
        isActive: true,
      },
    });

    return sendSuccess(reply, { items: tiers });
  });

  /**
   * GET /api/pricing/tiers/:slug
   * Get single tier by slug with feature details
   */
  fastify.get("/tiers/:slug", async (req: FastifyRequest, reply: FastifyReply) => {
    // Validate slug parameter
    const paramResult = slugParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      throw ApiError.validation(paramResult.error.flatten().fieldErrors);
    }

    const tier = await prisma.pricingTier.findFirst({
      where: {
        slug: paramResult.data.slug,
        isActive: true,
      },
    });

    if (!tier) {
      throw ApiError.notFound("Pricing tier");
    }

    // Get feature details for included features
    const features = await prisma.feature.findMany({
      where: {
        slug: { in: tier.includedFeatures },
        isActive: true,
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
          },
        },
      },
    });

    return sendSuccess(reply, {
      ...tier,
      features,
    });
  });

  /**
   * POST /api/pricing/calculate
   * Calculate price for a configuration
   */
  fastify.post("/calculate", async (req: FastifyRequest, reply: FastifyReply) => {
    // Validate request body
    const parseResult = calculatePriceSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw ApiError.validation(parseResult.error.flatten().fieldErrors);
    }
    const input = parseResult.data;

    // Get tier
    const tier = await prisma.pricingTier.findFirst({
      where: {
        slug: input.tier,
        isActive: true,
      },
    });

    if (!tier) {
      throw ApiError.badRequest("Invalid tier");
    }

    // Get features with prices
    const features = await prisma.feature.findMany({
      where: {
        slug: { in: input.selectedFeatures },
        isActive: true,
      },
      select: {
        slug: true,
        name: true,
        price: true,
      },
    });

    // Calculate tier price
    const tierPrice = tier.price;

    // Calculate add-on features price (features not included in tier)
    const tierIncludedSet = new Set(tier.includedFeatures);
    let featuresPrice = 0;
    const addOnFeatures: { slug: string; name: string; price: number }[] = [];

    for (const feature of features) {
      if (!tierIncludedSet.has(feature.slug)) {
        featuresPrice += feature.price;
        addOnFeatures.push(feature);
      }
    }

    // Calculate subtotal
    const subtotal = tierPrice + featuresPrice;

    // Get active bundle discounts
    const bundles = await prisma.bundleDiscount.findMany({
      where: { isActive: true },
    });

    // Calculate bundle discounts
    const bundleDiscounts: { id: string; name: string; type: string; value: number; amount: number }[] = [];
    const selectedSet = new Set(input.selectedFeatures);

    for (const bundle of bundles) {
      // Check tier applicability
      if (bundle.applicableTiers.length > 0 && !bundle.applicableTiers.includes(input.tier)) {
        continue;
      }

      // Check minimum items (features)
      if (bundle.minItems && input.selectedFeatures.length < bundle.minItems) {
        continue;
      }

      // Check applicable features (if specified, at least one must be selected)
      if (bundle.applicableFeatures.length > 0) {
        const hasAny = bundle.applicableFeatures.some((f: string) => selectedSet.has(f));
        if (!hasAny) {
          continue;
        }
      }

      // Check dates
      const now = new Date();
      if (bundle.startsAt && new Date(bundle.startsAt) > now) {
        continue;
      }
      if (bundle.expiresAt && new Date(bundle.expiresAt) < now) {
        continue;
      }

      // Calculate discount
      let amount = 0;
      if (bundle.type === "PERCENTAGE") {
        amount = Math.round(subtotal * (bundle.value / 100));
      } else {
        amount = bundle.value;
      }

      bundleDiscounts.push({
        id: bundle.id,
        name: bundle.name,
        type: "bundle",
        value: bundle.value,
        amount,
      });
    }

    // Calculate total discount
    const bundleDiscountTotal = bundleDiscounts.reduce((sum, d) => sum + d.amount, 0);

    // Coupon validation (simplified)
    let couponDiscount: { id: string; name: string; type: string; value: number; amount: number } | undefined;

    if (input.couponCode) {
      const coupon = await prisma.studioCoupon.findFirst({
        where: {
          code: input.couponCode.toUpperCase(),
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
      });

      if (coupon) {
        // Check usage limit
        const usageOk = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        // Check minimum purchase amount
        const minPurchaseOk = !coupon.minPurchase || subtotal >= coupon.minPurchase;

        if (usageOk && minPurchaseOk) {
          let amount = 0;
          if (coupon.type === "PERCENTAGE") {
            amount = Math.round(subtotal * (coupon.value / 100));
          } else {
            amount = coupon.value;
          }

          couponDiscount = {
            id: coupon.id,
            name: coupon.code,
            type: "coupon",
            value: coupon.value,
            amount,
          };
        }
      }
    }

    const totalDiscount = bundleDiscountTotal + (couponDiscount?.amount || 0);

    // Calculate tax (could be configurable)
    const taxRate = 0; // No tax for now
    const taxableAmount = subtotal - totalDiscount;
    const tax = Math.round(taxableAmount * taxRate);

    // Calculate final total
    const total = Math.max(0, taxableAmount + tax);

    return sendSuccess(reply, {
      tierPrice,
      featuresPrice,
      subtotal,
      bundleDiscounts,
      couponDiscount,
      totalDiscount,
      tax,
      total,
      currency: "USD",
      breakdown: {
        tier: {
          slug: tier.slug,
          name: tier.name,
          price: tierPrice,
          includedCount: tier.includedFeatures.length,
        },
        addOnFeatures,
        addOnCount: addOnFeatures.length,
      },
    });
  });
};

export { routePlugin as publicPricingRoutes };
