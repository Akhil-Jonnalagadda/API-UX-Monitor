# API UX Monitor 🚀

API UX Monitor is a lightweight API monitoring system. It runs synthetic checks, tracks uptime/latency, detects incidents, and shows everything in a web dashboard.

## ✅ What It Does

- Monitor API endpoints on a schedule
- Measure uptime and latency
- Detect incidents (downtime or latency spikes)
- Manage alerts and incidents from the UI

## 🧱 Tech Stack

- **Frontend:** React + Vite + Bootstrap
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **Infra:** Docker + Docker Compose

## 🚀 Quick Start (Docker)

```bash
docker-compose up -d --build
```

Open:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## 🧪 Quick Test (UI)

1. Go to **Endpoints** → **Add Endpoint**
2. Use this sample:
   - Name: Example API
   - URL: https://jsonplaceholder.typicode.com/todos/1
   - HTTP Method: GET
   - Headers (JSON): {}
   - Request Body (JSON): {}
   - Expected Status: 200
   - Check Interval: 30
   - Enabled: checked

3. Click **Create**
4. Wait ~30–60 seconds
5. Go to **Dashboard** → **Latest Checks**

## 🔧 Environment Variables (Backend)

You can set these in Docker or in apps/backend/.env:

```
PORT=4000
MONGODB_URI=mongodb://mongodb:27017/api_monitor
CHECK_INTERVAL_SECONDS=30
CONSECUTIVE_FAILURES_THRESHOLD=3
LATENCY_SPIKE_THRESHOLD_MS=2000
LATENCY_SPIKE_WINDOW_MINUTES=5
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## 🔌 API Endpoints

### Endpoints

- POST /api/endpoints
- GET /api/endpoints
- GET /api/endpoints/:id
- PUT /api/endpoints/:id
- DELETE /api/endpoints/:id

### Metrics

- GET /api/metrics/dashboard
- GET /api/metrics/latest
- GET /api/metrics/timeseries
- GET /api/metrics/uptime

### Incidents

- GET /api/incidents
- GET /api/incidents/:id
- GET /api/incidents/:id/replay
- PUT /api/incidents/:id/resolve
- GET /api/incidents/stats

### Alerts

- GET /api/alerts
- POST /api/alerts
- PUT /api/alerts/:id
- DELETE /api/alerts/:id

## 🧰 Troubleshooting

- If the UI shows **Network Error**, check the backend is up:
  - http://localhost:4000/health
- If Create fails, ensure Headers/Body are valid JSON or leave them empty.

## 📁 Project Structure

```
apps/
   backend/
      src/
   frontend/
      src/
docker-compose.yml
README.md
```

## 📝 License

MIT
