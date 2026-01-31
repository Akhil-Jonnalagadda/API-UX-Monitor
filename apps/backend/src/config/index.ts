import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/api_monitor",

  // Checker configuration
  checkIntervalSeconds: parseInt(
    process.env.CHECK_INTERVAL_SECONDS || "30",
    10,
  ),

  // Incident detection
  consecutiveFailuresThreshold: parseInt(
    process.env.CONSECUTIVE_FAILURES_THRESHOLD || "3",
    10,
  ),
  latencySpikeThresholdMs: parseInt(
    process.env.LATENCY_SPIKE_THRESHOLD_MS || "2000",
    10,
  ),
  latencySpikeWindowMinutes: parseInt(
    process.env.LATENCY_SPIKE_WINDOW_MINUTES || "5",
    10,
  ),

  // CORS
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:3000", "http://localhost:5173"],
};
