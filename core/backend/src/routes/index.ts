import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import searchRoutes from "./search.routes";
import contactRoutes from "./contact.routes";
import notificationRoutes from "./notification.routes";
import faqRoutes from "./faq.routes";
import announcementRoutes from "./announcement.routes";
import settingRoutes from "./setting.routes";
import contentRoutes from "./content.routes";

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

router.use("/v1", v1Router);

export default router;
