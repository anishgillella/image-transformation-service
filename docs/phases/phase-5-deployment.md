# Phase 5: Deployment

## Objective
Deploy the frontend to Vercel and backend to Render, making the application publicly accessible.

---

## 5.1 Pre-Deployment Checklist

### External Accounts Required

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Remove.bg** | Background removal API | https://www.remove.bg/api |
| **Cloudinary** | Image hosting | https://cloudinary.com |
| **Render** | Backend hosting | https://render.com |
| **Vercel** | Frontend hosting | https://vercel.com |
| **GitHub** | Code repository | https://github.com |

### Get Your API Keys

#### Remove.bg
1. Go to https://www.remove.bg/api
2. Sign up / Log in
3. Go to API Keys section
4. Copy your API key

#### Cloudinary
1. Go to https://cloudinary.com
2. Sign up / Log in
3. Go to Dashboard
4. Find:
   - Cloud Name
   - API Key
   - API Secret

---

## 5.2 Prepare Backend for Deployment

### Update package.json

Ensure `backend/package.json` has:

```json
{
  "name": "image-transformer-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Build Locally First

```bash
cd backend
npm run build
```

Verify `dist/` folder is created with compiled JavaScript.

### Create .gitignore

Ensure `backend/.gitignore` contains:

```
node_modules/
dist/
.env
*.log
```

---

## 5.3 Deploy Backend to Render

### Step 1: Push to GitHub

```bash
# From project root
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `image-transformer-api` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### Step 3: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| `PORT` | `10000` (Render's default) |
| `REMOVE_BG_API_KEY` | Your Remove.bg API key |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

### Step 4: Deploy

Click **Create Web Service**. Render will:
1. Clone your repo
2. Run build command
3. Start your server

**Wait for deployment** (2-5 minutes).

### Step 5: Get Backend URL

Once deployed, Render provides a URL like:
```
https://image-transformer-api.onrender.com
```

**Test it:**
```bash
curl https://image-transformer-api.onrender.com/api/health
```

Should return: `{ "status": "ok", ... }`

---

## 5.4 Deploy Frontend to Vercel

### Step 1: Update Environment Variables

Create `frontend/.env.production`:

```env
VITE_API_URL=https://image-transformer-api.onrender.com/api
```

Replace with your actual Render URL.

### Step 2: Create vercel.json (Optional)

Create `frontend/vercel.json` for any custom config:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Step 3: Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: image-transformer
# - Directory: ./
# - Override settings? No
```

#### Option B: Vercel Dashboard

1. Go to https://vercel.com
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-render-url.onrender.com/api`

6. Click **Deploy**

### Step 4: Get Frontend URL

Vercel provides a URL like:
```
https://image-transformer.vercel.app
```

---

## 5.5 Post-Deployment Configuration

### Update CORS (if needed)

If you get CORS errors, update `backend/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://image-transformer.vercel.app',
    'https://your-custom-domain.com'
  ],
  methods: ['GET', 'POST', 'DELETE'],
}));
```

Redeploy backend after changes.

### Custom Domain (Optional)

#### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS instructions

#### Render
1. Go to Service Settings → Custom Domains
2. Add your domain
3. Configure DNS CNAME record

---

## 5.6 Testing the Deployment

### Full Flow Test

1. Open your Vercel URL
2. Verify the page loads correctly
3. Upload an image
4. Wait for processing
5. Verify the result appears
6. Test Copy URL button
7. Test Download button
8. Open the copied URL in a new tab - should show the image

### Troubleshooting

#### "Failed to fetch" or Network Error
- Check backend is running on Render
- Verify CORS is configured
- Check `VITE_API_URL` is correct

#### "Invalid API Key"
- Verify Remove.bg key in Render environment
- Check for extra spaces or quotes

#### Image Upload Fails
- Check Cloudinary credentials
- Verify all three Cloudinary env vars are set

#### Slow Processing
- Render free tier can be slow
- First request may take 30-60s (cold start)
- Subsequent requests are faster

---

## 5.7 Final Checklist

### Backend (Render)
- [ ] Service is deployed and running
- [ ] Health endpoint responds
- [ ] All environment variables set
- [ ] CORS allows frontend origin

### Frontend (Vercel)
- [ ] App is deployed and loads
- [ ] `VITE_API_URL` points to Render backend
- [ ] Upload works end-to-end
- [ ] Results display correctly

### End-to-End
- [ ] Full user flow works
- [ ] Images are hosted on Cloudinary
- [ ] URLs are shareable
- [ ] Delete functionality works

---

## 5.8 Submission

You now have:

1. **Live Frontend URL**: `https://image-transformer.vercel.app`
2. **Live Backend URL**: `https://image-transformer-api.onrender.com`
3. **GitHub Repository**: With all source code

Include all three in your submission!

---

## Deployment Complete!

Your Image Transformation Service is now live and accessible to anyone on the internet.

### Performance Note

Render's free tier "spins down" after 15 minutes of inactivity. First request after spin-down takes 30-60 seconds. This is expected for free tier and acceptable for a demo.

For production, consider upgrading to Render's paid tier ($7/month) for always-on service.
