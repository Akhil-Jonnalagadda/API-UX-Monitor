# Getting Started with API UX Monitor

This guide will help you get the API UX Monitor up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v15 or higher) - or use Docker
- **Docker & Docker Compose** (optional but recommended)

## Quick Start with Docker (Recommended)

The fastest way to get started is using Docker Compose:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd api-ux-monitor

# 2. Start all services
docker-compose up

# Wait for services to start...
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
# Database: localhost:5432
```

That's it! The application is now running with sample data.

## Local Development Setup

If you prefer to run the services locally without Docker:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ../..
```

### 2. Set Up PostgreSQL

**Option A: Using Docker**

```bash
docker run -d \
  --name api-monitor-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=api_monitor \
  -p 5432:5432 \
  postgres:15-alpine
```

**Option B: Using Local PostgreSQL**

```bash
# Create database
createdb api_monitor
```

### 3. Configure Environment Variables

```bash
# Backend environment
cp apps/backend/.env.example apps/backend/.env

# Edit apps/backend/.env if needed:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/api_monitor"
# PORT=4000
```

### 4. Run Database Migrations

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

### 5. Seed Sample Data (Optional)

```bash
cd apps/backend
npx ts-node prisma/seed.ts
```

### 6. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd apps/frontend
npm run dev
```

Or start both with a single command from the root:

```bash
npm run dev
```

### 7. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **API Health Check:** http://localhost:4000/health
- **Prisma Studio:** `npm run db:studio` (from root)

## Project Structure

```
api-ux-monitor/
├── apps/
│   ├── backend/          # Node.js + Express API
│   │   ├── src/
│   │   ├── prisma/       # Database schema and migrations
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── frontend/         # React + Vite app
│       ├── src/
│       │   ├── api/      # API client
│       │   ├── components/
│       │   ├── pages/
│       │   └── styles/
│       └── package.json
│
├── docker-compose.yml
├── README.md
└── package.json
```

## Common Commands

### Development

```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend
```

### Database

```bash
npm run db:migrate       # Run Prisma migrations
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
```

### Testing

```bash
npm run test             # Run all tests
npm run test:backend     # Run backend tests
```

### Docker

```bash
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:build     # Rebuild Docker images
```

### Production Build

```bash
npm run build            # Build both apps
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
```

## Adding Your First Endpoint

1. Navigate to http://localhost:5173/endpoints
2. Click "+ Add Endpoint"
3. Fill in the form:
   - **Name:** My API
   - **URL:** https://api.example.com/health
   - **Method:** GET
   - **Expected Status:** 200
   - **Check Interval:** 30 seconds
4. Click "Create"

The system will start monitoring your endpoint immediately!

## Viewing Metrics

- **Dashboard:** Real-time metrics, charts, and latest checks
- **Endpoints:** Manage monitored endpoints
- **Incidents:** View and replay incidents
- **Alerts:** Configure alert rules

## Troubleshooting

### Port Already in Use

If ports 3000, 4000, or 5432 are already in use:

1. Stop conflicting services
2. Or modify ports in:
   - `docker-compose.yml`
   - `apps/backend/.env` (PORT)
   - `apps/frontend/vite.config.js` (server.port)

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps  # (if using Docker)

# Or
pg_isctl status  # (if using local PostgreSQL)

# Verify DATABASE_URL in apps/backend/.env
```

### Prisma Client Not Generated

```bash
cd apps/backend
npx prisma generate
```

### Frontend Not Loading

```bash
# Clear cache and reinstall
cd apps/frontend
rm -rf node_modules dist .vite
npm install
npm run dev
```

## Next Steps

- Configure alert rules in the Alerts page
- Add multiple endpoints to monitor
- Check the incidents timeline
- Explore the API documentation in the main README

## Need Help?

- Check the main [README.md](README.md)
- Review the [API Documentation](README.md#api-documentation)
- Open an issue on GitHub

Enjoy monitoring! 🚀
