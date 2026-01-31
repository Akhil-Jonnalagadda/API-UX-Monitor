import mongoose, { Schema, Document } from "mongoose";

export interface IAlertRule extends Document {
  endpointId?: mongoose.Types.ObjectId;
  name: string;
  ruleType: "latencyThreshold" | "errorRateSpike" | "consecutiveFailures";
  config: any;
  enabled: boolean;
  channels?: any;
  createdAt: Date;
  updatedAt: Date;
}

const AlertRuleSchema = new Schema<IAlertRule>(
  {
    endpointId: { type: Schema.Types.ObjectId, ref: "Endpoint" },
    name: { type: String, required: true },
    ruleType: {
      type: String,
      enum: ["latencyThreshold", "errorRateSpike", "consecutiveFailures"],
      required: true,
    },
    config: { type: Schema.Types.Mixed, required: true },
    enabled: { type: Boolean, default: true },
    channels: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

AlertRuleSchema.index({ enabled: 1 });
AlertRuleSchema.index({ endpointId: 1 });

export const AlertRule = mongoose.model<IAlertRule>(
  "AlertRule",
  AlertRuleSchema,
);
