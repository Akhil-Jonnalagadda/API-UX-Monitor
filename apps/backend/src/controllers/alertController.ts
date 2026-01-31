import { Request, Response } from "express";
import { AlertRule } from "../db/models";
import { asyncHandler } from "../utils/errorHandler";

export const getAllAlertRules = asyncHandler(
  async (req: Request, res: Response) => {
    const { endpointId } = req.query;

    const where = endpointId ? { endpointId: endpointId as string } : {};

    const alertRules = await AlertRule.find(where)
      .sort({ createdAt: -1 })
      .populate("endpointId", "name url")
      .lean();

    const transformedRules = alertRules.map((rule: any) => ({
      ...rule,
      id: rule._id.toString(),
      endpoint: rule.endpointId
        ? {
            id: rule.endpointId._id?.toString(),
            name: rule.endpointId.name,
            url: rule.endpointId.url,
          }
        : null,
    }));

    res.json({
      success: true,
      data: transformedRules,
    });
  },
);

export const getAlertRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const alertRule = await AlertRule.findById(id)
      .populate("endpointId")
      .lean();

    if (!alertRule) {
      return res.status(404).json({
        success: false,
        error: "Alert rule not found",
      });
    }

    const transformedRule = {
      ...alertRule,
      id: alertRule._id.toString(),
      endpoint: (alertRule as any).endpointId
        ? {
            ...(alertRule as any).endpointId,
            id: (alertRule as any).endpointId._id?.toString(),
          }
        : null,
    };

    res.json({
      success: true,
      data: transformedRule,
    });
  },
);

export const createAlertRule = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      endpointId,
      name,
      ruleType,
      config,
      enabled = true,
      channels,
    } = req.body;

    if (!name || !ruleType || !config) {
      return res.status(400).json({
        success: false,
        error: "Name, ruleType, and config are required",
      });
    }

    const validRuleTypes = [
      "latencyThreshold",
      "errorRateSpike",
      "consecutiveFailures",
    ];
    if (!validRuleTypes.includes(ruleType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ruleType. Must be one of: ${validRuleTypes.join(", ")}`,
      });
    }

    const alertRule = await AlertRule.create({
      endpointId: endpointId || null,
      name,
      ruleType,
      config,
      enabled,
      channels: channels || null,
    });

    res.status(201).json({
      success: true,
      data: {
        ...alertRule.toObject(),
        id: alertRule._id.toString(),
      },
    });
  },
);

export const updateAlertRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, ruleType, config, enabled, channels } = req.body;

    const existingRule = await AlertRule.findById(id);

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: "Alert rule not found",
      });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (ruleType) updateData.ruleType = ruleType;
    if (config) updateData.config = config;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (channels !== undefined) updateData.channels = channels;

    const alertRule = await AlertRule.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    res.json({
      success: true,
      data: {
        ...alertRule,
        id: alertRule!._id.toString(),
      },
    });
  },
);

export const deleteAlertRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const alertRule = await AlertRule.findById(id);

    if (!alertRule) {
      return res.status(404).json({
        success: false,
        error: "Alert rule not found",
      });
    }

    await AlertRule.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Alert rule deleted successfully",
    });
  },
);
