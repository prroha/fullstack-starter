import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import searchRoutes from "./search.routes";
import contactRoutes from "./contact.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

// API v1 routes
const v1Router = Router();
v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);
v1Router.use("/admin", adminRoutes);
v1Router.use("/search", searchRoutes);
v1Router.use("/contact", contactRoutes);
v1Router.use("/notifications", notificationRoutes);

// Add more routes here:
// v1Router.use("/posts", postRoutes);

router.use("/v1", v1Router);

export default router;
