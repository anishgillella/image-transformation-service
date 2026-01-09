# Phase 3: Ad Generation

## Objective
Build the ad generation pipeline: style selection → image generation → product compositing → complete ad output.

---

## 3.1 Add Generation Endpoint to Route

Add to `backend/src/routes/adforge.ts`:

```typescript
// Add these imports at the top if not already present
import sharp from 'sharp';

/**
 * POST /api/adforge/generate
 * Generate an ad from brand profile
 */
router.post('/generate', upload.single('productImage'), async (req: Request, res: Response) => {
  try {
    const { profileId, style, customInstructions } = req.body;

    if (!profileId || !style) {
      res.status(400).json({ success: false, error: 'profileId and style are required' });
      return;
    }

    // Validate style
    const validStyles: AdStyle[] = ['minimal', 'gradient', 'abstract', 'lifestyle'];
    if (!validStyles.includes(style as AdStyle)) {
      res.status(400).json({ success: false, error: 'Invalid style' });
      return;
    }

    // Get brand profile
    const brandProfile = brandProfiles.get(profileId);
    if (!brandProfile) {
      res.status(404).json({ success: false, error: 'Brand profile not found' });
      return;
    }

    const hasProductImage = !!req.file;
    let finalImageBuffer: Buffer;

    console.log(`Generating ${style} ad for ${brandProfile.companyName}...`);

    // Step 1: Generate image prompt
    console.log('Generating image prompt...');
    const imagePrompt = await generateImagePrompt(
      brandProfile,
      style,
      hasProductImage,
      customInstructions
    );
    console.log('Prompt:', imagePrompt);

    if (hasProductImage && req.file) {
      // Path A: With product image - use Flux Fill for intelligent compositing
      console.log('Processing product image...');

      // Remove background from product
      const productNoBg = await removeBackground(req.file.buffer);

      // Resize product to fit in center of 1024x1024
      const resizedProduct = await sharp(productNoBg)
        .resize(600, 600, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

      // Create base image with product centered on transparent background
      const productOnCanvas = await sharp({
        create: {
          width: 1024,
          height: 1024,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          {
            input: resizedProduct,
            gravity: 'center',
          },
        ])
        .png()
        .toBuffer();

      // Create mask (white = fill, black = keep)
      const mask = await createMaskFromTransparent(productOnCanvas);

      // Use Flux Fill to generate background around product
      console.log('Generating background with Flux Fill...');
      finalImageBuffer = await fillImage({
        image: productOnCanvas,
        mask: mask,
        prompt: imagePrompt,
        width: 1024,
        height: 1024,
      });

    } else {
      // Path B: Without product image - generate complete ad
      console.log('Generating complete ad image...');
      finalImageBuffer = await generateImage({
        prompt: imagePrompt,
        width: 1024,
        height: 1024,
      });
    }

    // Step 2: Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const { url: imageUrl, publicId } = await uploadToCloudinary(
      finalImageBuffer,
      `adforge-${brandProfile.companyName}-${style}`
    );

    // Step 3: Generate ad copy
    console.log('Generating ad copy...');
    const copyRaw = await generateAdCopy(brandProfile, style, customInstructions);

    let adCopy: AdCopy;
    try {
      const jsonMatch = copyRaw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, copyRaw];
      adCopy = JSON.parse(jsonMatch[1] || copyRaw);
    } catch {
      // Fallback copy
      adCopy = {
        headline: `Discover ${brandProfile.companyName}`,
        body: brandProfile.uniqueSellingPoints[0] || 'Experience the difference.',
        cta: 'Learn More',
        hashtags: ['#' + brandProfile.companyName.replace(/\s/g, ''), '#' + brandProfile.industry.replace(/\s/g, '')],
      };
    }

    // Create ad record
    const adId = `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const generatedAd: GeneratedAd = {
      id: adId,
      brandProfile,
      style: style as AdStyle,
      customInstructions,
      imageUrl,
      copy: adCopy,
      hasProductImage,
      productImageUrl: hasProductImage ? imageUrl : undefined,
      createdAt: new Date(),
    };

    // Store ad
    generatedAds.set(adId, generatedAd);

    console.log(`Ad generated successfully: ${adId}`);

    res.json({ success: true, ad: generatedAd });

  } catch (error) {
    console.error('Error generating ad:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate ad',
    });
  }
});

/**
 * POST /api/adforge/:id/regenerate-copy
 * Regenerate just the copy for an existing ad
 */
