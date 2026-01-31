import mongoose, { Schema, Document } from "mongoose";

export interface ICheckResult extends Document {
  endpointId: mongoose.Types.ObjectId;
  timestamp: Date;
  status: "UP" | "DOWN" | "ERROR";
  latencyMs?: number;
  httpStatus?: number;
  errorMessage?: string;
  createdAt: Date;
}

const CheckResultSchema = new Schema<ICheckResult>(
  {
    endpointId: {
      type: Schema.Types.ObjectId,
      ref: "Endpoint",
      required: true,
    },
    timestamp: { type: Date, default: Date.now, required: true },
    status: { type: String, enum: ["UP", "DOWN", "ERROR"], required: true },
    latencyMs: { type: Number },
    httpStatus: { type: Number },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CheckResultSchema.index({ endpointId: 1, timestamp: -1 });
CheckResultSchema.index({ timestamp: -1 });

export const CheckResult = mongoose.model<ICheckResult>(
  "CheckResult",
  CheckResultSchema,
);
