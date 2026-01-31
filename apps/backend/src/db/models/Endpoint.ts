import mongoose, { Schema, Document } from "mongoose";

export interface IEndpoint extends Document {
  name: string;
  url: string;
  method: string;
  headers?: any;
  body?: any;
  expectedStatus: number;
  scheduleSeconds: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EndpointSchema = new Schema<IEndpoint>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    method: { type: String, default: "GET" },
    headers: { type: Schema.Types.Mixed },
    body: { type: Schema.Types.Mixed },
    expectedStatus: { type: Number, default: 200 },
    scheduleSeconds: { type: Number, default: 30 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

EndpointSchema.index({ enabled: 1 });

export const Endpoint = mongoose.model<IEndpoint>("Endpoint", EndpointSchema);
