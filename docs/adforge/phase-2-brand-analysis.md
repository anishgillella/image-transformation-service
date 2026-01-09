# Phase 2: Brand Analysis

## Objective
Build the brand analysis pipeline: URL input → web scraping → LLM analysis → brand profile display.

---

## 2.1 Brand Analysis Route

Create `backend/src/routes/adforge.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { extractWebContent } from '../services/parallelAi';
import { analyzeBrand, generateAdCopy, generateImagePrompt } from '../services/gemini';
import { generateImage, fillImage, createMaskFromTransparent } from '../services/flux';
import { removeBackground } from '../services/removeBg';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary';
import { BrandProfile, GeneratedAd, AdStyle } from '../types';
import { upload } from '../middleware/upload';

const router = Router();

// In-memory storage
const brandProfiles: Map<string, BrandProfile> = new Map();
const generatedAds: Map<string, GeneratedAd> = new Map();

/**
 * POST /api/adforge/analyze
 * Analyze a company URL and return brand profile
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ success: false, error: 'URL is required' });
      return;
    }

    // Validate URL format
    let validUrl: string;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      validUrl = parsed.toString();
    } catch {
      res.status(400).json({ success: false, error: 'Invalid URL format' });
      return;
    }

    console.log(`Analyzing brand: ${validUrl}`);

    // Step 1: Extract website content
    console.log('Extracting website content...');
    const webContent = await extractWebContent(validUrl);

    // Step 2: Analyze brand with LLM
    console.log('Analyzing brand with AI...');
    const analysisRaw = await analyzeBrand(webContent.content, validUrl);

    // Parse JSON from LLM response
    let brandData: any;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = analysisRaw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, analysisRaw];
      brandData = JSON.parse(jsonMatch[1] || analysisRaw);
    } catch (parseError) {
      console.error('Failed to parse brand analysis:', analysisRaw);
      res.status(500).json({ success: false, error: 'Failed to parse brand analysis' });
      return;
    }

    // Create brand profile
    const brandProfile: BrandProfile = {
      companyName: brandData.companyName || webContent.title || 'Unknown',
      url: validUrl,
      personality: brandData.personality || [],
      colors: brandData.colors || { primary: '#000000', secondary: '#ffffff', accent: '#0066ff' },
      targetAudience: brandData.targetAudience || '',
      voiceTone: brandData.voiceTone || '',
      visualStyle: brandData.visualStyle || '',
      industry: brandData.industry || '',
      uniqueSellingPoints: brandData.uniqueSellingPoints || [],
      analyzedAt: new Date(),
    };

    // Store profile
    const profileId = Buffer.from(validUrl).toString('base64').replace(/[/+=]/g, '');
    brandProfiles.set(profileId, brandProfile);

    console.log(`Brand analysis complete: ${brandProfile.companyName}`);

    res.json({
      success: true,
      profileId,
      brandProfile,
    });

  } catch (error) {
    console.error('Error analyzing brand:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze brand',
    });
  }
});

/**
 * GET /api/adforge/profile/:id
 * Get a stored brand profile
 */
router.get('/profile/:id', (req: Request, res: Response) => {
  const profile = brandProfiles.get(req.params.id);

  if (!profile) {
    res.status(404).json({ success: false, error: 'Brand profile not found' });
    return;
  }

  res.json({ success: true, brandProfile: profile });
});

/**
 * PUT /api/adforge/profile/:id
 * Update a brand profile (user corrections)
 */
router.put('/profile/:id', (req: Request, res: Response) => {
  const existingProfile = brandProfiles.get(req.params.id);

  if (!existingProfile) {
    res.status(404).json({ success: false, error: 'Brand profile not found' });
    return;
  }

  const updates = req.body;
  const updatedProfile: BrandProfile = {
    ...existingProfile,
    ...updates,
    analyzedAt: existingProfile.analyzedAt, // Preserve original analysis time
  };

  brandProfiles.set(req.params.id, updatedProfile);

  res.json({ success: true, brandProfile: updatedProfile });
});

export default router;
```

---

## 2.2 Register Route in Server

Update `backend/src/index.ts`:

```typescript
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import imageRoutes from './routes/images';
import adforgeRoutes from './routes/adforge';  // Add this

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Increase limit for base64 images

// Routes
app.use('/api/images', imageRoutes);
app.use('/api/adforge', adforgeRoutes);  // Add this

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 2.3 Frontend Types

Add to `frontend/src/types/index.ts`:

```typescript
// Existing types...

// AdForge types
export interface BrandProfile {
  companyName: string;
  url: string;
  personality: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  targetAudience: string;
  voiceTone: string;
  visualStyle: string;
  industry: string;
  uniqueSellingPoints: string[];
  analyzedAt: string;
}

export interface AnalyzeResponse {
  success: boolean;
  profileId?: string;
  brandProfile?: BrandProfile;
  error?: string;
}

export type AdStyle = 'minimal' | 'gradient' | 'abstract' | 'lifestyle';

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface GeneratedAd {
  id: string;
  brandProfile: BrandProfile;
  style: AdStyle;
  imageUrl: string;
  copy: AdCopy;
  hasProductImage: boolean;
  createdAt: string;
}

export type AdForgeState =
  | 'idle'
  | 'analyzing'
  | 'profile-ready'
  | 'configuring'
  | 'generating'
  | 'complete'
  | 'error';
```

---

## 2.4 Frontend API Service

Create `frontend/src/services/adforge-api.ts`:

```typescript
import type { BrandProfile, AnalyzeResponse, AdStyle, GeneratedAd } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Analyze a company URL and get brand profile
 */
