import mongoose, { Schema, Document } from "mongoose";

export interface IIncident extends Document {
  endpointId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  type: "downtime" | "latency_spike" | "error_rate";
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    endpointId: {
      type: Schema.Types.ObjectId,
      ref: "Endpoint",
      required: true,
    },
    startTime: { type: Date, default: Date.now, required: true },
    endTime: { type: Date },
    type: {
      type: String,
      enum: ["downtime", "latency_spike", "error_rate"],
      required: true,
    },
    summary: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

IncidentSchema.index({ endpointId: 1, startTime: -1 });
IncidentSchema.index({ resolved: 1 });

export const Incident = mongoose.model<IIncident>("Incident", IncidentSchema);
