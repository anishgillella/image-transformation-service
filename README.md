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

## How to Use AdForge

### Quick Start Guide

AdForge offers three main ways to create ads: **Quick Generate**, **Campaigns**, and **Image Transformer**. Here's how to use each feature.

---

### 1. Quick Generate (Single Ad Creation)

The fastest way to create a single ad from any website.

**Steps:**
1. **Navigate to AdForge** from the home page
2. **Enter a URL** - Paste any company website or product page URL
3. **Choose URL Type**:
   - **Brand Page**: For homepages - extracts overall brand identity and all products
   - **Product Page**: For specific product URLs - focuses on that product's details
4. **Click "Analyze"** - AI extracts brand colors, voice, products, and selling points
5. **Review & Edit** - Adjust any brand details if needed
6. **Select a Product** (optional) - Choose a specific product to feature, or create a brand-level ad
7. **Choose an Ad Style**:
   - **Minimal**: Clean, premium aesthetic with lots of whitespace
   - **Gradient**: Modern, tech-forward with dynamic color transitions
   - **Abstract**: Artistic, creative with bold shapes and textures
   - **Lifestyle**: Aspirational, showing products in real-world contexts
8. **Add Custom Instructions** (optional) - Guide the AI with specific directions
9. **Generate** - Creates an AI image and matching ad copy
10. **Export** - Download in any platform size (Instagram, Facebook, Twitter, etc.)

**Pro Tips:**
- Use product URLs for more targeted ads with specific features
- The AI uses your brand colors automatically in generated images
- Try different styles to see which resonates with your brand

---

### 2. Campaign Mode (Multi-Ad Generation)

Create organized campaigns with multiple ads across different platforms.

**Steps:**
1. **Go to Campaigns** from the navigation
2. **Create New Campaign**:
   - Give it a name (e.g., "Summer Sale 2024")
   - Select a brand profile (or analyze a new URL first)
   - Choose target platforms (Instagram Feed, Stories, Facebook, Twitter, etc.)
   - Select which products to include
   - Choose an ad style
   - Add campaign-wide custom instructions
3. **Generate Campaign** - Creates ads for each product × platform combination
4. **Monitor Progress** - Watch real-time status as ads are generated
5. **Review Results** - See all generated ads in the campaign view
6. **Manage Ads** - Edit copy, regenerate images, or remove individual ads

**Campaign Features:**
- **Multi-Platform**: One campaign can target 7+ social platforms
- **Product Selection**: Choose specific products or include a brand-level ad
- **Batch Generation**: Generate dozens of ads with one click
- **Status Tracking**: See generating, active, or draft status
- **Cost Tracking**: View total campaign cost and per-ad breakdown

---

### 3. Image Transformer (Background Removal)

Remove backgrounds from product images for use in ads.

**Steps:**
1. **Navigate to Image Transformer** from the home page
2. **Upload an Image** - Drag & drop or click to select a product image
3. **Process** - AI removes the background automatically
4. **Download** - Get the transparent PNG for use in your ads

**Best For:**
- Product photos with busy backgrounds
- Creating assets for the Quick Generate "with product image" mode
- Preparing images for e-commerce listings

---

### 4. Usage Dashboard (Cost Tracking)

Monitor your API spending across all services.

**Steps:**
1. **Click "Usage" in the navigation**
2. **View Total Spending** - See all-time and current month costs
3. **By Service Tab** - Breakdown by Gemini, Flux Pro, Remove.bg, etc.
4. **By Campaign Tab** - See costs per campaign with ad counts
5. **Click any campaign** - View detailed per-ad cost breakdown

**Cost Breakdown:**
- **Gemini Flash**: ~$0.001 per ad copy generation
- **Flux Pro**: $0.04 per image generation
- **Remove.bg**: $0.20 per background removal
- **Cloudinary**: Free tier for image hosting

---

### Workflow Examples

#### Example 1: Launch a New Product
1. Go to Quick Generate
2. Enter your product page URL (select "Product Page" type)
3. Review the extracted product details
4. Generate ads in multiple styles
5. Export for each social platform you use

#### Example 2: Monthly Content Calendar
1. Analyze your brand homepage once
2. Create a campaign for each week/theme
3. Select different products for variety
4. Generate all ads in batch
5. Download and schedule in your social media tool

#### Example 3: A/B Testing Ad Creatives
1. Generate the same product with different styles (Minimal vs. Lifestyle)
2. Use "Regenerate Copy" to get multiple headline options
3. Export both versions
4. Test which performs better with your audience

---

### Tips for Best Results

1. **URL Quality Matters**: Pages with clear product images and descriptions produce better ads
2. **Review Brand Analysis**: Correct any misidentified colors or voice before generating
3. **Use Custom Instructions**: Be specific - "Focus on the eco-friendly materials" works better than "make it good"
4. **Try Multiple Styles**: Different styles work better for different industries
5. **Platform Optimization**: Instagram Story ads (vertical) need different composition than Twitter (horizontal)

---

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
