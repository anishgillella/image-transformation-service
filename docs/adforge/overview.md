# AdForge - AI-Powered Brand-Aware Ad Generator

## Vision

AdForge is an intelligent ad creation tool that **deeply understands a company's brand** before generating anything. Unlike generic image generators, AdForge produces ads that feel like they came from the company's own marketing team.

## What Makes AdForge Different

| Feature | Generic Tools | AdForge |
|---------|---------------|---------|
| Brand understanding | None - just generates images | Analyzes company URL, extracts brand DNA |
| Output quality | Generic stock-photo feel | Brand-consistent, purposeful |
| Ad copy | Image only | Complete ad: image + headline + copy + CTA |
| User control | Prompt engineering required | Guided choices, optional customization |

## Core Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  1. RESEARCH          2. ANALYZE           3. CREATE          4. OUTPUT │
│  ───────────          ──────────           ────────           ───────── │
│                                                                         │
│  User enters    →    AI extracts     →    AI generates   →   Complete  │
│  company URL         brand profile        ad + copy           ad ready  │
│                                                                         │
│  "uplane.com"        Colors, voice,       Brand-matched       Image +   │
│                      audience, style      visuals             Copy +    │
│                                                               CTA       │
│                                                                         │
│              ┌─────────────────────────────────────┐                    │
│              │  Optional: User uploads product     │                    │
│              │  image for AI to incorporate        │                    │
│              └─────────────────────────────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Research** | Parallel AI | Scrape and structure company website |
| **Brand Analysis** | Gemini 3 Flash (OpenRouter) | Extract brand attributes from content |
| **Image Generation** | BFL Flux | Create brand-aware ad visuals |
| **Image Editing** | BFL Flux Fill | Place products in generated scenes |
| **Background Removal** | Remove.bg | Isolate products from backgrounds |
| **Image Hosting** | Cloudinary | Store and serve generated ads |
| **Backend** | Node.js + Express + TypeScript | API orchestration |
| **Frontend** | React + TypeScript + Vite | User interface |

## Key Features

### 1. Brand Profile Generation
- Visual identity (colors, imagery style)
- Voice/tone (professional, playful, bold)
- Target audience (demographics, psychographics)
- Unique selling propositions
- **Displayed to user for validation/editing**

### 2. Guided Style Selection
- Minimal (clean, white space)
- Gradient (modern, trendy)
- Abstract (artistic, creative)
- Lifestyle (contextual, relatable)
- Optional custom instructions

### 3. Complete Ad Output
- Hero image (1024x1024)
- Headline
- Body copy
- Call-to-action
- Suggested hashtags

### 4. Two Generation Paths
- **With product image**: AI edits/places product in brand scene
- **Without product image**: AI generates complete ad from brand understanding

## Competitive Analysis

### AdCreative.ai
- **Strength**: 14x conversion improvement claims, brand consistency
- **Weakness**: Template-heavy, less creative freedom
- **AdForge differentiator**: Deeper brand understanding from URL analysis

### Pencil AI
- **Strength**: Multiple AI models, enterprise features
- **Weakness**: Complex, requires signup, no pricing transparency
- **AdForge differentiator**: Simpler UX, immediate value, transparent

## Design Principles

### 1. The "Magic Moment"
Brand profile reveal after URL analysis - user sees AI "gets" their brand before any generation. Builds trust and credibility.

### 2. Progressive Disclosure
- Step 1: Just enter URL (simple)
- Step 2: See brand profile (impressive)
- Step 3: Choose style (guided)
- Step 4: Get complete ad (valuable)

### 3. Premium Feel
- Smooth Framer Motion animations
- Clean, minimal interface
- Thoughtful microinteractions
- Apple-inspired design language

## Implementation Phases

| Phase | Focus | Deliverables |
|-------|-------|--------------|
| Phase 1 | Backend Services | Parallel AI, Gemini, Flux integrations |
| Phase 2 | Brand Analysis | URL input, profile extraction, display |
| Phase 3 | Ad Generation | Style selection, image generation, compositing |
| Phase 4 | Copy Generation | Headlines, body, CTAs from brand context |
| Phase 5 | Frontend Polish | Animations, UX refinements, responsive |
| Phase 6 | Integration | Connect to existing app as new tab |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/adforge/analyze` | Analyze company URL, return brand profile |
| POST | `/api/adforge/generate` | Generate ad from brand profile + options |
| POST | `/api/adforge/regenerate-copy` | Regenerate just the ad copy |
| GET | `/api/adforge/history` | Get previously generated ads |
| DELETE | `/api/adforge/:id` | Delete a generated ad |

## Data Models

### BrandProfile
```typescript
interface BrandProfile {
  companyName: string;
  url: string;
  personality: string[];        // ["bold", "innovative", "tech-forward"]
  colors: {
    primary: string;            // "#6366f1"
    secondary: string;          // "#000000"
    accent: string;             // "#ffffff"
  };
  targetAudience: string;       // "Marketing teams at growth-stage startups"
  voiceTone: string;            // "Confident, direct, no-nonsense"
  visualStyle: string;          // "Minimal, modern, high-contrast"
  industry: string;             // "MarTech / AI Software"
  uniqueSellingPoints: string[];
  analyzedAt: Date;
}
```

### GeneratedAd
```typescript
interface GeneratedAd {
  id: string;
  brandProfile: BrandProfile;
  style: 'minimal' | 'gradient' | 'abstract' | 'lifestyle';
  customInstructions?: string;
  imageUrl: string;
  copy: {
    headline: string;
    body: string;
    cta: string;
    hashtags: string[];
  };
  hasProductImage: boolean;
  productImageUrl?: string;
  createdAt: Date;
}
```

## Cost Per Ad

| Component | Cost |
|-----------|------|
| Parallel AI (research) | ~$0.01 |
| Gemini 3 Flash (analysis + copy) | ~$0.005 |
| BFL Flux (image generation) | ~$0.03-0.05 |
| Remove.bg (if product image) | ~$0.09 or free tier |
| **Total** | **~$0.05-0.15 per ad** |

## Success Metrics

1. **Brand accuracy** - Does the profile match the actual brand?
2. **Visual quality** - Are generated images professional?
3. **Copy relevance** - Does the text match brand voice?
4. **User satisfaction** - Would users share/use these ads?
5. **Generation speed** - Under 30 seconds for complete ad

## External Accounts Required

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Parallel AI | Web research | https://parallel.ai |
| OpenRouter | Gemini 3 Flash access | https://openrouter.ai |
| BFL | Flux image generation | https://bfl.ml |
| Remove.bg | Background removal | https://remove.bg/api |
| Cloudinary | Image hosting | https://cloudinary.com |
