import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "../utils/logger";
import { config } from "../config";

let io: SocketIOServer | null = null;

export const initializeWebSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });

    // Client can subscribe to specific endpoints
    socket.on("subscribe:endpoint", (endpointId: string) => {
      socket.join(`endpoint:${endpointId}`);
      logger.debug(`Client ${socket.id} subscribed to endpoint ${endpointId}`);
    });

    socket.on("unsubscribe:endpoint", (endpointId: string) => {
      socket.leave(`endpoint:${endpointId}`);
      logger.debug(
        `Client ${socket.id} unsubscribed from endpoint ${endpointId}`,
      );
    });
  });

  logger.info("WebSocket server initialized");

  return io;
};

// Emit events
export const emitCheckResult = (endpointId: string, data: any) => {
  if (io) {
    io.to(`endpoint:${endpointId}`).emit("check:result", data);
    io.emit("check:update", data); // Broadcast to all clients
  }
};

export const emitIncident = (incident: any) => {
  if (io) {
    io.to(`endpoint:${incident.endpointId}`).emit("incident:new", incident);
    io.emit("incident:created", incident); // Broadcast to all clients
  }
};

export const emitIncidentResolved = (incident: any) => {
  if (io) {
    io.to(`endpoint:${incident.endpointId}`).emit(
      "incident:resolved",
      incident,
    );
    io.emit("incident:updated", incident); // Broadcast to all clients
  }
};

export const emitMetricsUpdate = (data: any) => {
  if (io) {
    io.emit("metrics:update", data);
  }
};

export const getIO = () => io;