router.post('/:id/regenerate-copy', async (req: Request, res: Response) => {
  try {
    const ad = generatedAds.get(req.params.id);

    if (!ad) {
      res.status(404).json({ success: false, error: 'Ad not found' });
      return;
    }

    console.log('Regenerating copy...');
    const copyRaw = await generateAdCopy(ad.brandProfile, ad.style, ad.customInstructions);

    let newCopy: AdCopy;
    try {
      const jsonMatch = copyRaw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, copyRaw];
      newCopy = JSON.parse(jsonMatch[1] || copyRaw);
    } catch {
      res.status(500).json({ success: false, error: 'Failed to parse generated copy' });
      return;
    }

    // Update ad
    ad.copy = newCopy;
    generatedAds.set(req.params.id, ad);

    res.json({ success: true, ad });

  } catch (error) {
    console.error('Error regenerating copy:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate copy',
    });
  }
});

/**
 * GET /api/adforge/ads
 * Get all generated ads
 */
router.get('/ads', (req: Request, res: Response) => {
  const ads = Array.from(generatedAds.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ success: true, ads });
});

/**
 * DELETE /api/adforge/:id
 * Delete a generated ad
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ad = generatedAds.get(req.params.id);

    if (!ad) {
      res.status(404).json({ success: false, error: 'Ad not found' });
      return;
    }

    // Delete from Cloudinary (extract public ID from URL)
    const urlParts = ad.imageUrl.split('/');
    const publicId = urlParts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
    await deleteFromCloudinary(publicId);

    // Remove from memory
    generatedAds.delete(req.params.id);

    res.json({ success: true, message: 'Ad deleted successfully' });

  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete ad',
    });
  }
});
```

---

## 3.2 Style Selector Component

Create `frontend/src/components/adforge/StyleSelector.tsx`:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Layers, Shapes, Image as ImageIcon, Upload, X } from 'lucide-react';
import type { AdStyle } from '../../types';

interface StyleSelectorProps {
  onGenerate: (style: AdStyle, customInstructions?: string, productImage?: File) => void;
  isGenerating: boolean;
  brandName: string;
}

const styles: { id: AdStyle; name: string; description: string; icon: typeof Sparkles }[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, white space, elegant',
    icon: Sparkles,
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Modern color transitions',
    icon: Layers,
  },
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Artistic, creative shapes',
    icon: Shapes,
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Contextual, relatable scenes',
    icon: ImageIcon,
  },
];

export function StyleSelector({ onGenerate, isGenerating, brandName }: StyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<AdStyle | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      setProductPreview(URL.createObjectURL(file));
    }
  };

  const removeProductImage = () => {
    setProductImage(null);
    setProductPreview('');
  };

  const handleGenerate = () => {
    if (selectedStyle) {
      onGenerate(
        selectedStyle,
        customInstructions || undefined,
        productImage || undefined
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl"
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
        Create Your Ad
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Choose a style for your {brandName} ad
      </p>

      {/* Style Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {styles.map((style) => (
          <motion.button
            key={style.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedStyle(style.id)}
            className={`
              p-6 rounded-xl border-2 text-left transition-all
              ${selectedStyle === style.id
                ? 'border-[#0066FF] bg-[#0066FF]/5'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className={`
              p-3 rounded-lg w-fit mb-3
              ${selectedStyle === style.id ? 'bg-[#0066FF]/10' : 'bg-gray-100'}
            `}>
              <style.icon
                size={24}
                className={selectedStyle === style.id ? 'text-[#0066FF]' : 'text-gray-600'}
              />
            </div>
            <h3 className="font-semibold text-gray-900">{style.name}</h3>
            <p className="text-sm text-gray-500">{style.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Product Image Upload (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Image (Optional)
        </label>

        {productPreview ? (
          <div className="relative inline-block">
            <img
              src={productPreview}
              alt="Product preview"
              className="w-32 h-32 object-contain rounded-lg border border-gray-200"
            />
            <button
              onClick={removeProductImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="flex flex-col items-center text-gray-500">
              <Upload size={24} className="mb-2" />
              <span className="text-sm">Upload product image</span>
              <span className="text-xs text-gray-400">or let AI generate one</span>
            </div>
          </label>
        )}
      </div>

      {/* Custom Instructions */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Instructions (Optional)
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="e.g., Make it feel more premium and exclusive..."
          className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20"
          rows={3}
        />
      </div>

      {/* Generate Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerate}
        disabled={!selectedStyle || isGenerating}
        className="w-full py-4 bg-black text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            Generating Ad...
          </span>
        ) : (
          'Generate Ad'
        )}
      </motion.button>
    </motion.div>
  );
}
```

---

## 3.3 Generating State Component

Create `frontend/src/components/adforge/GeneratingState.tsx`:

```tsx
import { motion } from 'framer-motion';
import { Wand2, Image as ImageIcon, Type, Sparkles } from 'lucide-react';

interface GeneratingStateProps {
  brandName: string;
  style: string;
}

const steps = [
  { icon: Wand2, label: 'Crafting image prompt' },
  { icon: ImageIcon, label: 'Generating visuals' },
  { icon: Type, label: 'Writing ad copy' },
  { icon: Sparkles, label: 'Finalizing your ad' },
];

export function GeneratingState({ brandName, style }: GeneratingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center"
    >
      {/* Animated Visual */}
      <motion.div
        className="relative w-48 h-48 mb-8"
      >
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-[#0066FF]/30"
        />

        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border-2 border-dashed border-[#0066FF]/50"
        />

        {/* Center */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-8 rounded-full bg-[#0066FF]/10 flex items-center justify-center"
        >
          <Wand2 size={48} className="text-[#0066FF]" />
        </motion.div>
      </motion.div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Creating Your Ad
      </h2>
      <p className="text-gray-500 mb-8">
        {brandName} • {style.charAt(0).toUpperCase() + style.slice(1)} style
      </p>

      {/* Progress Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.8 }}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={{
                backgroundColor: ['rgba(0,102,255,0.1)', 'rgba(0,102,255,0.2)', 'rgba(0,102,255,0.1)'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.4,
              }}
              className="p-2 rounded-lg"
            >
              <step.icon size={20} className="text-[#0066FF]" />
            </motion.div>
            <span className="text-gray-700">{step.label}</span>
          </motion.div>
        ))}
      </div>

      <p className="text-sm text-gray-400 mt-8">
        This usually takes 15-30 seconds
      </p>
    </motion.div>
  );
}
```

---

## 3.4 Ad Result Component

Create `frontend/src/components/adforge/AdResult.tsx`:

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import type { GeneratedAd } from '../../types';

interface AdResultProps {
  ad: GeneratedAd;
  onRegenerateCopy: () => void;
  onStartOver: () => void;
  isRegenerating: boolean;
}

export function AdResult({ ad, onRegenerateCopy, onStartOver, isRegenerating }: AdResultProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = ad.imageUrl;
    link.download = `${ad.brandProfile.companyName}-${ad.style}-ad.png`;
    link.target = '_blank';
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-[#00C853]/10">
            <Sparkles size={24} className="text-[#00C853]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Your Ad is Ready!
            </h2>
            <p className="text-sm text-gray-500">
              {ad.brandProfile.companyName} • {ad.style} style
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartOver}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <RotateCcw size={18} />
          Start Over
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
            <img
              src={ad.imageUrl}
              alt={`${ad.brandProfile.companyName} ad`}
              className="w-full aspect-square object-cover"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            className="w-full mt-4 py-3 bg-black text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Download size={20} />
            Download Image
          </motion.button>
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Headline */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Headline
              </span>
              <button
                onClick={() => copyToClipboard(ad.copy.headline, 'headline')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {copiedField === 'headline' ? (
                  <Check size={16} className="text-[#00C853]" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xl font-semibold text-gray-900">{ad.copy.headline}</p>
          </div>

          {/* Body */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Body Copy
              </span>
              <button
                onClick={() => copyToClipboard(ad.copy.body, 'body')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {copiedField === 'body' ? (
                  <Check size={16} className="text-[#00C853]" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-gray-700">{ad.copy.body}</p>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Call to Action
              </span>
              <button
                onClick={() => copyToClipboard(ad.copy.cta, 'cta')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {copiedField === 'cta' ? (
                  <Check size={16} className="text-[#00C853]" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <span className="inline-block px-4 py-2 bg-black text-white rounded-lg font-medium">
              {ad.copy.cta}
            </span>
          </div>

          {/* Hashtags */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Hashtags
              </span>
              <button
                onClick={() => copyToClipboard(ad.copy.hashtags.join(' '), 'hashtags')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {copiedField === 'hashtags' ? (
                  <Check size={16} className="text-[#00C853]" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ad.copy.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#0066FF]/10 text-[#0066FF] rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Regenerate Copy Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRegenerateCopy}
            disabled={isRegenerating}
            className="w-full py-3 border border-gray-200 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRegenerating ? 'animate-spin' : ''} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Copy'}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
```

---

## 3.5 Verification Checklist

### Backend
- [ ] `/api/adforge/generate` accepts style and optional product image
- [ ] Image prompt is generated from brand profile
- [ ] Flux generates image (or Flux Fill with product)
- [ ] Ad copy is generated
- [ ] Complete ad is returned with image URL and copy
- [ ] Regenerate copy endpoint works
- [ ] Delete endpoint works

### Frontend
- [ ] Style selector shows 4 options
- [ ] Product image upload works (optional)
- [ ] Custom instructions textarea works
- [ ] Generate button triggers API call
- [ ] Generating state shows progress
- [ ] Result shows image and all copy fields
- [ ] Copy buttons work
- [ ] Download button works
- [ ] Regenerate copy button works

---

## Next Phase

Once ad generation is working, proceed to **Phase 4: Copy Generation Refinement** to enhance the ad copy quality.
