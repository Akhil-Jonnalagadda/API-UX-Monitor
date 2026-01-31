import { Request, Response } from "express";
import { Incident, CheckResult } from "../db/models";
import { asyncHandler } from "../utils/errorHandler";
import incidentDetector from "../services/incident";

export const getAllIncidents = asyncHandler(
  async (req: Request, res: Response) => {
    const { endpointId, resolved, type } = req.query;

    const where: any = {};
    if (endpointId) where.endpointId = endpointId;
    if (resolved !== undefined) where.resolved = resolved === "true";
    if (type) where.type = type;

    const incidents = await Incident.find(where)
      .sort({ startTime: -1 })
      .populate("endpointId", "name url")
      .lean();

    const transformedIncidents = incidents.map((incident: any) => ({
      ...incident,
      id: incident._id.toString(),
      endpoint: incident.endpointId
        ? {
            id: incident.endpointId._id?.toString(),
            name: incident.endpointId.name,
            url: incident.endpointId.url,
          }
        : null,
    }));

    res.json({
      success: true,
      data: transformedIncidents,
    });
  },
);

export const getIncident = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const incident = await Incident.findById(id).populate("endpointId").lean();

  if (!incident) {
    return res.status(404).json({
      success: false,
      error: "Incident not found",
    });
  }

  const transformedIncident = {
    ...incident,
    id: incident._id.toString(),
    endpoint: (incident as any).endpointId
      ? {
          ...(incident as any).endpointId,
          id: (incident as any).endpointId._id?.toString(),
        }
      : null,
  };

  res.json({
    success: true,
    data: transformedIncident,
  });
});

export const getIncidentReplay = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const incident = await Incident.findById(id).lean();

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: "Incident not found",
      });
    }

    const bufferMs = 30 * 60 * 1000;
    const fromDate = new Date(incident.startTime.getTime() - bufferMs);
    const toDate = incident.endTime
      ? new Date(incident.endTime.getTime() + bufferMs)
      : new Date(Date.now() + bufferMs);

    const checks = await CheckResult.find({
      endpointId: incident.endpointId,
      timestamp: {
        $gte: fromDate,
        $lte: toDate,
      },
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        incident: {
          ...incident,
          id: incident._id.toString(),
        },
        checks: checks.map((check) => ({
          ...check,
          id: check._id.toString(),
        })),
      },
    });
  },
);

export const resolveIncident = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const incident = await incidentDetector.resolveIncident(id);

    res.json({
      success: true,
      data: incident,
    });
  },
);

export const getIncidentStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { period = "30d" } = req.query;

    const periodMap: { [key: string]: number } = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };

    const timeRange = periodMap[period as string] || periodMap["30d"];
    const fromDate = new Date(Date.now() - timeRange);

    const incidents = await Incident.find({
      startTime: { $gte: fromDate },
    }).lean();

    const stats = {
      total: incidents.length,
      resolved: incidents.filter((i) => i.resolved).length,
      ongoing: incidents.filter((i) => !i.resolved).length,
      byType: {
        downtime: incidents.filter((i) => i.type === "downtime").length,
        latency_spike: incidents.filter((i) => i.type === "latency_spike")
          .length,
        error_rate: incidents.filter((i) => i.type === "error_rate").length,
      },
      bySeverity: {
        critical: incidents.filter((i) => i.severity === "critical").length,
        high: incidents.filter((i) => i.severity === "high").length,
        medium: incidents.filter((i) => i.severity === "medium").length,
        low: incidents.filter((i) => i.severity === "low").length,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  },
);
