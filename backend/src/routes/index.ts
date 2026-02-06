import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

// API v1 routes
const v1Router = Router();
v1Router.use("/auth", authRoutes);

// Add more routes here:
// v1Router.use("/users", userRoutes);
// v1Router.use("/posts", postRoutes);

router.use("/v1", v1Router);

export default router;
