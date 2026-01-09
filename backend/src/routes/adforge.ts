import { Router, Request, Response } from 'express';
import { extractBrandContent } from '../services/parallelAi';
import { analyzeBrand, generateAdCopy, generateImagePrompt } from '../services/gemini';
import { generateImage, fillImage, createMaskFromTransparent } from '../services/flux';
import { removeBackground } from '../services/removeBg';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary';
import { BrandProfile, GeneratedAd, AdStyle, AdCopy, Product } from '../types';
import { upload } from '../middleware/upload';
import sharp from 'sharp';

const router = Router();

// In-memory storage (would use a database in production)
const brandProfiles: Map<string, BrandProfile> = new Map();
const generatedAds: Map<string, GeneratedAd> = new Map();

/**
 * POST /api/adforge/analyze
 * Analyze a company URL and return brand profile with all products
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

    // Step 1: Extract website content using Parallel AI
    console.log('Extracting website content...');
    const webContent = await extractBrandContent(validUrl);

    // Step 2: Analyze brand with Gemini LLM
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
      products: brandData.products || [],
      analyzedAt: new Date(),
    };

    // Generate unique profile ID
    const profileId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    brandProfiles.set(profileId, brandProfile);

    console.log(`Brand analysis complete: ${brandProfile.companyName} with ${brandProfile.products.length} products`);

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

/**
 * POST /api/adforge/generate
 * Generate an ad from brand profile
 * Supports: brand-level ads OR product-specific ads
 */
router.post('/generate', upload.single('productImage'), async (req: Request, res: Response) => {
  try {
    const { profileId, style, customInstructions, productIndex } = req.body;

    if (!profileId || !style) {
      res.status(400).json({ success: false, error: 'profileId and style are required' });
      return;
    }

    // Validate style
    const validStyles: AdStyle[] = ['minimal', 'gradient', 'abstract', 'lifestyle'];
    if (!validStyles.includes(style as AdStyle)) {
      res.status(400).json({ success: false, error: 'Invalid style. Must be: minimal, gradient, abstract, or lifestyle' });
      return;
    }

    // Get brand profile
    const brandProfile = brandProfiles.get(profileId);
    if (!brandProfile) {
      res.status(404).json({ success: false, error: 'Brand profile not found' });
      return;
    }

    // Determine if this is a product-specific ad
    let selectedProduct: Product | null = null;
    if (productIndex !== undefined && productIndex !== null && productIndex !== '') {
      const idx = parseInt(productIndex, 10);
      if (!isNaN(idx) && idx >= 0 && idx < brandProfile.products.length) {
        selectedProduct = brandProfile.products[idx];
        console.log(`Generating ad for product: ${selectedProduct.name}`);
      }
    }

    const hasProductImage = !!req.file;
    let finalImageBuffer: Buffer;

    console.log(`Generating ${style} ad for ${brandProfile.companyName}${selectedProduct ? ` - ${selectedProduct.name}` : ' (brand-level)'}...`);

    // Build context for prompts based on whether product-specific or brand-level
    const adContext = selectedProduct ? {
      ...brandProfile,
      // Override with product-specific info for ad generation
      targetAudience: selectedProduct.targetAudience,
      uniqueSellingPoints: selectedProduct.keyBenefits,
      productName: selectedProduct.name,
      productDescription: selectedProduct.description,
      promotionAngle: selectedProduct.promotionAngle,
    } : brandProfile;

    // Step 1: Generate image prompt
    console.log('Generating image prompt...');
    const imagePrompt = await generateImagePrompt(
      adContext,
      style,
      hasProductImage,
      customInstructions
    );
    console.log('Image prompt:', imagePrompt);

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
    const imageName = selectedProduct
      ? `adforge-${brandProfile.companyName}-${selectedProduct.name}-${style}`
      : `adforge-${brandProfile.companyName}-${style}`;
    const { url: imageUrl } = await uploadToCloudinary(finalImageBuffer, imageName);

    // Step 3: Generate ad copy
    console.log('Generating ad copy...');
    const copyContext = selectedProduct ? {
      companyName: brandProfile.companyName,
      industry: brandProfile.industry,
      targetAudience: selectedProduct.targetAudience,
      voiceTone: brandProfile.voiceTone,
      uniqueSellingPoints: selectedProduct.keyBenefits,
      productName: selectedProduct.name,
      promotionAngle: selectedProduct.promotionAngle,
    } : brandProfile;

    const copyRaw = await generateAdCopy(copyContext, style, customInstructions);

    let adCopy: AdCopy;
    try {
      const jsonMatch = copyRaw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, copyRaw];
      adCopy = JSON.parse(jsonMatch[1] || copyRaw);
    } catch {
      // Fallback copy
      const name = selectedProduct ? selectedProduct.name : brandProfile.companyName;
      adCopy = {
        headline: `Discover ${name}`,
        body: selectedProduct ? selectedProduct.promotionAngle : (brandProfile.uniqueSellingPoints[0] || 'Experience the difference.'),
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

    res.json({
      success: true,
      ad: generatedAd,
      selectedProduct: selectedProduct ? {
        name: selectedProduct.name,
        index: productIndex,
      } : null,
    });

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
 * GET /api/adforge/ads/:id
 * Get a specific ad
 */
router.get('/ads/:id', (req: Request, res: Response) => {
  const ad = generatedAds.get(req.params.id);

  if (!ad) {
    res.status(404).json({ success: false, error: 'Ad not found' });
    return;
  }

  res.json({ success: true, ad });
});

/**
 * DELETE /api/adforge/ads/:id
 * Delete a generated ad
 */
router.delete('/ads/:id', async (req: Request, res: Response) => {
  try {
    const ad = generatedAds.get(req.params.id);

    if (!ad) {
      res.status(404).json({ success: false, error: 'Ad not found' });
      return;
    }

    // Delete from Cloudinary (extract public ID from URL)
    try {
      const urlParts = ad.imageUrl.split('/');
      const publicId = urlParts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
      await deleteFromCloudinary(publicId);
    } catch (cloudinaryError) {
      console.warn('Failed to delete from Cloudinary:', cloudinaryError);
      // Continue with local deletion even if Cloudinary fails
    }

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

export default router;
