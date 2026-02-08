import { Response, NextFunction } from "express";
import { contactService } from "../services/contact.service";
import { successResponse, paginatedResponse } from "../utils/response";
import { z } from "zod";
import { AppRequest } from "../types";
import { ContactMessageStatus } from "@prisma/client";

// ============================================================================
// Validation Schemas
// ============================================================================

const createContactMessageSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),
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

const getContactMessagesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
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
  async submit(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const validated = createContactMessageSchema.parse(req.body);
      const message = await contactService.create(validated);

      res.status(201).json(
        successResponse(
          {
            id: message.id,
            createdAt: message.createdAt,
          },
          "Thank you for your message. We will get back to you soon."
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all contact messages (admin only)
   * GET /api/v1/admin/contact-messages
   */
  async getAll(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const params = getContactMessagesSchema.parse(req.query);
      const result = await contactService.getAll(params);

      res.json(
        paginatedResponse(
          result.items,
          result.pagination.page,
          result.pagination.limit,
          result.pagination.total
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single contact message (admin only)
   * GET /api/v1/admin/contact-messages/:id
   */
  async getById(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const message = await contactService.getById(id);

      res.json(successResponse({ message }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update contact message status (admin only)
   * PATCH /api/v1/admin/contact-messages/:id
   */
  async update(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const validated = updateContactMessageSchema.parse(req.body);
      const message = await contactService.update(id, validated);

      res.json(successResponse({ message }, "Message updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a contact message (admin only)
   * DELETE /api/v1/admin/contact-messages/:id
   */
  async delete(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await contactService.delete(id);

      res.json(successResponse(null, "Message deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread message count (admin only)
   * GET /api/v1/admin/contact-messages/unread-count
   */
  async getUnreadCount(req: AppRequest, res: Response, next: NextFunction) {
    try {
      const count = await contactService.getUnreadCount();

      res.json(successResponse({ count }));
    } catch (error) {
      next(error);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const contactController = new ContactController();
