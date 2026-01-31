import { Endpoint, AlertRule } from "./models";
import { connectDatabase } from "./connection";
import { logger } from "../utils/logger";

async function seed() {
  try {
    await connectDatabase();

    logger.info("🌱 Seeding database...");

    // Clear existing data
    await Endpoint.deleteMany({});
    await AlertRule.deleteMany({});

    logger.info("Cleared existing data");

    // Create sample endpoints
    const endpoints = [
      {
        name: "JSONPlaceholder API",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        method: "GET",
        expectedStatus: 200,
        scheduleSeconds: 30,
        enabled: true,
      },
      {
        name: "GitHub API",
        url: "https://api.github.com",
        method: "GET",
        expectedStatus: 200,
        scheduleSeconds: 60,
        enabled: true,
      },
      {
        name: "HTTPBin GET",
        url: "https://httpbin.org/get",
        method: "GET",
        expectedStatus: 200,
        scheduleSeconds: 30,
        enabled: true,
      },
      {
        name: "HTTPBin POST",
        url: "https://httpbin.org/post",
        method: "POST",
        body: { test: "data" },
        expectedStatus: 200,
        scheduleSeconds: 60,
        enabled: false,
      },
    ];

    const createdEndpoints = await Endpoint.insertMany(endpoints);
    logger.info(`✅ Created ${createdEndpoints.length} endpoints`);

    // Create sample alert rules
    for (const endpoint of createdEndpoints) {
      await AlertRule.create({
        endpointId: endpoint._id,
        name: `${endpoint.name} - Latency Alert`,
        ruleType: "latencyThreshold",
        config: {
          threshold: 2000,
          windowSeconds: 300,
        },
        enabled: true,
      });

      await AlertRule.create({
        endpointId: endpoint._id,
        name: `${endpoint.name} - Downtime Alert`,
        ruleType: "consecutiveFailures",
        config: {
          consecutiveFailures: 3,
        },
        enabled: true,
      });
    }

    // Create a global alert rule
    await AlertRule.create({
      name: "Global Error Rate Alert",
      ruleType: "errorRateSpike",
      config: {
        errorRate: 0.5,
        windowSeconds: 600,
      },
      enabled: true,
    });

    logger.info("✅ Created alert rules");
    logger.info("🎉 Seeding completed!");

    process.exit(0);
  } catch (error) {
    logger.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
