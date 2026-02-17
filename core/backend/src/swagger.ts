import { FastifyDynamicSwaggerOptions } from "@fastify/swagger";
import { config } from "./config/index.js";

/**
 * Shared OpenAPI schemas - Single source of truth for all types
 */
const sharedSchemas = {
  UserRole: {
    type: "string" as const,
    enum: ["USER", "ADMIN", "SUPER_ADMIN"],
    description: "User role in the system",
  },
  ContactMessageStatus: {
    type: "string" as const,
    enum: ["PENDING", "READ", "REPLIED"],
    description: "Contact message status",
  },
  NotificationType: {
    type: "string" as const,
    enum: ["INFO", "SUCCESS", "WARNING", "ERROR", "SYSTEM"],
    description: "Notification type",
  },
  AnnouncementType: {
    type: "string" as const,
    enum: ["INFO", "WARNING", "SUCCESS", "PROMO"],
    description: "Announcement type",
  },
  DiscountType: {
    type: "string" as const,
    enum: ["PERCENTAGE", "FIXED"],
    description: "Coupon discount type",
  },
  OrderStatus: {
    type: "string" as const,
    enum: ["PENDING", "COMPLETED", "REFUNDED", "FAILED"],
    description: "Order status",
  },
  PaymentMethod: {
    type: "string" as const,
    enum: ["STRIPE", "PAYPAL", "MANUAL"],
    description: "Payment method",
  },
  AuditAction: {
    type: "string" as const,
    enum: [
      "CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
      "LOGIN_FAILED", "PASSWORD_CHANGE", "PASSWORD_RESET", "EMAIL_VERIFY", "ADMIN_ACTION",
    ],
    description: "Audit log action type",
  },
  SettingType: {
    type: "string" as const,
    enum: ["STRING", "NUMBER", "BOOLEAN", "JSON"],
    description: "Setting value type",
  },
};

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
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
      },
      schemas: sharedSchemas,
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
};

// Export schemas for programmatic access
export const schemas = sharedSchemas;
