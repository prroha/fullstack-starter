import { FastifyRequest, FastifyReply } from "fastify";
import { contactService } from "../services/contact.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";
import { z } from "zod";
import { ContactMessageStatus } from "@prisma/client";
import { emailSchema, paginationSchema } from "../utils/validation-schemas.js";
import { sendCsvExport } from "../utils/controller-helpers.js";

// ============================================================================
// Validation Schemas
// ============================================================================

const createContactMessageSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: emailSchema.pipe(z.string().max(255, "Email must be less than 255 characters")),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be less than 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be less than 5000 characters"),
});

const updateContactMessageSchema = z.object({
  status: z.nativeEnum(ContactMessageStatus).optional(),
});

const getContactMessagesSchema = paginationSchema.extend({
  status: z.nativeEnum(ContactMessageStatus).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ============================================================================
// Controller Class
// ============================================================================

class ContactController {
  /**
   * Submit a contact form message (public endpoint)
   * POST /api/v1/contact
   */
  async submit(req: FastifyRequest, reply: FastifyReply) {
    const validated = createContactMessageSchema.parse(req.body);
    const message = await contactService.create(validated);

    return reply.code(201).send(
      successResponse(
        {
          id: message.id,
          createdAt: message.createdAt,
        },
        "Thank you for your message. We will get back to you soon."
      )
    );
  }

  /**
   * Get all contact messages (admin only)
   * GET /api/v1/admin/contact-messages
   */
  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const params = getContactMessagesSchema.parse(req.query);
    const result = await contactService.getAll(params);

    return reply.send(
      paginatedResponse(
        result.items,
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total
      )
    );
  }

  /**
   * Get a single contact message (admin only)
   * GET /api/v1/admin/contact-messages/:id
   */
  async getById(req: FastifyRequest, reply: FastifyReply) {
    const id = (req.params as Record<string, string>).id;
    const message = await contactService.getById(id);

    return reply.send(successResponse({ message }));
  }

  /**
   * Update contact message status (admin only)
   * PATCH /api/v1/admin/contact-messages/:id
   */
  async update(req: FastifyRequest, reply: FastifyReply) {
    const id = (req.params as Record<string, string>).id;
    const validated = updateContactMessageSchema.parse(req.body);
    const message = await contactService.update(id, validated);

    return reply.send(successResponse({ message }, "Message updated successfully"));
  }

  /**
   * Delete a contact message (admin only)
   * DELETE /api/v1/admin/contact-messages/:id
   */
  async delete(req: FastifyRequest, reply: FastifyReply) {
    const id = (req.params as Record<string, string>).id;
    await contactService.delete(id);

    return reply.send(successResponse(null, "Message deleted successfully"));
  }

  /**
   * Get unread message count (admin only)
   * GET /api/v1/admin/contact-messages/unread-count
   */
  async getUnreadCount(req: FastifyRequest, reply: FastifyReply) {
    const count = await contactService.getUnreadCount();

    return reply.send(successResponse({ count }));
  }

  /**
   * Export all contact messages as CSV (admin only)
   * GET /api/v1/admin/contact-messages/export
   */
  async exportMessages(req: FastifyRequest, reply: FastifyReply) {
    const messages = await contactService.getAllForExport();

    sendCsvExport(reply, messages, [
      { header: "ID", accessor: "id" },
      { header: "Name", accessor: "name" },
      { header: "Email", accessor: "email" },
      { header: "Subject", accessor: "subject" },
      { header: "Message", accessor: "message" },
      { header: "Status", accessor: "status" },
      { header: "Created At", accessor: (item) => item.createdAt.toISOString() },
      { header: "Updated At", accessor: (item) => item.updatedAt.toISOString() },
    ], { filenamePrefix: "contact-messages-export" });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const contactController = new ContactController();
