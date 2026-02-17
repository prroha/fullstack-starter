/**
 * FAQ Controller
 *
 * Handles HTTP requests for FAQ management.
 * Delegates business logic to faqService.
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../types/index.js";
import { faqService } from "../services/faq.service.js";
import { auditService } from "../services/audit.service.js";
import { successResponse } from "../utils/response.js";
import { z } from "zod";
import { slugSchema } from "../utils/validation-schemas.js";
import { validateOrRespond, sendCsvExport } from "../utils/controller-helpers.js";

// ============================================================================
// Validation Schemas
// ============================================================================

const faqCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema,
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const faqSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const reorderFaqsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    order: z.number().int().min(0),
  })).min(1, "At least one item is required"),
});

// ============================================================================
// Controller
// ============================================================================

export const faqController = {
  // ==========================================================================
  // FAQ Categories
  // ==========================================================================

  async getCategories(req: FastifyRequest, reply: FastifyReply) {
    const categories = await faqService.getCategories();
    return reply.send(successResponse({ categories }));
  },

  async createCategory(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const validated = validateOrRespond(faqCategorySchema, req.body, reply);
    if (!validated) return;

    const category = await faqService.createCategory(validated);

    await auditService.log({
      userId: authReq.user.userId,
      action: "CREATE",
      entity: "FaqCategory",
      entityId: category.id,
      changes: { new: validated },
      req,
    });

    return reply.code(201).send(successResponse({ category }));
  },

  async updateCategory(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const validated = validateOrRespond(faqCategorySchema.partial(), req.body, reply);
    if (!validated) return;

    const existing = await faqService.getCategoryById(id);
    const category = await faqService.updateCategory(id, validated);

    await auditService.log({
      userId: authReq.user.userId,
      action: "UPDATE",
      entity: "FaqCategory",
      entityId: id,
      changes: { old: existing, new: category },
      req,
    });

    return reply.send(successResponse({ category }));
  },

  async deleteCategory(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const existing = await faqService.deleteCategory(id);

    await auditService.log({
      userId: authReq.user.userId,
      action: "DELETE",
      entity: "FaqCategory",
      entityId: id,
      changes: { old: existing },
      req,
    });

    return reply.send(successResponse({ message: "Category deleted" }));
  },

  // ==========================================================================
  // FAQs
  // ==========================================================================

  async getFaqs(req: FastifyRequest, reply: FastifyReply) {
    const { categoryId, isActive } = req.query as Record<string, string | undefined>;

    const faqs = await faqService.getFaqs({
      categoryId: categoryId as string | undefined,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });

    return reply.send(successResponse({ faqs }));
  },

  async getFaq(req: FastifyRequest, reply: FastifyReply) {
    const id = (req.params as Record<string, string>).id;
    const faq = await faqService.getFaqById(id);
    return reply.send(successResponse({ faq }));
  },

  async createFaq(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const validated = validateOrRespond(faqSchema, req.body, reply);
    if (!validated) return;

    const faq = await faqService.createFaq(validated);

    await auditService.log({
      userId: authReq.user.userId,
      action: "CREATE",
      entity: "Faq",
      entityId: faq.id,
      changes: { new: validated },
      req,
    });

    return reply.code(201).send(successResponse({ faq }));
  },

  async updateFaq(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const validated = validateOrRespond(faqSchema.partial(), req.body, reply);
    if (!validated) return;

    const existing = await faqService.getFaqById(id);
    const faq = await faqService.updateFaq(id, validated);

    await auditService.log({
      userId: authReq.user.userId,
      action: "UPDATE",
      entity: "Faq",
      entityId: id,
      changes: { old: existing, new: faq },
      req,
    });

    return reply.send(successResponse({ faq }));
  },

  async deleteFaq(req: FastifyRequest, reply: FastifyReply) {
    const authReq = req as AuthenticatedRequest;
    const id = (req.params as Record<string, string>).id;
    const existing = await faqService.deleteFaq(id);

    await auditService.log({
      userId: authReq.user.userId,
      action: "DELETE",
      entity: "Faq",
      entityId: id,
      changes: { old: existing },
      req,
    });

    return reply.send(successResponse({ message: "FAQ deleted" }));
  },

  async reorderFaqs(req: FastifyRequest, reply: FastifyReply) {
    const validated = validateOrRespond(reorderFaqsSchema, req.body, reply);
    if (!validated) return;

    await faqService.reorderFaqs(validated.items);
    return reply.send(successResponse({ message: "FAQs reordered" }));
  },

  // ==========================================================================
  // Public endpoints (no auth required)
  // ==========================================================================

  async getPublicFaqs(req: FastifyRequest, reply: FastifyReply) {
    const { categorySlug } = req.query as Record<string, string | undefined>;
    const faqs = await faqService.getPublicFaqs(categorySlug as string | undefined);
    return reply.send(successResponse({ faqs }));
  },

  async getPublicCategories(req: FastifyRequest, reply: FastifyReply) {
    const categories = await faqService.getPublicCategories();
    return reply.send(successResponse({ categories }));
  },

  /**
   * Export all FAQs as CSV (admin only)
   * GET /api/v1/admin/faqs/export
   */
  async exportFaqs(req: FastifyRequest, reply: FastifyReply) {
    const faqs = await faqService.getAllForExport();

    sendCsvExport(reply, faqs, [
      { header: "ID", accessor: "id" },
      { header: "Category", accessor: (item) => item.category?.name || "" },
      { header: "Question", accessor: "question" },
      { header: "Answer", accessor: "answer" },
      { header: "Order", accessor: "order" },
      { header: "Active", accessor: "isActive" },
      { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
      { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
    ], { filenamePrefix: "faqs-export" });
  },
};
