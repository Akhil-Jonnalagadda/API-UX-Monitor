import express, { Application } from "express";
import http from "http";
import cors from "cors";
import { config } from "./config";
import { errorHandler } from "./utils/errorHandler";
import { logger } from "./utils/logger";
import { initializeWebSocket } from "./websocket";
import { connectDatabase } from "./db/connection";
import syntheticChecker from "./services/checker";
import incidentDetector from "./services/incident";

// Import routes
import endpointRoutes from "./routes/endpointRoutes";
import metricsRoutes from "./routes/metricsRoutes";
import incidentRoutes from "./routes/incidentRoutes";
import alertRoutes from "./routes/alertRoutes";

const app: Application = express();
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API UX Monitor is running",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API UX Monitor API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/endpoints", endpointRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/alerts", alertRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize WebSocket
initializeWebSocket(server);

// Start services
const startServices = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info("MongoDB connected successfully");

    // Start synthetic checker
    syntheticChecker.start();
    logger.info("Synthetic checker started");

    // Start incident detector
    incidentDetector.start();
    logger.info("Incident detector started");
  } catch (error) {
    logger.error("Error starting services:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info("Received shutdown signal, closing gracefully...");

  syntheticChecker.stop();
  incidentDetector.stop();

  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const PORT = config.port;

server.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 CORS origin: ${config.corsOrigin}`);

  await startServices();
});

export default app;
