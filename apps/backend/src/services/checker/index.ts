import axios, { AxiosRequestConfig } from "axios";
import { Endpoint, CheckResult } from "../../db/models";
import { logger } from "../../utils/logger";
import { config } from "../../config";

interface CheckResultPayload {
  status: "UP" | "DOWN" | "ERROR";
  latencyMs: number | null;
  httpStatus: number | null;
  errorMessage: string | null;
}

class SyntheticChecker {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalId) {
      logger.warn("Checker is already running");
      return;
    }

    logger.info(
      `Starting synthetic checker (interval: ${config.checkIntervalSeconds}s)`,
    );

    this.runChecks();

    this.intervalId = setInterval(() => {
      this.runChecks();
    }, config.checkIntervalSeconds * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("Synthetic checker stopped");
    }
  }

  private async runChecks() {
    try {
      const endpoints = await Endpoint.find({ enabled: true }).lean();

      logger.debug(`Running checks for ${endpoints.length} endpoints`);

      const checkPromises = endpoints.map((endpoint) =>
        this.checkEndpoint(
          endpoint._id.toString(),
          endpoint.url,
          endpoint.method,
          endpoint.headers,
          endpoint.body,
          endpoint.expectedStatus,
        ),
      );

      await Promise.allSettled(checkPromises);
    } catch (error) {
      logger.error("Error running checks:", error);
    }
  }

  private async checkEndpoint(
    endpointId: string,
    url: string,
    method: string,
    headers: any,
    body: any,
    expectedStatus: number,
  ) {
    const startTime = Date.now();
    let result: CheckResultPayload;

    try {
      const axiosConfig: AxiosRequestConfig = {
        method: method.toLowerCase() as any,
        url,
        headers: headers || {},
        ...(body &&
          ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && {
            data: body,
          }),
        timeout: 30000,
        validateStatus: () => true,
      };

      const response = await axios(axiosConfig);
      const latencyMs = Date.now() - startTime;

      const isStatusMatch = response.status === expectedStatus;

      result = {
        status: isStatusMatch ? "UP" : "DOWN",
        latencyMs,
        httpStatus: response.status,
        errorMessage: isStatusMatch
          ? null
          : `Expected status ${expectedStatus}, got ${response.status}`,
      };

      logger.debug(
        `Check result for ${url}: ${result.status} (${latencyMs}ms)`,
      );
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;

      result = {
        status: "ERROR",
        latencyMs,
        httpStatus: error.response?.status || null,
        errorMessage: error.message || "Unknown error",
      };

      logger.warn(`Check failed for ${url}: ${error.message}`);
    }

    try {
      await CheckResult.create({
        endpointId,
        status: result.status,
        latencyMs: result.latencyMs,
        httpStatus: result.httpStatus,
        errorMessage: result.errorMessage,
      });
    } catch (dbError) {
      logger.error("Error storing check result:", dbError);
    }

    return result;
  }

  async manualCheck(endpointId: string) {
    const endpoint = await Endpoint.findById(endpointId).lean();

    if (!endpoint) {
      throw new Error("Endpoint not found");
    }

    return this.checkEndpoint(
      endpoint._id.toString(),
      endpoint.url,
      endpoint.method,
      endpoint.headers,
      endpoint.body,
      endpoint.expectedStatus,
    );
  }
}

export default new SyntheticChecker();
