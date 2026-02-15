import { db } from "../lib/db.js";
import { ContactMessageStatus } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware.js";
import { logger } from "../lib/logger.js";

// ============================================================================
// Types
// ============================================================================

export interface CreateContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface UpdateContactMessageInput {
  status?: ContactMessageStatus;
}

export interface GetContactMessagesParams {
  page?: number;
  limit?: number;
  status?: ContactMessageStatus;
  search?: string;
  sortBy?: "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// Service Class
// ============================================================================

class ContactService {
  /**
   * Create a new contact message (public form submission)
   */
  async create(input: CreateContactMessageInput) {
    const message = await db.contactMessage.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        subject: input.subject.trim(),
        message: input.message.trim(),
        status: ContactMessageStatus.PENDING,
      },
    });

    logger.info("Contact message created", {
      messageId: message.id,
      email: message.email,
      subject: message.subject,
    });

    return message;
  }

  /**
   * Get all contact messages with pagination and filtering (admin only)
   */
  async getAll(params: GetContactMessagesParams) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      status?: ContactMessageStatus;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        subject?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute queries in parallel
    const [messages, total] = await Promise.all([
      db.contactMessage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.contactMessage.count({ where }),
    ]);

    return {
      items: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single contact message by ID (admin only)
   */
  async getById(id: string) {
    const message = await db.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw ApiError.notFound("Contact message not found");
    }

    return message;
  }

  /**
   * Update contact message status (admin only)
   */
  async update(id: string, input: UpdateContactMessageInput) {
    // Check if message exists
    const existing = await db.contactMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound("Contact message not found");
    }

    const message = await db.contactMessage.update({
      where: { id },
      data: {
        ...(input.status && { status: input.status }),
      },
    });

    logger.info("Contact message updated", {
      messageId: message.id,
      newStatus: message.status,
    });

    return message;
  }

  /**
   * Delete a contact message (admin only)
   */
  async delete(id: string) {
    // Check if message exists
    const existing = await db.contactMessage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound("Contact message not found");
    }

    await db.contactMessage.delete({
      where: { id },
    });

    logger.info("Contact message deleted", {
      messageId: id,
    });
  }

  /**
   * Get count of unread (pending) messages (admin only)
   */
  async getUnreadCount() {
    return db.contactMessage.count({
      where: { status: ContactMessageStatus.PENDING },
    });
  }

  /**
   * Get all contact messages for export (admin only)
   */
  async getAllForExport() {
    return db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const contactService = new ContactService();
