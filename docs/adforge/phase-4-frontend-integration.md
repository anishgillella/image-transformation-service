# Phase 4: Frontend Integration

## Objective
Integrate AdForge as a new tab in the existing app with complete user flow and polish.

---

## 4.1 Update App Structure

Create `frontend/src/components/adforge/AdForge.tsx` (main container):

```tsx
import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { UrlInput } from './UrlInput';
import { AnalyzingState } from './AnalyzingState';
import { BrandProfile } from './BrandProfile';
import { StyleSelector } from './StyleSelector';
import { GeneratingState } from './GeneratingState';
import { AdResult } from './AdResult';
import { analyzeCompany, updateBrandProfile, generateAd } from '../../services/adforge-api';
import type {
  BrandProfile as BrandProfileType,
  GeneratedAd,
  AdForgeState,
  AdStyle,
} from '../../types';

export function AdForge() {
  const [state, setState] = useState<AdForgeState>('idle');
  const [analyzingUrl, setAnalyzingUrl] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfileType | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AdStyle | null>(null);
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Step 1: Analyze company URL
  const handleAnalyze = useCallback(async (url: string) => {
    setAnalyzingUrl(url);
    setState('analyzing');

    try {
      const response = await analyzeCompany(url);

      if (response.success && response.brandProfile && response.profileId) {
        setProfileId(response.profileId);
        setBrandProfile(response.brandProfile);
        setState('profile-ready');
        toast.success('Brand analysis complete!');
      } else {
        throw new Error(response.error || 'Failed to analyze brand');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Analysis failed');
      setState('idle');
    }
  }, []);

  // Step 2: Confirm or edit brand profile
  const handleConfirmProfile = useCallback(() => {
    setState('configuring');
  }, []);

  const handleEditProfile = useCallback(async (updates: Partial<BrandProfileType>) => {
    if (!profileId) return;

    const updated = await updateBrandProfile(profileId, updates);
    if (updated) {
      setBrandProfile(updated);
      toast.success('Profile updated');
    }
  }, [profileId]);

  // Step 3: Generate ad
  const handleGenerate = useCallback(async (
    style: AdStyle,
    customInstructions?: string,
    productImage?: File
  ) => {
    if (!profileId || !brandProfile) return;

    setSelectedStyle(style);
    setState('generating');

    try {
      const response = await generateAd({
        profileId,
        style,
        customInstructions,
        productImage,
      });

      if (response.success && response.ad) {
        setGeneratedAd(response.ad);
        setState('complete');
        toast.success('Ad generated successfully!');
      } else {
        throw new Error(response.error || 'Failed to generate ad');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
      setState('configuring');
    }
  }, [profileId, brandProfile]);

  // Regenerate copy
  const handleRegenerateCopy = useCallback(async () => {
    if (!generatedAd) return;

    setIsRegenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/adforge/${generatedAd.id}/regenerate-copy`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (data.success && data.ad) {
        setGeneratedAd(data.ad);
        toast.success('Copy regenerated!');
      } else {
        throw new Error(data.error || 'Failed to regenerate');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Regeneration failed');
    } finally {
      setIsRegenerating(false);
    }
  }, [generatedAd]);

  // Start over
  const handleStartOver = useCallback(() => {
    setState('idle');
    setAnalyzingUrl('');
    setProfileId(null);
    setBrandProfile(null);
    setSelectedStyle(null);
    setGeneratedAd(null);
  }, []);

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8">
      <AnimatePresence mode="wait">
        {/* Idle - URL Input */}
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                AdForge
              </h1>
              <p className="text-xl text-gray-500">
                AI-powered ads that understand your brand
              </p>
            </motion.div>

            <UrlInput onAnalyze={handleAnalyze} isLoading={false} />
          </motion.div>
        )}

        {/* Analyzing */}
        {state === 'analyzing' && (
          <AnalyzingState key="analyzing" url={analyzingUrl} />
        )}

        {/* Profile Ready */}
        {state === 'profile-ready' && brandProfile && (
          <BrandProfile
            key="profile"
            profile={brandProfile}
            onConfirm={handleConfirmProfile}
            onEdit={handleEditProfile}
          />
        )}

        {/* Configuring - Style Selection */}
        {state === 'configuring' && brandProfile && (
          <StyleSelector
            key="configuring"
            brandName={brandProfile.companyName}
            onGenerate={handleGenerate}
            isGenerating={false}
          />
        )}

        {/* Generating */}
        {state === 'generating' && brandProfile && selectedStyle && (
          <GeneratingState
            key="generating"
            brandName={brandProfile.companyName}
            style={selectedStyle}
          />
        )}

        {/* Complete */}
        {state === 'complete' && generatedAd && (
          <AdResult
            key="complete"
            ad={generatedAd}
            onRegenerateCopy={handleRegenerateCopy}
            onStartOver={handleStartOver}
            isRegenerating={isRegenerating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 4.2 Create Tab Navigation

Create `frontend/src/components/TabNavigation.tsx`:

```tsx
import { motion } from 'framer-motion';
import { Wand2, Image as ImageIcon } from 'lucide-react';

type Tab = 'transformer' | 'adforge';

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'transformer' as const, name: 'Image Transformer', icon: ImageIcon },
    { id: 'adforge' as const, name: 'AdForge', icon: Wand2 },
  ];

  return (
    <div className="flex justify-center pt-6 pb-2">
      <div className="inline-flex bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
              ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <tab.icon size={18} />
              {tab.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 4.3 Update Main App

Update `frontend/src/App.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { TabNavigation } from './components/TabNavigation';
import { UploadZone } from './components/UploadZone';
import { ProcessingState } from './components/ProcessingState';
import { ImageResult } from './components/ImageResult';
import { AdForge } from './components/adforge/AdForge';
import { uploadImage } from './services/api';
import type { ProcessedImage, AppState } from './types';

type Tab = 'transformer' | 'adforge';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('adforge'); // Default to AdForge
  const [state, setState] = useState<AppState>('idle');
  const [preview, setPreview] = useState<string>('');
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [statusText, setStatusText] = useState('');

  const handleFileSelect = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setState('processing');
    setStatusText('Removing background...');

    try {
      const timer1 = setTimeout(() => setStatusText('Flipping image...'), 2000);
      const timer2 = setTimeout(() => setStatusText('Uploading to cloud...'), 4000);

      const response = await uploadImage(file);

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (response.success && response.image) {
        setResult(response.image);
        setState('complete');
        toast.success('Image transformed successfully!');
      } else {
        throw new Error(response.error || 'Failed to process image');
      }
    } catch (error) {
      setState('error');
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      setTimeout(() => {
        setState('idle');
        setPreview('');
      }, 2000);
    }
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setPreview('');
    setResult(null);
    setStatusText('');
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: { fontFamily: 'Inter, system-ui, sans-serif' },
        }}
      />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'transformer' ? (
            <motion.div
              key="transformer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col items-center justify-center p-8"
            >
              <AnimatePresence mode="wait">
                {state === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-center mb-12"
                    >
                      <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
                        Image Transformer
                      </h1>
                      <p className="text-xl text-gray-500">
                        Remove background & flip horizontally
                      </p>
                    </motion.div>
                    <UploadZone onFileSelect={handleFileSelect} />
                  </motion.div>
                )}

                {state === 'processing' && (
                  <ProcessingState key="processing" status={statusText} preview={preview} />
                )}

                {state === 'complete' && result && (
                  <ImageResult
                    key="complete"
                    originalPreview={preview}
                    result={result}
                    onReset={handleReset}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="adforge"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <AdForge />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="py-6 text-center text-sm text-gray-400"
      >
        Built for Uplane
      </motion.footer>
    </div>
  );
}

export default App;
```

---

## 4.4 Create Index File for AdForge Components

Create `frontend/src/components/adforge/index.ts`:

```typescript
export { AdForge } from './AdForge';
export { UrlInput } from './UrlInput';
export { AnalyzingState } from './AnalyzingState';
export { BrandProfile } from './BrandProfile';
export { StyleSelector } from './StyleSelector';
export { GeneratingState } from './GeneratingState';
export { AdResult } from './AdResult';
```

---

## 4.5 Update Frontend Types Index

Update `frontend/src/types/index.ts` to export all types:

```typescript
// Image Transformer types
export interface ProcessedImage {
  id: string;
  originalName: string;
  url: string;
  publicId: string;
  createdAt: string;
}

export interface UploadResponse {
  success: boolean;
  image?: ProcessedImage;
  error?: string;
}

export type AppState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

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

## 4.6 Verification Checklist

### Tab Navigation
- [ ] Tabs render correctly
- [ ] Active tab has visual indicator
- [ ] Tab switching animates smoothly
- [ ] Content changes on tab switch

### AdForge Flow
- [ ] URL input → Analyzing → Profile Ready transitions work
- [ ] Profile Ready → Configuring works
- [ ] Configuring → Generating → Complete works
- [ ] Start Over returns to idle state
- [ ] Error states handled gracefully

### Visual Polish
- [ ] All animations are smooth
- [ ] Loading states provide feedback
- [ ] Toast notifications appear
- [ ] Responsive layout works
- [ ] Color scheme is consistent

---

## 4.7 File Structure

After this phase, your frontend should look like:

```
frontend/src/
├── components/
│   ├── adforge/
│   │   ├── index.ts
│   │   ├── AdForge.tsx
│   │   ├── UrlInput.tsx
│   │   ├── AnalyzingState.tsx
│   │   ├── BrandProfile.tsx
│   │   ├── StyleSelector.tsx
│   │   ├── GeneratingState.tsx
│   │   └── AdResult.tsx
│   ├── ImageResult.tsx
│   ├── ProcessingState.tsx
│   ├── TabNavigation.tsx
│   └── UploadZone.tsx
├── services/
│   ├── api.ts
│   └── adforge-api.ts
├── types/
│   └── index.ts
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```

---

## Next Phase

Proceed to **Phase 5: Testing & Deployment** to test the complete flow and deploy.
