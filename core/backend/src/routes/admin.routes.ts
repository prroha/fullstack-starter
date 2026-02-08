import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { contactController } from "../controllers/contact.controller";
import { auditController } from "../controllers/audit.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard stats
router.get("/stats", (req, res, next) =>
  adminController.getStats(req as unknown as AuthenticatedRequest, res, next)
);

// User management
router.get("/users", (req, res, next) =>
  adminController.getUsers(req as unknown as AuthenticatedRequest, res, next)
);

// Export users to CSV (must be before /users/:id to avoid matching "export" as id)
router.get("/users/export", (req, res, next) =>
  adminController.exportUsers(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/users/:id", (req, res, next) =>
  adminController.getUser(req as unknown as AuthenticatedRequest, res, next)
);

router.patch("/users/:id", (req, res, next) =>
  adminController.updateUser(req as unknown as AuthenticatedRequest, res, next)
);

router.delete("/users/:id", (req, res, next) =>
  adminController.deleteUser(req as unknown as AuthenticatedRequest, res, next)
);

// Audit logs management
router.get("/audit-logs/entity-types", (req, res, next) =>
  auditController.getEntityTypes(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/audit-logs/action-types", (req, res, next) =>
  auditController.getActionTypes(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/audit-logs/export", (req, res, next) =>
  adminController.exportAuditLogs(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/audit-logs/:id", (req, res, next) =>
  auditController.getLogById(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/audit-logs", (req, res, next) =>
  auditController.getLogs(req as unknown as AuthenticatedRequest, res, next)
);

// Contact messages management
router.get("/contact-messages/unread-count", (req, res, next) =>
  contactController.getUnreadCount(req, res, next)
);

// Export contact messages (must be before /:id to avoid matching "export" as id)
router.get("/contact-messages/export", (req, res, next) =>
  contactController.exportMessages(req, res, next)
);

router.get("/contact-messages", (req, res, next) =>
  contactController.getAll(req, res, next)
);

router.get("/contact-messages/:id", (req, res, next) =>
  contactController.getById(req, res, next)
);

router.patch("/contact-messages/:id", (req, res, next) =>
  contactController.update(req, res, next)
);

router.delete("/contact-messages/:id", (req, res, next) =>
  contactController.delete(req, res, next)
);

export default router;
