import { FastifyPluginAsync } from "fastify";
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

const routes: FastifyPluginAsync = async (fastify) => {
  // API v1 routes
  await fastify.register(async (v1) => {
    await v1.register(authRoutes, { prefix: "/auth" });
    await v1.register(userRoutes, { prefix: "/users" });
    await v1.register(adminRoutes, { prefix: "/admin" });
    await v1.register(searchRoutes, { prefix: "/search" });
    await v1.register(contactRoutes, { prefix: "/contact" });
    await v1.register(notificationRoutes, { prefix: "/notifications" });
    await v1.register(faqRoutes, { prefix: "/faqs" });
    await v1.register(announcementRoutes, { prefix: "/announcements" });
    await v1.register(settingRoutes, { prefix: "/settings" });
    await v1.register(contentRoutes, { prefix: "/content" });
    await v1.register(couponRoutes, { prefix: "/coupons" });
    await v1.register(orderRoutes, { prefix: "/orders" });
    await v1.register(adminOrderRoutes, { prefix: "/admin/orders" });
    await v1.register(configRoutes, { prefix: "/config" });
  }, { prefix: "/v1" });
};

export default routes;
