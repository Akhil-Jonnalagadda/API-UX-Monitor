import { Request, Response } from "express";
import { Endpoint, CheckResult } from "../db/models";
import { asyncHandler } from "../utils/errorHandler";

export const getLatestChecks = asyncHandler(
  async (req: Request, res: Response) => {
    const { endpointId, limit = "50" } = req.query;

    const where: any = {};
    if (endpointId) where.endpointId = endpointId;

    const checkResults = await CheckResult.find(where)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string, 10))
      .populate("endpointId", "name url")
      .lean();

    const transformedResults = checkResults.map((check: any) => ({
      ...check,
      id: check._id.toString(),
      endpoint: check.endpointId
        ? {
            id: check.endpointId._id?.toString(),
            name: check.endpointId.name,
            url: check.endpointId.url,
          }
        : null,
    }));

    res.json({
      success: true,
      data: transformedResults,
    });
  },
);

export const getTimeseries = asyncHandler(
  async (req: Request, res: Response) => {
    const { endpointId, from, to } = req.query;

    if (!endpointId) {
      return res.status(400).json({
        success: false,
        error: "endpointId is required",
      });
    }

    const fromDate = from
      ? new Date(from as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();

    const checkResults = await CheckResult.find({
      endpointId: endpointId as string,
      timestamp: {
        $gte: fromDate,
        $lte: toDate,
      },
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json({
      success: true,
      data: checkResults.map((check) => ({
        ...check,
        id: check._id.toString(),
      })),
    });
  },
);

export const getUptime = asyncHandler(async (req: Request, res: Response) => {
  const { endpointId, period = "24h" } = req.query;

  if (!endpointId) {
    return res.status(400).json({
      success: false,
      error: "endpointId is required",
    });
  }

  const periodMap: { [key: string]: number } = {
    "1h": 1 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const timeRange = periodMap[period as string] || periodMap["24h"];
  const fromDate = new Date(Date.now() - timeRange);

  const checkResults = await CheckResult.find({
    endpointId: endpointId as string,
    timestamp: { $gte: fromDate },
  }).lean();

  const totalChecks = checkResults.length;
  const successfulChecks = checkResults.filter(
    (check) => check.status === "UP",
  ).length;
  const uptimePercentage =
    totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

  const latencies = checkResults
    .filter(
      (check) => check.latencyMs !== null && check.latencyMs !== undefined,
    )
    .map((check) => check.latencyMs as number)
    .sort((a, b) => a - b);

  const calculatePercentile = (arr: number[], percentile: number) => {
    if (arr.length === 0) return null;
    const index = Math.ceil((percentile / 100) * arr.length) - 1;
    return arr[index];
  };

  const metrics = {
    uptimePercentage: parseFloat(uptimePercentage.toFixed(2)),
    totalChecks,
    successfulChecks,
    failedChecks: totalChecks - successfulChecks,
    latency: {
      p50: calculatePercentile(latencies, 50),
      p95: calculatePercentile(latencies, 95),
      p99: calculatePercentile(latencies, 99),
      avg:
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : null,
      min: latencies.length > 0 ? latencies[0] : null,
      max: latencies.length > 0 ? latencies[latencies.length - 1] : null,
    },
  };

  res.json({
    success: true,
    data: metrics,
  });
});

export const getDashboardMetrics = asyncHandler(
  async (req: Request, res: Response) => {
    const { period = "24h" } = req.query;

    const periodMap: { [key: string]: number } = {
      "1h": 1 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const timeRange = periodMap[period as string] || periodMap["24h"];
    const fromDate = new Date(Date.now() - timeRange);

    const endpoints = await Endpoint.find({ enabled: true }).lean();

    const endpointMetrics = await Promise.all(
      endpoints.map(async (endpoint) => {
        const checkResults = await CheckResult.find({
          endpointId: endpoint._id,
          timestamp: { $gte: fromDate },
        })
          .sort({ timestamp: -1 })
          .lean();

        const totalChecks = checkResults.length;
        const successfulChecks = checkResults.filter(
          (check) => check.status === "UP",
        ).length;
        const uptimePercentage =
          totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

        const latestCheck = checkResults[0] || null;

        return {
          endpointId: endpoint._id.toString(),
          endpointName: endpoint.name,
          endpointUrl: endpoint.url,
          uptimePercentage: parseFloat(uptimePercentage.toFixed(2)),
          currentStatus: latestCheck?.status || "UNKNOWN",
          lastCheckTime: latestCheck?.timestamp || null,
          totalChecks,
        };
      }),
    );

    const totalEndpoints = endpoints.length;
    const activeEndpoints = endpointMetrics.filter(
      (m) => m.currentStatus === "UP",
    ).length;
    const downEndpoints = endpointMetrics.filter(
      (m) => m.currentStatus === "DOWN" || m.currentStatus === "ERROR",
    ).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalEndpoints,
          activeEndpoints,
          downEndpoints,
          overallUptime:
            totalEndpoints > 0
              ? parseFloat(
                  (
                    endpointMetrics.reduce(
                      (sum, m) => sum + m.uptimePercentage,
                      0,
                    ) / totalEndpoints
                  ).toFixed(2),
                )
              : 0,
        },
        endpoints: endpointMetrics,
      },
    });
  },
);
