# AdForge - AI-Powered Ad Generation Platform

AdForge is a full-stack application that generates professional marketing ads using AI. Simply enter a company URL, and AdForge analyzes the brand, extracts products, and creates stunning, platform-optimized advertisements.

## Live Demo

- **Frontend**: [https://image-transformation-service.vercel.app](https://image-transformation-service.vercel.app)
- **Backend API**: [https://image-transformation-service-7r75.onrender.com](https://image-transformation-service-7r75.onrender.com)

## Features

### AdForge - AI Ad Generation
- **Brand Analysis**: Automatically analyze any website to extract brand identity, colors, voice, and products
- **AI Image Generation**: Generate professional ad images using Flux Pro 1.1
- **Smart Copywriting**: AI-generated headlines, body text, CTAs, and hashtags
- **Multiple Ad Styles**: Choose from Minimal, Gradient, Abstract, or Lifestyle styles
- **Platform Optimization**: Export ads sized for Instagram, Facebook, Twitter, LinkedIn, Pinterest, and TikTok
- **Batch Generation**: Generate multiple ads for different products at once

### Campaign Mode
- **Campaign Management**: Create and organize marketing campaigns
- **Multi-Platform Support**: Target multiple social media platforms per campaign
- **Product Selection**: Choose specific products to feature in campaigns
- **Progress Tracking**: Real-time status updates during ad generation

### Image Transformer
- **Background Removal**: Remove backgrounds from images using AI
- **Horizontal Flip**: Automatically flip processed images
- **Cloud Storage**: All images hosted on Cloudinary with shareable URLs

### Cost Tracking
- **Real-time Cost Display**: Track API costs as you generate ads
- **Per-Service Breakdown**: See costs by Gemini, Flux Pro, Cloudinary, etc.
- **Monthly Usage**: View historical spending patterns

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS 4** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Sonner** for toast notifications

### Backend
- **Node.js** with Express 5
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL (Supabase)
- **Multer** for file uploads

### AI Services
- **Google Gemini** (via OpenRouter) - Brand analysis and copywriting
- **Flux Pro 1.1** (via BFL API) - Image generation
- **Remove.bg** - Background removal
- **Cloudinary** - Image hosting and transformations

### Deployment
- **Frontend**: Vercel (free tier)
- **Backend**: Render (free tier)
- **Database**: Supabase PostgreSQL (free tier)

## Project Structure

```
adforge/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── adforge/      # AdForge-specific components
│   │   │   └── campaigns/    # Campaign management components
│   │   ├── services/         # API service calls
│   │   ├── hooks/            # Custom React hooks
│   │   └── App.tsx           # Main application
│   └── package.json
│
├── backend/                  # Express TypeScript API
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   │   ├── adforge.ts    # Ad generation routes
│   │   │   ├── campaigns.ts  # Campaign management
│   │   │   └── images.ts     # Image processing
│   │   ├── services/         # Business logic
│   │   │   ├── gemini.ts     # AI text generation
│   │   │   ├── flux.ts       # AI image generation
│   │   │   ├── cloudinary.ts # Image hosting
│   │   │   └── costTracker.ts # Usage tracking
│   │   └── index.ts          # Server entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (or Supabase account)

### Environment Variables

**Backend (.env)**
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# AI Services
OPENROUTER_API_KEY=your_key
BFL_API_KEY=your_key
PARALLEL_API_KEY=your_key

# Image Services
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
REMOVE_BG_API_KEY=your_key

# Server
PORT=3000
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api
```

### Local Development

**Backend**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:3000` (backend API).

## API Endpoints

### AdForge
- `POST /api/adforge/analyze` - Analyze a company website
- `POST /api/adforge/generate` - Generate an ad from brand profile
- `POST /api/adforge/generate-batch` - Generate multiple ads
- `GET /api/adforge/brand-profiles` - List saved brand profiles
- `GET /api/adforge/ads` - List generated ads

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create a new campaign
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns/:id/generate` - Generate ads for campaign
- `DELETE /api/campaigns/:id` - Delete a campaign

### Images
- `POST /api/images/upload` - Upload and process an image
- `GET /api/images` - List all images
- `DELETE /api/images/:id` - Delete an image

### Costs
- `GET /api/costs` - Get cost summary
- `GET /api/costs/monthly` - Get monthly breakdown
- `GET /api/health` - Health check endpoint

## Deployment

### Deploy Backend to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repo
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables
5. Deploy

### Deploy Frontend to Vercel

1. Import project on [Vercel](https://vercel.com)
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
3. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL + `/api`
4. Deploy

## Cost Estimates (Free Tiers)

| Service | Free Tier |
|---------|-----------|
| Vercel | 100GB bandwidth/month |
| Render | 750 hours/month |
| Supabase | 500MB database, 2GB bandwidth |
| Cloudinary | 25 credits/month |
| OpenRouter | Pay-per-use (~$0.001/request) |
| BFL (Flux) | Pay-per-use (~$0.04/image) |

## License

MIT License - feel free to use this project for learning or as a starting point for your own projects.

---

Built with AdForge
