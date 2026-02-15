import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import adminRoutes from "./admin.routes.js";
import searchRoutes from "./search.routes.js";
import contactRoutes from "./contact.routes.js";
import notificationRoutes from "./notification.routes.js";
import faqRoutes from "./faq.routes.js";
import announcementRoutes from "./announcement.routes.js";
import settingRoutes from "./setting.routes.js";
import contentRoutes from "./content.routes.js";
import couponRoutes from "./coupon.routes.js";
import configRoutes from "./config.routes.js";
import { orderRoutes, adminOrderRoutes } from "./order.routes.js";

const router = Router();

// API v1 routes
const v1Router = Router();
v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);
v1Router.use("/admin", adminRoutes);
v1Router.use("/search", searchRoutes);
v1Router.use("/contact", contactRoutes);
v1Router.use("/notifications", notificationRoutes);
v1Router.use("/faqs", faqRoutes);
v1Router.use("/announcements", announcementRoutes);
v1Router.use("/settings", settingRoutes);
v1Router.use("/content", contentRoutes);
v1Router.use("/coupons", couponRoutes);
v1Router.use("/orders", orderRoutes);
v1Router.use("/admin/orders", adminOrderRoutes);
v1Router.use("/config", configRoutes);

router.use("/v1", v1Router);

export default router;
