# Vercel Deployment Checklist ✅

## Status: READY FOR DEPLOYMENT

### Frontend ✅

- [x] Vite build configured correctly
- [x] Build output: `apps/frontend/dist`
- [x] All dependencies installed
- [x] No hardcoded backend URLs
- [x] Environment variable ready: `VITE_API_URL`

### Vercel Configuration ✅

- [x] vercel.json properly configured
- [x] Build command: `cd apps/frontend && npm install && npm run build`
- [x] Output directory: `apps/frontend/dist`

### GitHub ✅

- [x] Code pushed to: https://github.com/Akhil-Jonnalagadda/API-UX-Monitor
- [x] Latest commit: 369a43f (Vercel config fixed)
- [x] Branch: master

## Deployment Steps (Copy-Paste Ready)

### Step 1: Deploy Frontend to Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Import GitHub repo: `Akhil-Jonnalagadda/API-UX-Monitor`
4. Click **Import**
5. Vercel auto-detects framework (Vite)
6. Click **Deploy**

Wait for build to complete (should take ~2 minutes).

### Step 2: Get Backend API Running

Choose ONE option:

**Option A: Railway (Recommended)**

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select: `Akhil-Jonnalagadda/API-UX-Monitor`
4. Select root directory
5. Click Deploy
6. Add variables:
   - `MONGODB_URI`: (your MongoDB Atlas connection string)
   - `CORS_ORIGIN`: (your vercel frontend URL, e.g., `your-app.vercel.app`)
7. Copy backend URL (e.g., `https://api-ux-monitor.railway.app`)

**Option B: Render**

1. Go to https://render.com
2. New Web Service
3. Connect GitHub
4. Build: `npm run build:backend`
5. Start: `cd apps/backend && npm start`
6. Add same env vars as Railway
7. Copy URL

### Step 3: Connect Frontend to Backend

1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables
3. Add:
   - Key: `VITE_API_URL`
   - Value: (Your backend URL from Step 2, e.g., `https://api-ux-monitor.railway.app`)
4. Click "Save"
5. Go to Deployments → Click latest → Click **Redeploy**
6. Wait ~1 minute for rebuild

### Step 4: Test

1. Go to your Vercel frontend URL
2. Navigate to **Endpoints** → **Add Endpoint**
3. Create sample endpoint:
   - Name: Example API
   - URL: https://jsonplaceholder.typicode.com/todos/1
   - Method: GET
   - Status: 200
4. Wait 30–60 seconds
5. Go to **Dashboard** → Should see "Latest Checks"

## If Deploy Fails

**Frontend build fails on Vercel:**

- Check the build logs in Vercel dashboard
- Look for error starting with "error:"
- Share that error

**Frontend loads but shows "Network Error" or 404:**

- Verify `VITE_API_URL` env var is set in Vercel
- Verify backend is running
- Check browser console (F12) for exact error

**Can't connect to backend:**

- Verify backend deployment is live
- Test backend manually: `https://your-backend-url/health`
- Should return `{"success":true,"message":"API UX Monitor is running"}`

## File Structure (For Reference)

```
api-ux-monitor/
├── vercel.json           ← Tells Vercel how to build
├── apps/
│   ├── frontend/         ← What Vercel builds and deploys
│   │   ├── src/
│   │   ├── dist/         ← Build output (auto-generated)
│   │   ├── package.json
│   │   └── vite.config.js
│   └── backend/          ← Deploy separately (Railway/Render)
└── README.md
```

---

**You're ready!** Just follow the 4 deployment steps above. 🚀
