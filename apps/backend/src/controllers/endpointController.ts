import { Request, Response } from "express";
import { Endpoint, CheckResult, Incident } from "../db/models";
import { asyncHandler } from "../utils/errorHandler";

export const getAllEndpoints = asyncHandler(
  async (req: Request, res: Response) => {
    const endpoints = await Endpoint.find().sort({ createdAt: -1 }).lean();

    const endpointsWithCounts = await Promise.all(
      endpoints.map(async (endpoint) => {
        const checkResults = await CheckResult.countDocuments({
          endpointId: endpoint._id,
        });
        const incidents = await Incident.countDocuments({
          endpointId: endpoint._id,
        });

        return {
          ...endpoint,
          id: endpoint._id.toString(),
          _count: {
            checkResults,
            incidents,
          },
        };
      }),
    );

    res.json({
      success: true,
      data: endpointsWithCounts,
    });
  },
);

export const getEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const endpoint = await Endpoint.findById(id).lean();

  if (!endpoint) {
    return res.status(404).json({
      success: false,
      error: "Endpoint not found",
    });
  }

  const checkResults = await CheckResult.find({ endpointId: id })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();

  const incidents = await Incident.find({ endpointId: id })
    .sort({ startTime: -1 })
    .limit(5)
    .lean();

  res.json({
    success: true,
    data: {
      ...endpoint,
      id: endpoint._id.toString(),
      checkResults: checkResults.map((check) => ({
        ...check,
        id: check._id.toString(),
      })),
      incidents: incidents.map((incident) => ({
        ...incident,
        id: incident._id.toString(),
      })),
    },
  });
});

export const createEndpoint = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      url,
      method = "GET",
      headers,
      body,
      expectedStatus = 200,
      scheduleSeconds = 30,
      enabled = true,
    } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: "Name and URL are required",
      });
    }

    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format",
      });
    }

    const endpoint = await Endpoint.create({
      name,
      url,
      method: method.toUpperCase(),
      headers: headers || undefined,
      body: body || undefined,
      expectedStatus,
      scheduleSeconds,
      enabled,
    });

    res.status(201).json({
      success: true,
      data: {
        ...endpoint.toObject(),
        id: endpoint._id.toString(),
      },
    });
  },
);

export const updateEndpoint = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      url,
      method,
      headers,
      body,
      expectedStatus,
      scheduleSeconds,
      enabled,
    } = req.body;

    const existingEndpoint = await Endpoint.findById(id);

    if (!existingEndpoint) {
      return res.status(404).json({
        success: false,
        error: "Endpoint not found",
      });
    }

    if (url) {
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: "Invalid URL format",
        });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (url) updateData.url = url;
    if (method) updateData.method = method.toUpperCase();
    if (headers !== undefined) updateData.headers = headers;
    if (body !== undefined) updateData.body = body;
    if (expectedStatus) updateData.expectedStatus = expectedStatus;
    if (scheduleSeconds) updateData.scheduleSeconds = scheduleSeconds;
    if (enabled !== undefined) updateData.enabled = enabled;

    const endpoint = await Endpoint.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    res.json({
      success: true,
      data: {
        ...endpoint,
        id: endpoint!._id.toString(),
      },
    });
  },
);

export const deleteEndpoint = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const endpoint = await Endpoint.findById(id);

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        error: "Endpoint not found",
      });
    }

    await Endpoint.findByIdAndDelete(id);
    await CheckResult.deleteMany({ endpointId: id });
    await Incident.deleteMany({ endpointId: id });

    res.json({
      success: true,
      message: "Endpoint deleted successfully",
    });
  },
);
