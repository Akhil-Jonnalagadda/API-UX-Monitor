import { Endpoint, CheckResult, Incident } from "../../db/models";
import { logger } from "../../utils/logger";
import { config } from "../../config";

class IncidentDetector {
  private intervalId: NodeJS.Timeout | null = null;

  // Start the detector
  start() {
    if (this.intervalId) {
      logger.warn("Incident detector is already running");
      return;
    }

    logger.info("Starting incident detector (interval: 60s)");

    // Run immediately on start
    this.detectIncidents();

    // Run every minute
    this.intervalId = setInterval(() => {
      this.detectIncidents();
    }, 60 * 1000);
  }

  // Stop the detector
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("Incident detector stopped");
    }
  }

  // Main detection logic
  private async detectIncidents() {
    try {
      const endpoints = await Endpoint.find({ enabled: true }).lean();

      for (const endpoint of endpoints) {
        // Check for downtime incidents
        await this.detectDowntimeIncident(endpoint._id.toString());

        // Check for latency spike incidents
        await this.detectLatencySpikeIncident(endpoint._id.toString());
      }

      // Auto-resolve incidents that are no longer occurring
      await this.autoResolveIncidents();
    } catch (error) {
      logger.error("Error detecting incidents:", error);
    }
  }

  // Detect downtime incidents (consecutive failures)
  private async detectDowntimeIncident(endpointId: string) {
    const recentChecks = await CheckResult.find({ endpointId })
      .sort({ timestamp: -1 })
      .limit(config.consecutiveFailuresThreshold)
      .lean();

    if (recentChecks.length < config.consecutiveFailuresThreshold) {
      return;
    }

    const allFailed = recentChecks.every(
      (check) => check.status === "DOWN" || check.status === "ERROR",
    );

    if (allFailed) {
      const existingIncident = await Incident.findOne({
        endpointId,
        type: "downtime",
        resolved: false,
      }).lean();

      if (!existingIncident) {
        const endpoint = await Endpoint.findById(endpointId).lean();

        await Incident.create({
          endpointId,
          type: "downtime",
          summary: `${endpoint?.name} is experiencing downtime (${config.consecutiveFailuresThreshold} consecutive failures)`,
          severity: "critical",
          startTime: recentChecks[recentChecks.length - 1].timestamp,
        });

        logger.warn(`Created downtime incident for endpoint ${endpointId}`);
      }
    }
  }

  // Detect latency spike incidents
  private async detectLatencySpikeIncident(endpointId: string) {
    const windowMs = config.latencySpikeWindowMinutes * 60 * 1000;
    const fromDate = new Date(Date.now() - windowMs);

    const recentChecks = await CheckResult.find({
      endpointId,
      timestamp: { $gte: fromDate },
      status: "UP",
      latencyMs: { $ne: null },
    })
      .sort({ timestamp: -1 })
      .lean();

    if (recentChecks.length < 5) {
      return;
    }

    const avgLatency =
      recentChecks.reduce((sum, check) => sum + (check.latencyMs || 0), 0) /
      recentChecks.length;

    const recentHighLatency = recentChecks
      .slice(0, 3)
      .filter(
        (check) => (check.latencyMs || 0) > config.latencySpikeThresholdMs,
      );

    if (
      recentHighLatency.length >= 2 &&
      avgLatency > config.latencySpikeThresholdMs * 0.8
    ) {
      const existingIncident = await Incident.findOne({
        endpointId,
        type: "latency_spike",
        resolved: false,
      }).lean();

      if (!existingIncident) {
        const endpoint = await Endpoint.findById(endpointId).lean();

        await Incident.create({
          endpointId,
          type: "latency_spike",
          summary: `${endpoint?.name} is experiencing high latency (avg: ${Math.round(avgLatency)}ms)`,
          severity: "high",
          startTime: recentHighLatency[recentHighLatency.length - 1].timestamp,
        });

        logger.warn(
          `Created latency spike incident for endpoint ${endpointId}`,
        );
      }
    }
  }

  // Auto-resolve incidents that are no longer occurring
  private async autoResolveIncidents() {
    const ongoingIncidents = await Incident.find({ resolved: false }).lean();

    for (const incident of ongoingIncidents) {
      const shouldResolve = await this.shouldResolveIncident(incident);

      if (shouldResolve) {
        await Incident.findByIdAndUpdate(incident._id, {
          resolved: true,
          endTime: new Date(),
        });

        logger.info(
          `Auto-resolved incident ${incident._id} (${incident.type})`,
        );
      }
    }
  }

  // Check if an incident should be auto-resolved
  private async shouldResolveIncident(incident: any): Promise<boolean> {
    const recentChecks = await CheckResult.find({
      endpointId: incident.endpointId,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    if (recentChecks.length === 0) {
      return false;
    }

    if (incident.type === "downtime") {
      const recentSuccesses = recentChecks
        .slice(0, 3)
        .filter((check) => check.status === "UP");
      return recentSuccesses.length === 3;
    }

    if (incident.type === "latency_spike") {
      const recentNormalLatency = recentChecks
        .slice(0, 3)
        .filter(
          (check) =>
            (check.latencyMs || 0) < config.latencySpikeThresholdMs * 0.7,
        );
      return recentNormalLatency.length === 3;
    }

    return false;
  }

  // Manual incident creation
  async createManualIncident(
    endpointId: string,
    type: string,
    summary: string,
    severity: string,
  ) {
    return Incident.create({
      endpointId,
      type,
      summary,
      severity,
    });
  }

  // Manual incident resolution
  async resolveIncident(incidentId: string) {
    return Incident.findByIdAndUpdate(
      incidentId,
      {
        resolved: true,
        endTime: new Date(),
      },
      { new: true },
    );
  }
}

export default new IncidentDetector();
