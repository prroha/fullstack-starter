import { FastifyPluginAsync } from "fastify";
import { adminController } from "../controllers/admin.controller.js";
import { contactController } from "../controllers/contact.controller.js";
import { auditController } from "../controllers/audit.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { requireFeature } from "../middleware/preview.middleware.js";

const routePlugin: FastifyPluginAsync = async (fastify) => {
  // All admin routes require authentication and admin role
  fastify.addHook("preHandler", authMiddleware);
  fastify.addHook("preHandler", adminMiddleware);

  // Dashboard stats
  fastify.get("/stats", (req, reply) => adminController.getStats(req, reply));

  // User management
  fastify.get("/users", (req, reply) => adminController.getUsers(req, reply));

  // Export users to CSV (must be before /users/:id to avoid matching "export" as id)
  fastify.get("/users/export", (req, reply) => adminController.exportUsers(req, reply));

  fastify.get("/users/:id", (req, reply) => adminController.getUser(req, reply));

  fastify.patch("/users/:id", (req, reply) => adminController.updateUser(req, reply));

  fastify.delete("/users/:id", (req, reply) => adminController.deleteUser(req, reply));

  // Audit logs management
  fastify.get("/audit-logs/entity-types", { preHandler: [requireFeature("security.audit")] }, (req, reply) =>
    auditController.getEntityTypes(req, reply)
  );

  fastify.get("/audit-logs/action-types", { preHandler: [requireFeature("security.audit")] }, (req, reply) =>
    auditController.getActionTypes(req, reply)
  );

  fastify.get("/audit-logs/export", { preHandler: [requireFeature("security.audit")] }, (req, reply) =>
    adminController.exportAuditLogs(req, reply)
  );

  fastify.get("/audit-logs/:id", { preHandler: [requireFeature("security.audit")] }, (req, reply) =>
    auditController.getLogById(req, reply)
  );

  fastify.get("/audit-logs", { preHandler: [requireFeature("security.audit")] }, (req, reply) =>
    auditController.getLogs(req, reply)
  );

  // Contact messages management
  fastify.get("/contact-messages/unread-count", (req, reply) =>
    contactController.getUnreadCount(req, reply)
  );

  // Export contact messages (must be before /:id to avoid matching "export" as id)
  fastify.get("/contact-messages/export", (req, reply) =>
    contactController.exportMessages(req, reply)
  );

  fastify.get("/contact-messages", (req, reply) =>
    contactController.getAll(req, reply)
  );

  fastify.get("/contact-messages/:id", (req, reply) =>
    contactController.getById(req, reply)
  );

  fastify.patch("/contact-messages/:id", (req, reply) =>
    contactController.update(req, reply)
  );

  fastify.delete("/contact-messages/:id", (req, reply) =>
    contactController.delete(req, reply)
  );
};

export default routePlugin;