export async function analyzeCompany(url: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/adforge/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  return response.json();
}

/**
 * Get a stored brand profile
 */
export async function getBrandProfile(profileId: string): Promise<BrandProfile | null> {
  const response = await fetch(`${API_URL}/adforge/profile/${profileId}`);
  const data = await response.json();
  return data.success ? data.brandProfile : null;
}

/**
 * Update a brand profile
 */
export async function updateBrandProfile(
  profileId: string,
  updates: Partial<BrandProfile>
): Promise<BrandProfile | null> {
  const response = await fetch(`${API_URL}/adforge/profile/${profileId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const data = await response.json();
  return data.success ? data.brandProfile : null;
}

/**
 * Generate an ad
 */
export async function generateAd(options: {
  profileId: string;
  style: AdStyle;
  customInstructions?: string;
  productImage?: File;
}): Promise<{ success: boolean; ad?: GeneratedAd; error?: string }> {
  const formData = new FormData();
  formData.append('profileId', options.profileId);
  formData.append('style', options.style);

  if (options.customInstructions) {
    formData.append('customInstructions', options.customInstructions);
  }

  if (options.productImage) {
    formData.append('productImage', options.productImage);
  }

  const response = await fetch(`${API_URL}/adforge/generate`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}
```

---

## 2.5 URL Input Component

Create `frontend/src/components/adforge/UrlInput.tsx`:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onAnalyze(url.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/20 transition-all">
          <Globe size={24} className="text-gray-400 flex-shrink-0" />

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter company website (e.g., uplane.com)"
            disabled={isLoading}
            className="flex-1 text-lg outline-none bg-transparent placeholder:text-gray-400 disabled:opacity-50"
          />

          <motion.button
            type="submit"
            disabled={!url.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-800"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </div>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        We'll analyze the website to understand the brand's personality, colors, and style.
      </p>
    </motion.div>
  );
}
```

---

## 2.6 Brand Profile Display Component

Create `frontend/src/components/adforge/BrandProfile.tsx`:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil, Sparkles } from 'lucide-react';
import type { BrandProfile as BrandProfileType } from '../../types';

interface BrandProfileProps {
  profile: BrandProfileType;
  onConfirm: () => void;
  onEdit: (updates: Partial<BrandProfileType>) => void;
}

export function BrandProfile({ profile, onConfirm, onEdit }: BrandProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSaveEdit = () => {
    onEdit(editedProfile);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="p-2 rounded-full bg-[#0066FF]/10">
          <Sparkles size={24} className="text-[#0066FF]" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {profile.companyName}
          </h2>
          <p className="text-sm text-gray-500">{profile.url}</p>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {/* Colors */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Brand Colors
          </h3>
          <div className="flex gap-3">
            {Object.entries(profile.colors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg border border-gray-200 shadow-inner"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="text-xs text-gray-500 capitalize">{name}</p>
                  <p className="text-sm font-mono">{color}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Personality
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.personality.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-6 p-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Target Audience
            </h3>
            <p className="text-gray-900">{profile.targetAudience}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Voice & Tone
            </h3>
            <p className="text-gray-900">{profile.voiceTone}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Visual Style
            </h3>
            <p className="text-gray-900">{profile.visualStyle}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Industry
            </h3>
            <p className="text-gray-900">{profile.industry}</p>
          </div>
        </div>

        {/* USPs */}
        <div className="p-6 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Unique Selling Points
          </h3>
          <ul className="space-y-2">
            {profile.uniqueSellingPoints.map((usp, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-[#0066FF] mt-0.5">•</span>
                <span className="text-gray-700">{usp}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-4 mt-6"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          <Pencil size={18} />
          Edit Details
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          <Check size={18} />
          Looks Right
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
```

---

## 2.7 Analyzing State Component

Create `frontend/src/components/adforge/AnalyzingState.tsx`:

```tsx
import { motion } from 'framer-motion';
import { Globe, Brain, Palette, Target } from 'lucide-react';

interface AnalyzingStateProps {
  url: string;
}

const steps = [
  { icon: Globe, label: 'Fetching website content' },
  { icon: Brain, label: 'Analyzing brand personality' },
  { icon: Palette, label: 'Extracting visual identity' },
  { icon: Target, label: 'Identifying target audience' },
];

export function AnalyzingState({ url }: AnalyzingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-[#0066FF]/10 flex items-center justify-center mb-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Brain size={40} className="text-[#0066FF]" />
        </motion.div>
      </motion.div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Analyzing Brand
      </h2>
      <p className="text-gray-500 mb-8">{url}</p>

      {/* Steps Animation */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.5 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.3,
              }}
              className="p-2 rounded-lg bg-gray-100"
            >
              <step.icon size={20} className="text-gray-600" />
            </motion.div>
            <span className="text-gray-700">{step.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
```

---

## 2.8 Verification Checklist

### Backend
- [ ] `/api/adforge/analyze` receives URL
- [ ] Parallel AI extracts website content
- [ ] Gemini analyzes and returns JSON
- [ ] Brand profile is stored and returned
- [ ] Profile can be retrieved by ID
- [ ] Profile can be updated

### Frontend
- [ ] URL input component works
- [ ] Loading state shows analysis progress
- [ ] Brand profile displays all fields
- [ ] Colors render correctly
- [ ] "Looks Right" button works
- [ ] "Edit Details" button works

---

## Next Phase

Once brand analysis is working, proceed to **Phase 3: Ad Generation** to build the style selection and image generation pipeline.
