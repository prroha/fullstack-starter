import { Router, Request, Response, NextFunction } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { contactController } from "../controllers/contact.controller.js";
import { auditController } from "../controllers/audit.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { requireFeature } from "../middleware/preview.middleware.js";
import { AuthenticatedRequest } from "../types/index.js";

type AuthHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;

function authRoute(handler: AuthHandler) {
  return (req: Request, res: Response, next: NextFunction) => handler(req as AuthenticatedRequest, res, next);
}

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard stats
router.get("/stats", authRoute((req, res, next) =>
  adminController.getStats(req, res, next)
));

// User management
router.get("/users", authRoute((req, res, next) =>
  adminController.getUsers(req, res, next)
));

// Export users to CSV (must be before /users/:id to avoid matching "export" as id)
router.get("/users/export", authRoute((req, res, next) =>
  adminController.exportUsers(req, res, next)
));

router.get("/users/:id", authRoute((req, res, next) =>
  adminController.getUser(req, res, next)
));

router.patch("/users/:id", authRoute((req, res, next) =>
  adminController.updateUser(req, res, next)
));

router.delete("/users/:id", authRoute((req, res, next) =>
  adminController.deleteUser(req, res, next)
));

// Audit logs management
router.get("/audit-logs/entity-types", requireFeature("security.audit"), authRoute((req, res, next) =>
  auditController.getEntityTypes(req, res, next)
));

router.get("/audit-logs/action-types", requireFeature("security.audit"), authRoute((req, res, next) =>
  auditController.getActionTypes(req, res, next)
));

router.get("/audit-logs/export", requireFeature("security.audit"), authRoute((req, res, next) =>
  adminController.exportAuditLogs(req, res, next)
));

router.get("/audit-logs/:id", requireFeature("security.audit"), authRoute((req, res, next) =>
  auditController.getLogById(req, res, next)
));

router.get("/audit-logs", requireFeature("security.audit"), authRoute((req, res, next) =>
  auditController.getLogs(req, res, next)
));

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
