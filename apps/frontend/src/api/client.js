import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Endpoints API
export const endpointsApi = {
  getAll: () => api.get("/endpoints"),
  getById: (id) => api.get(`/endpoints/${id}`),
  create: (data) => api.post("/endpoints", data),
  update: (id, data) => api.put(`/endpoints/${id}`, data),
  delete: (id) => api.delete(`/endpoints/${id}`),
};

// Metrics API
export const metricsApi = {
  getLatest: (params) => api.get("/metrics/latest", { params }),
  getTimeseries: (params) => api.get("/metrics/timeseries", { params }),
  getUptime: (params) => api.get("/metrics/uptime", { params }),
  getDashboard: (params) => api.get("/metrics/dashboard", { params }),
};

// Incidents API
export const incidentsApi = {
  getAll: (params) => api.get("/incidents", { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  getReplay: (id) => api.get(`/incidents/${id}/replay`),
  resolve: (id) => api.put(`/incidents/${id}/resolve`),
  getStats: (params) => api.get("/incidents/stats", { params }),
};

// Alerts API
export const alertsApi = {
  getAll: (params) => api.get("/alerts", { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post("/alerts", data),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export default api;
