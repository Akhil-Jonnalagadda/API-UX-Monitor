# Deployment Guide - API UX Monitor

## Quick Deployment Steps

### Step 1: Deploy Backend (Railway or Render)

**Using Railway (Recommended - Free tier)**

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub"
4. Connect your repo: `Akhil-Jonnalagadda/API-UX-Monitor`
5. Railway auto-detects the monorepo. Select `apps/backend`
6. In Variables tab, add:
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `NODE_ENV`: production
   - `PORT`: 4000
   - `CORS_ORIGIN`: your-frontend-vercel-url.vercel.app
7. Deploy
8. Copy the generated URL (e.g., https://api-ux-monitor-prod.up.railway.app)

**OR Using Render**

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Build: `npm run build:backend`
5. Start: `cd apps/backend && npm start`
6. Add env vars same as above
7. Deploy

### Step 2: Connect Frontend to Backend (Vercel)

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add: `VITE_API_URL` = `https://your-backend-url.railway.app` (from Step 1)
4. Redeploy: Click "Deployments" → "Redeploy" on latest commit

### Step 3: Verify

1. Go to your frontend URL (vercel.app)
2. Go to Endpoints → Add Endpoint
3. Use: https://jsonplaceholder.typicode.com/todos/1
4. Should work without 404 errors

## Summary

- **Frontend:** Vercel (free)
- **Backend:** Railway/Render (free tier)
- **Database:** MongoDB Atlas (free tier)

All free! Total setup time: ~10 minutes.
