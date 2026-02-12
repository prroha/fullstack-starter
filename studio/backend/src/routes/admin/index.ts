import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { ordersRoutes } from "./orders.routes.js";
import { templatesRoutes } from "./templates.routes.js";
import { modulesRoutes } from "./modules.routes.js";
import { featuresRoutes } from "./features.routes.js";
import { customersRoutes } from "./customers.routes.js";
import { licensesRoutes } from "./licenses.routes.js";
import { couponsRoutes } from "./coupons.routes.js";
import { pricingRoutes } from "./pricing.routes.js";
import { analyticsRoutes } from "./analytics.routes.js";
import { settingsRoutes } from "./settings.routes.js";
import { uploadsRoutes } from "./uploads.routes.js";
import { generationRoutes } from "./generation.routes.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Admin routes
router.use("/dashboard", dashboardRoutes);
router.use("/orders", ordersRoutes);
router.use("/templates", templatesRoutes);
router.use("/modules", modulesRoutes);
router.use("/features", featuresRoutes);
router.use("/customers", customersRoutes);
router.use("/licenses", licensesRoutes);
router.use("/coupons", couponsRoutes);
router.use("/pricing", pricingRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/settings", settingsRoutes);
router.use("/uploads", uploadsRoutes);
router.use("/generate", generationRoutes);

export { router as adminRoutes };
