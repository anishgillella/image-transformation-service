# Phase 5: Testing & Deployment

## Objective
Test the complete AdForge flow end-to-end and deploy the updated application.

---

## 5.1 Local Testing Checklist

### Backend Tests

Run backend and test each endpoint:

```bash
cd backend
npm run dev
```

#### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

#### Test 2: Brand Analysis
```bash
curl -X POST http://localhost:3000/api/adforge/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://uplane.com"}'

# Expected: Brand profile JSON with companyName, colors, personality, etc.
```

#### Test 3: Get Profile
```bash
curl http://localhost:3000/api/adforge/profile/{profileId}
# Use profileId from previous response
```

#### Test 4: Generate Ad (without product image)
```bash
curl -X POST http://localhost:3000/api/adforge/generate \
  -F "profileId={profileId}" \
  -F "style=minimal"

# Expected: Generated ad with imageUrl and copy
```

#### Test 5: Generate Ad (with product image)
```bash
curl -X POST http://localhost:3000/api/adforge/generate \
  -F "profileId={profileId}" \
  -F "style=gradient" \
  -F "productImage=@/path/to/product.png"
```

#### Test 6: Regenerate Copy
```bash
curl -X POST http://localhost:3000/api/adforge/{adId}/regenerate-copy
```

#### Test 7: Delete Ad
```bash
curl -X DELETE http://localhost:3000/api/adforge/{adId}
```

---

### Frontend Tests

Run frontend and test UI flow:

```bash
cd frontend
npm run dev
```

#### Test Flow 1: Complete AdForge Flow
1. Open http://localhost:5173
2. Verify "AdForge" tab is active
3. Enter a company URL (e.g., "stripe.com")
4. Verify analyzing animation appears
5. Verify brand profile displays correctly
6. Click "Looks Right"
7. Select a style (e.g., "Gradient")
8. Click "Generate Ad"
9. Verify generating animation appears
10. Verify ad result shows image and copy
11. Test copy buttons
12. Test download button
13. Test "Regenerate Copy"
14. Test "Start Over"

#### Test Flow 2: With Product Image
1. Go through steps 1-6 above
2. Upload a product image
3. Complete generation
4. Verify product appears in generated image

#### Test Flow 3: Image Transformer Tab
1. Switch to "Image Transformer" tab
2. Verify original functionality still works
3. Upload an image
4. Verify processing completes
5. Verify result displays

#### Test Flow 4: Error Handling
1. Enter invalid URL
2. Verify error toast appears
3. Try with slow/unavailable website
4. Verify timeout handling

---

## 5.2 Pre-Deployment Checklist

### Environment Variables

Ensure all variables are set for production:

**Backend (.env for Render):**
```env
PORT=10000
NODE_ENV=production

# Existing
REMOVE_BG_API_KEY=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# AdForge
PARALLEL_API_KEY=xxx
OPENROUTER_API_KEY=xxx
BFL_API_KEY=xxx
```

**Frontend (.env.production for Vercel):**
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

### Update CORS

Update `backend/src/index.ts` for production origins:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

### Build Test

```bash
# Backend
cd backend
npm run build
npm start  # Test production build locally

# Frontend
cd frontend
npm run build
npm run preview  # Test production build locally
```

---

## 5.3 Deploy Backend to Render

### Update Render Service

1. Go to Render dashboard
2. Select your existing backend service
3. Go to **Environment** tab
4. Add new environment variables:
   - `PARALLEL_API_KEY`
   - `OPENROUTER_API_KEY`
   - `BFL_API_KEY`

5. Trigger redeploy (or push to GitHub)

### Verify Backend Deployment

```bash
curl https://your-backend.onrender.com/api/health

curl -X POST https://your-backend.onrender.com/api/adforge/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

## 5.4 Deploy Frontend to Vercel

### Update Vercel Project

1. Go to Vercel dashboard
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Verify `VITE_API_URL` points to your Render backend

5. Trigger redeploy (or push to GitHub)

### Verify Frontend Deployment

1. Open your Vercel URL
2. Test complete AdForge flow
3. Test Image Transformer flow
4. Verify no console errors

---

## 5.5 Performance Considerations

### Cold Starts

Render free tier has cold starts (~30-60 seconds). First request after idle may be slow.

**Mitigation options:**
1. Upgrade to Render paid tier ($7/month)
2. Add health check ping to keep service warm
3. Show user-friendly message about initial load time

### API Rate Limits

Monitor usage to stay within free tiers:

| Service | Free Tier Limit |
|---------|-----------------|
| Parallel AI | Check their limits |
| OpenRouter | Pay-as-you-go |
| BFL Flux | Pay-as-you-go |
| Remove.bg | 50 images/month |
| Cloudinary | 25GB storage |

### Image Size Optimization

Consider adding image compression before Cloudinary upload:

```typescript
// Compress to reduce storage and load times
const optimizedImage = await sharp(imageBuffer)
  .resize(1024, 1024, { fit: 'inside' })
  .png({ quality: 85 })
  .toBuffer();
```

---

## 5.6 Monitoring & Debugging

### Add Request Logging

Add to `backend/src/index.ts`:

```typescript
// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});
```

### Frontend Error Tracking

Consider adding error boundary and logging:

```tsx
// ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('AdForge Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 5.7 Final Submission Checklist

### URLs to Submit

1. **Live Frontend URL**: `https://your-app.vercel.app`
2. **Live Backend URL**: `https://your-backend.onrender.com`
3. **GitHub Repository**: `https://github.com/your-username/your-repo`

### Demo Video (Optional but Impressive)

Record a short demo showing:
1. Enter company URL
2. Brand analysis reveal (the "magic moment")
3. Style selection
4. Ad generation with product image
5. Final result with copy
6. Download functionality

Tools: Loom, QuickTime, or screen recording software

### README Update

Update the root README.md with:
- Live demo links
- AdForge feature description
- Tech stack summary
- Setup instructions for both features

---

## 5.8 Post-Launch

### Quick Fixes

If issues arise after deployment:

1. **Check Render logs** for backend errors
2. **Check browser console** for frontend errors
3. **Verify environment variables** are set correctly
4. **Test API endpoints** individually with curl

### Gather Feedback

After submission, be ready to discuss:
- Technical decisions (why Flux over SDXL, etc.)
- Architecture choices
- Potential improvements
- Scale considerations

---

## Deployment Complete!

Your AdForge-enhanced Image Transformation Service is now live with:

- ✅ Original image transformer functionality
- ✅ AI-powered brand analysis
- ✅ Brand-aware ad generation
- ✅ Intelligent copy generation
- ✅ Product image compositing
- ✅ Premium UI/UX with animations

**Total feature set that demonstrates:**
- Full-stack TypeScript proficiency
- AI/LLM integration (exactly what Uplane does)
- Image processing pipelines
- Third-party API orchestration
- Modern React patterns
- Thoughtful UX design

Good luck with your Uplane application! 🚀
