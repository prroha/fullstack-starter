import { createApp } from "./create-app.js";
import { config } from "./config/index.js";
import { cleanupRateLimitStores } from "./middleware/rate-limit.middleware.js";
import { logger } from "./lib/logger.js";

const app = createApp();

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    environment: config.nodeEnv,
    url: `http://localhost:${PORT}`,
  });
});

// Graceful shutdown
const shutdown = () => {
  logger.info("Shutting down gracefully...");
  server.close(() => {
    cleanupRateLimitStores();
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { app, server };
