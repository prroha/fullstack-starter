import { FastifyRequest, FastifyReply } from "fastify";
import { getRequiredFeature } from "../config/feature-route-map.js";

/**
 * Feature gate middleware — blocks API routes for features
 * not included in the preview session's selected features.
 *
 * Registered as a Fastify onRequest hook in the preview backend.
 * Runs after tenant middleware (which attaches req.previewSession).
 */
export async function featureGateMiddleware(
  req: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Skip for health, internal routes, and non-API routes
  if (req.url === "/health" || req.url.startsWith("/internal")) {
    return;
  }

  const session = req.previewSession;
  if (!session) return; // Tenant middleware hasn't run or route is excluded

  const requiredFeature = getRequiredFeature(req.url);
  if (!requiredFeature) return; // Core route, always allowed

  // Check if the session has the required feature enabled.
  // Match logic: exact match, or the session has a feature whose module prefix matches.
  // e.g., session feature "ecommerce.products" matches required "ecommerce.products"
  // e.g., session feature "ecommerce" (whole module) matches required "ecommerce.products"
  const modulePrefix = requiredFeature.split(".")[0];
  const hasFeature = session.features.some(
    (f) =>
      f === requiredFeature ||
      f === modulePrefix ||
      f.startsWith(modulePrefix + "."),
  );

  if (!hasFeature) {
    // Return 404 to not leak information about disabled features
    throw Object.assign(
      new Error("Not found"),
      { statusCode: 404 }
    );
  }
}
