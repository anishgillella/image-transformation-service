# Image Transformation Service - Technical Documentation

## Project Summary

A web application that allows users to upload images, automatically remove backgrounds using AI, flip them horizontally, and receive a shareable URL.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + TypeScript + Vite | User interface |
| **Backend** | Node.js + Express + TypeScript | API server |
| **Background Removal** | Remove.bg API | AI-powered background removal |
| **Image Processing** | Sharp | Horizontal flip transformation |
| **Image Hosting** | Cloudinary | Store and serve processed images |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Icons** | Lucide React | Clean iconography |
| **Notifications** | Sonner | Toast notifications |

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    Frontend     │  HTTP   │    Backend      │  HTTP   │ External APIs   │
│    (React)      │ ──────> │   (Express)     │ ──────> │                 │
│                 │ <────── │                 │ <────── │ • Remove.bg     │
│  localhost:5173 │         │  localhost:3000 │         │ • Cloudinary    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Core User Flow

1. User drops image on upload zone
2. Frontend sends image to backend
3. Backend sends image to Remove.bg → receives transparent PNG
4. Backend uses Sharp to flip image horizontally
5. Backend uploads result to Cloudinary → receives URL
6. Backend returns URL to frontend
7. Frontend displays result with shareable link

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images/upload` | Upload and process an image |
| GET | `/api/images` | List all images (session) |
| GET | `/api/images/:id` | Get single image details |
| DELETE | `/api/images/:id` | Delete an image |

## Project Structure

```
geneva/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.tsx
│   │   │   ├── ProcessingState.tsx
│   │   │   ├── ImageResult.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   └── ImageCard.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── hooks/
│   │   │   └── useImageUpload.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── images.ts
│   │   ├── services/
│   │   │   ├── removeBg.ts
│   │   │   ├── imageProcessor.ts
│   │   │   └── cloudinary.ts
│   │   ├── middleware/
│   │   │   └── upload.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── overview.md (this file)
│   └── phases/
│       ├── phase-1-setup.md
│       ├── phase-2-backend.md
│       ├── phase-3-frontend.md
│       ├── phase-4-polish.md
│       └── phase-5-deployment.md
│
└── README.md
```

## Design Principles

1. **Simplicity** - One purpose, zero clutter
2. **Delight** - Smooth animations, satisfying feedback
3. **Speed** - Fast uploads, instant feedback
4. **Clarity** - User always knows what's happening

## External Accounts Required

| Service | Free Tier | Sign Up |
|---------|-----------|---------|
| Remove.bg | 50 images/month | https://www.remove.bg/api |
| Cloudinary | 25GB storage | https://cloudinary.com |

## Implementation Phases

1. **Phase 1: Setup** - Initialize both projects with dependencies
2. **Phase 2: Backend** - Build API and integrations
3. **Phase 3: Frontend** - Build UI components
4. **Phase 4: Polish** - Animations and microinteractions
5. **Phase 5: Deployment** - Deploy to Render + Vercel
