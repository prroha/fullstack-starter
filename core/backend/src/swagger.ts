import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./config";

/**
 * Shared OpenAPI schemas - Single source of truth for all types
 * These schemas are used to generate TypeScript types for the frontend
 */
const sharedSchemas = {
  // =====================================================
  // ENUMS - Define once, use everywhere
  // =====================================================
  UserRole: {
    type: "string",
    enum: ["USER", "ADMIN", "SUPER_ADMIN"],
    description: "User role in the system",
  },
  ContactMessageStatus: {
    type: "string",
    enum: ["PENDING", "READ", "REPLIED"],
    description: "Contact message status",
  },
  NotificationType: {
    type: "string",
    enum: ["INFO", "SUCCESS", "WARNING", "ERROR", "SYSTEM"],
    description: "Notification type",
  },
  AnnouncementType: {
    type: "string",
    enum: ["INFO", "WARNING", "SUCCESS", "PROMO"],
    description: "Announcement type",
  },
  DiscountType: {
    type: "string",
    enum: ["PERCENTAGE", "FIXED"],
    description: "Coupon discount type",
  },
  OrderStatus: {
    type: "string",
    enum: ["PENDING", "COMPLETED", "REFUNDED", "FAILED"],
    description: "Order status",
  },
  PaymentMethod: {
    type: "string",
    enum: ["STRIPE", "PAYPAL", "MANUAL"],
    description: "Payment method",
  },
  AuditAction: {
    type: "string",
    enum: [
      "CREATE",
      "READ",
      "UPDATE",
      "DELETE",
      "LOGIN",
      "LOGOUT",
      "LOGIN_FAILED",
      "PASSWORD_CHANGE",
      "PASSWORD_RESET",
      "EMAIL_VERIFY",
      "ADMIN_ACTION",
    ],
    description: "Audit log action type",
  },
  SettingType: {
    type: "string",
    enum: ["STRING", "NUMBER", "BOOLEAN", "JSON"],
    description: "Setting value type",
  },

  // =====================================================
  // CORE MODELS
  // =====================================================
  User: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      name: { type: "string", nullable: true },
      role: { $ref: "#/components/schemas/UserRole" },
      emailVerified: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "email", "role"],
  },
  AdminUser: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      name: { type: "string", nullable: true },
      role: { $ref: "#/components/schemas/UserRole" },
      isActive: { type: "boolean" },
      emailVerified: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "email", "role", "isActive", "emailVerified"],
  },
  Session: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      visibleId: { type: "string", format: "uuid" },
      deviceName: { type: "string", nullable: true },
      browser: { type: "string", nullable: true },
      os: { type: "string", nullable: true },
      ipAddress: { type: "string", nullable: true },
      lastActiveAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      isCurrent: { type: "boolean" },
    },
  },

  // =====================================================
  // CONTACT & MESSAGING
  // =====================================================
  ContactMessage: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      email: { type: "string", format: "email" },
      subject: { type: "string" },
      message: { type: "string" },
      status: { $ref: "#/components/schemas/ContactMessageStatus" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "name", "email", "subject", "message", "status"],
  },
  Notification: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
      type: { $ref: "#/components/schemas/NotificationType" },
      title: { type: "string" },
      message: { type: "string" },
      data: { type: "object", nullable: true },
      read: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
    },
    required: ["id", "userId", "type", "title", "message", "read"],
  },

  // =====================================================
  // FAQ & CONTENT
  // =====================================================
  FaqCategory: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      slug: { type: "string" },
      order: { type: "integer" },
      isActive: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "name", "slug"],
  },
  Faq: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      categoryId: { type: "string", format: "uuid", nullable: true },
      question: { type: "string" },
      answer: { type: "string" },
      order: { type: "integer" },
      isActive: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      category: { $ref: "#/components/schemas/FaqCategory", nullable: true },
    },
    required: ["id", "question", "answer"],
  },
  Announcement: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string" },
      content: { type: "string" },
      type: { $ref: "#/components/schemas/AnnouncementType" },
      startDate: { type: "string", format: "date-time", nullable: true },
      endDate: { type: "string", format: "date-time", nullable: true },
      isActive: { type: "boolean" },
      isPinned: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "title", "content", "type"],
  },
  ContentPage: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      slug: { type: "string" },
      title: { type: "string" },
      content: { type: "string" },
      metaTitle: { type: "string", nullable: true },
      metaDesc: { type: "string", nullable: true },
      isPublished: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "slug", "title", "content"],
  },
  Setting: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      key: { type: "string" },
      value: { type: "string" },
      type: { $ref: "#/components/schemas/SettingType" },
      description: { type: "string", nullable: true },
      isPublic: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "key", "value", "type"],
  },

  // =====================================================
  // COMMERCE
  // =====================================================
  Coupon: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      code: { type: "string" },
      discountType: { $ref: "#/components/schemas/DiscountType" },
      discountValue: { type: "number" },
      minPurchase: { type: "number", nullable: true },
      maxUses: { type: "integer", nullable: true },
      usedCount: { type: "integer" },
      validFrom: { type: "string", format: "date-time", nullable: true },
      validUntil: { type: "string", format: "date-time", nullable: true },
      isActive: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: ["id", "code", "discountType", "discountValue"],
  },
  OrderItem: {
    type: "object",
    properties: {
      productId: { type: "string" },
      productName: { type: "string" },
      price: { type: "number" },
      quantity: { type: "integer" },
    },
    required: ["productId", "productName", "price", "quantity"],
  },
  Order: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      orderNumber: { type: "string" },
      userId: { type: "string", format: "uuid", nullable: true },
      email: { type: "string", format: "email" },
      status: { $ref: "#/components/schemas/OrderStatus" },
      paymentMethod: { $ref: "#/components/schemas/PaymentMethod" },
      paymentId: { type: "string", nullable: true },
      subtotal: { type: "number" },
      discount: { type: "number" },
      total: { type: "number" },
      couponCode: { type: "string", nullable: true },
      items: {
        type: "array",
        items: { $ref: "#/components/schemas/OrderItem" },
      },
      metadata: { type: "object", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/User", nullable: true },
    },
    required: ["id", "email", "status", "paymentMethod", "subtotal", "total", "items"],
  },

  // =====================================================
  // AUDIT
  // =====================================================
  AuditLog: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid", nullable: true },
      action: { $ref: "#/components/schemas/AuditAction" },
      entity: { type: "string" },
      entityId: { type: "string", nullable: true },
      changes: { type: "object", nullable: true },
      ipAddress: { type: "string", nullable: true },
      userAgent: { type: "string", nullable: true },
      metadata: { type: "object", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/User", nullable: true },
    },
    required: ["id", "action", "entity"],
  },

  // =====================================================
  // COMMON RESPONSE TYPES
  // =====================================================
  PaginationInfo: {
    type: "object",
    properties: {
      page: { type: "integer" },
      limit: { type: "integer" },
      total: { type: "integer" },
      totalPages: { type: "integer" },
      hasNext: { type: "boolean" },
      hasPrev: { type: "boolean" },
    },
    required: ["page", "limit", "total", "totalPages", "hasNext", "hasPrev"],
  },
  Error: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: {
        type: "object",
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Invalid input data" },
          details: { type: "object", nullable: true },
        },
        required: ["code", "message"],
      },
    },
    required: ["success", "error"],
  },
  SuccessResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string" },
    },
    required: ["success"],
  },

  // =====================================================
  // AUTH RESPONSES
  // =====================================================
  AuthResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
        required: ["user", "accessToken", "refreshToken"],
      },
    },
    required: ["success", "data"],
  },

  // =====================================================
  // ADMIN STATS
  // =====================================================
  AdminStats: {
    type: "object",
    properties: {
      users: {
        type: "object",
        properties: {
          total: { type: "integer" },
          active: { type: "integer" },
          inactive: { type: "integer" },
          admins: { type: "integer" },
          recentSignups: { type: "integer" },
          signupsByDay: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                count: { type: "integer" },
              },
            },
          },
        },
      },
      orders: {
        type: "object",
        properties: {
          total: { type: "integer" },
          pending: { type: "integer" },
          completed: { type: "integer" },
          totalRevenue: { type: "number" },
          recentOrders: { type: "integer" },
        },
      },
      messages: {
        type: "object",
        properties: {
          total: { type: "integer" },
          pending: { type: "integer" },
          read: { type: "integer" },
          replied: { type: "integer" },
        },
      },
      faqs: {
        type: "object",
        properties: {
          total: { type: "integer" },
          active: { type: "integer" },
          categories: { type: "integer" },
        },
      },
      announcements: {
        type: "object",
        properties: {
          total: { type: "integer" },
          active: { type: "integer" },
          pinned: { type: "integer" },
        },
      },
      coupons: {
        type: "object",
        properties: {
          total: { type: "integer" },
          active: { type: "integer" },
          expired: { type: "integer" },
        },
      },
      content: {
        type: "object",
        properties: {
          total: { type: "integer" },
          published: { type: "integer" },
          draft: { type: "integer" },
        },
      },
      recentActivity: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            action: { type: "string" },
            entity: { type: "string" },
            entityId: { type: "string", nullable: true },
            userEmail: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fullstack Starter API",
      description: "API documentation for the Fullstack Starter backend",
      version: "1.0.0",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: "Development server",
      },
      {
        url: "/api/v1",
        description: "Production server (relative)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
          description: "HTTP-only refresh token cookie",
        },
      },
      schemas: sharedSchemas,
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

// Export schemas for programmatic access
export const schemas = sharedSchemas;
