import { Router, Request } from "express";
import { faqController } from "../controllers/faq.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types";

const router = Router();

// ============================================================================
// Public routes
// ============================================================================

router.get("/public", (req, res, next) =>
  faqController.getPublicFaqs(req as Request, res, next)
);

router.get("/public/categories", (req, res, next) =>
  faqController.getPublicCategories(req as Request, res, next)
);

// ============================================================================
// Admin routes
// ============================================================================

router.use(authMiddleware);
router.use(adminMiddleware);

// Categories
router.get("/categories", (req, res, next) =>
  faqController.getCategories(req as unknown as AuthenticatedRequest, res, next)
);

router.post("/categories", (req, res, next) =>
  faqController.createCategory(req as unknown as AuthenticatedRequest, res, next)
);

router.patch("/categories/:id", (req, res, next) =>
  faqController.updateCategory(req as unknown as AuthenticatedRequest, res, next)
);

router.delete("/categories/:id", (req, res, next) =>
  faqController.deleteCategory(req as unknown as AuthenticatedRequest, res, next)
);

// FAQs
router.get("/", (req, res, next) =>
  faqController.getFaqs(req as unknown as AuthenticatedRequest, res, next)
);

// Export FAQs (must be before /:id to avoid matching "export" as id)
router.get("/export", (req, res, next) =>
  faqController.exportFaqs(req as unknown as AuthenticatedRequest, res, next)
);

router.get("/:id", (req, res, next) =>
  faqController.getFaq(req as unknown as AuthenticatedRequest, res, next)
);

router.post("/", (req, res, next) =>
  faqController.createFaq(req as unknown as AuthenticatedRequest, res, next)
);

router.patch("/:id", (req, res, next) =>
  faqController.updateFaq(req as unknown as AuthenticatedRequest, res, next)
);

router.delete("/:id", (req, res, next) =>
  faqController.deleteFaq(req as unknown as AuthenticatedRequest, res, next)
);

router.post("/reorder", (req, res, next) =>
  faqController.reorderFaqs(req as unknown as AuthenticatedRequest, res, next)
);

export default router;
