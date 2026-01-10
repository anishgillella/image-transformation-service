import { Router, Request, Response } from 'express';
import { extractBrandContent } from '../services/parallelAi';
import { analyzeBrand, generateAdCopy, generateImagePrompt, generateCopyVariations } from '../services/gemini';
import { generateImage, fillImage, createMaskFromTransparent } from '../services/flux';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary';
import { BrandProfile, GeneratedAd, AdStyle, AdCopy, Product, CopyVariations, BrandAsset, BrandAssetLibrary, ExportPlatform, PLATFORM_DIMENSIONS } from '../types';
import { upload } from '../middleware/upload';
import sharp from 'sharp';
import axios from 'axios';

const router = Router();

// In-memory storage (would use a database in production)
const brandProfiles: Map<string, BrandProfile> = new Map();
const generatedAds: Map<string, GeneratedAd> = new Map();
const adCopyVariations: Map<string, CopyVariations> = new Map();
const brandAssetLibraries: Map<string, BrandAssetLibrary> = new Map();

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

      // Check if the image has transparency (PNG with alpha channel)
      const metadata = await sharp(req.file.buffer).metadata();
      const hasAlpha = metadata.hasAlpha;

      let productImage: Buffer;
      if (hasAlpha) {
        // Image already has transparency, use it directly
        console.log('Using image with existing transparency...');
        productImage = req.file.buffer;
      } else {
        // For images without transparency, convert to PNG and add alpha channel
        console.log('Converting image to PNG with alpha channel...');
        productImage = await sharp(req.file.buffer)
          .ensureAlpha()
          .png()
          .toBuffer();
      }

      // Resize product to fit in center of 1024x1024
      const resizedProduct = await sharp(productImage)
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
      productName: selectedProduct ? selectedProduct.name : undefined,
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

// ============================================================
// COPY VARIATIONS ENDPOINTS
// ============================================================

/**
 * POST /api/adforge/:id/generate-variations
 * Generate copy variations for an existing ad
 */
router.post('/:id/generate-variations', async (req: Request, res: Response) => {
  try {
    const ad = generatedAds.get(req.params.id);

    if (!ad) {
      res.status(404).json({ success: false, error: 'Ad not found' });
      return;
    }

    console.log('Generating copy variations...');
    const variationsRaw = await generateCopyVariations(
      ad.brandProfile,
      ad.style,
      ad.customInstructions
    );

    let variations: CopyVariations;
    try {
      const jsonMatch = variationsRaw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, variationsRaw];
      variations = JSON.parse(jsonMatch[1] || variationsRaw);
    } catch {
      res.status(500).json({ success: false, error: 'Failed to parse generated variations' });
      return;
    }

    // Store variations
    adCopyVariations.set(req.params.id, variations);

    res.json({ success: true, variations, adId: req.params.id });

  } catch (error) {
    console.error('Error generating variations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate variations',
    });
  }
});

/**
 * GET /api/adforge/:id/variations
 * Get stored copy variations for an ad
 */
router.get('/:id/variations', (req: Request, res: Response) => {
  const variations = adCopyVariations.get(req.params.id);

  if (!variations) {
    res.status(404).json({ success: false, error: 'No variations found for this ad' });
    return;
  }

  res.json({ success: true, variations });
});

/**
 * PUT /api/adforge/:id/select-copy
 * Select specific copy from variations to use in the ad
 */
router.put('/:id/select-copy', (req: Request, res: Response) => {
  const ad = generatedAds.get(req.params.id);

  if (!ad) {
    res.status(404).json({ success: false, error: 'Ad not found' });
    return;
  }

  const { headline, body, cta, hashtags } = req.body;

  // Update ad copy with selected variations
  if (headline) ad.copy.headline = headline;
  if (body) ad.copy.body = body;
  if (cta) ad.copy.cta = cta;
  if (hashtags) ad.copy.hashtags = hashtags;

  generatedAds.set(req.params.id, ad);

  res.json({ success: true, ad });
});

// ============================================================
// EXPORT TO FORMATS ENDPOINTS
// ============================================================

/**
 * POST /api/adforge/:id/export
 * Export ad image to specific platform dimensions
 */
router.post('/:id/export', async (req: Request, res: Response) => {
  try {
    const ad = generatedAds.get(req.params.id);

    if (!ad) {
      res.status(404).json({ success: false, error: 'Ad not found' });
      return;
    }

    const { platform, format = 'png' } = req.body as { platform: ExportPlatform; format?: 'png' | 'jpg' };

    if (!platform || !PLATFORM_DIMENSIONS[platform]) {
      res.status(400).json({
        success: false,
        error: 'Invalid platform. Must be one of: instagram-feed, instagram-story, facebook-feed, twitter, linkedin, pinterest, tiktok',
      });
      return;
    }

    const dimensions = PLATFORM_DIMENSIONS[platform];
    console.log(`Exporting ad for ${dimensions.name} (${dimensions.width}x${dimensions.height})...`);

    // Fetch original image
    const imageResponse = await axios.get(ad.imageUrl, { responseType: 'arraybuffer' });
    const originalBuffer = Buffer.from(imageResponse.data);

    // Resize and crop to platform dimensions
    let exportBuffer: Buffer;
    if (format === 'jpg') {
      exportBuffer = await sharp(originalBuffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 95 })
        .toBuffer();
    } else {
      exportBuffer = await sharp(originalBuffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center',
        })
        .png({ quality: 95 })
        .toBuffer();
    }

    // Upload resized image to Cloudinary
    const exportName = `${ad.brandProfile.companyName}-${ad.style}-${platform}`;
    const { url: exportUrl, publicId } = await uploadToCloudinary(exportBuffer, exportName);

    console.log(`Export complete: ${exportUrl}`);

    res.json({
      success: true,
      export: {
        platform,
        platformName: dimensions.name,
        width: dimensions.width,
        height: dimensions.height,
        format,
        url: exportUrl,
        publicId,
      },
    });

  } catch (error) {
    console.error('Error exporting ad:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export ad',
    });
  }
});

/**
 * POST /api/adforge/:id/export-all
 * Export ad to all platform dimensions at once
 */
router.post('/:id/export-all', async (req: Request, res: Response) => {
  try {
    const ad = generatedAds.get(req.params.id);

    if (!ad) {
      res.status(404).json({ success: false, error: 'Ad not found' });
      return;
    }

    const { format = 'png' } = req.body as { format?: 'png' | 'jpg' };

    console.log('Exporting ad to all platforms...');

    // Fetch original image once
    const imageResponse = await axios.get(ad.imageUrl, { responseType: 'arraybuffer' });
    const originalBuffer = Buffer.from(imageResponse.data);

    const exports: Record<string, { url: string; width: number; height: number; platformName: string }> = {};

    // Export to all platforms in parallel
    const platforms = Object.keys(PLATFORM_DIMENSIONS) as ExportPlatform[];
    await Promise.all(
      platforms.map(async (platform) => {
        const dimensions = PLATFORM_DIMENSIONS[platform];

        let exportBuffer: Buffer;
        if (format === 'jpg') {
          exportBuffer = await sharp(originalBuffer)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center',
            })
            .jpeg({ quality: 95 })
            .toBuffer();
        } else {
          exportBuffer = await sharp(originalBuffer)
            .resize(dimensions.width, dimensions.height, {
              fit: 'cover',
              position: 'center',
            })
            .png({ quality: 95 })
            .toBuffer();
        }

        const exportName = `${ad.brandProfile.companyName}-${ad.style}-${platform}`;
        const { url } = await uploadToCloudinary(exportBuffer, exportName);

        exports[platform] = {
          url,
          width: dimensions.width,
          height: dimensions.height,
          platformName: dimensions.name,
        };
      })
    );

    console.log(`Exported to ${platforms.length} platforms`);

    res.json({ success: true, exports, format });

  } catch (error) {
    console.error('Error exporting ad to all platforms:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export ad',
    });
  }
});

/**
 * GET /api/adforge/platforms
 * Get list of available export platforms with dimensions
 */
router.get('/platforms', (_req: Request, res: Response) => {
  const platforms = Object.entries(PLATFORM_DIMENSIONS).map(([key, value]) => ({
    id: key,
    ...value,
  }));

  res.json({ success: true, platforms });
});

// ============================================================
// BRAND ASSET LIBRARY ENDPOINTS
// ============================================================

/**
 * POST /api/adforge/assets/:profileId
 * Upload a brand asset (logo, image)
 */
router.post('/assets/:profileId', upload.single('asset'), async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const { type, name } = req.body as { type: 'logo' | 'image'; name?: string };

    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    if (!type || !['logo', 'image'].includes(type)) {
      res.status(400).json({ success: false, error: 'Type must be "logo" or "image"' });
      return;
    }

    // Get or create asset library
    let library = brandAssetLibraries.get(profileId);
    if (!library) {
      const profile = brandProfiles.get(profileId);
      library = {
        profileId,
        assets: [],
        colors: profile?.colors
          ? { ...profile.colors, custom: [] }
          : { primary: '#000000', secondary: '#ffffff', accent: '#0066ff', custom: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Get image metadata
    const metadata = await sharp(req.file.buffer).metadata();

    // Upload to Cloudinary
    const assetName = name || `${type}-${Date.now()}`;
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, `assets/${profileId}/${assetName}`);

    // Create asset record
    const asset: BrandAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      profileId,
      type,
      name: assetName,
      url,
      publicId,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      },
      createdAt: new Date(),
    };

    library.assets.push(asset);
    library.updatedAt = new Date();
    brandAssetLibraries.set(profileId, library);

    res.json({ success: true, asset });

  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload asset',
    });
  }
});

/**
 * GET /api/adforge/assets/:profileId
 * Get all assets for a brand profile
 */
router.get('/assets/:profileId', (req: Request, res: Response) => {
  const library = brandAssetLibraries.get(req.params.profileId);

  if (!library) {
    // Return empty library
    res.json({
      success: true,
      library: {
        profileId: req.params.profileId,
        assets: [],
        colors: { primary: '#000000', secondary: '#ffffff', accent: '#0066ff', custom: [] },
      },
    });
    return;
  }

  res.json({ success: true, library });
});

/**
 * PUT /api/adforge/assets/:profileId/colors
 * Update brand colors in asset library
 */
router.put('/assets/:profileId/colors', (req: Request, res: Response) => {
  const { profileId } = req.params;
  const { primary, secondary, accent, custom } = req.body;

  let library = brandAssetLibraries.get(profileId);
  if (!library) {
    library = {
      profileId,
      assets: [],
      colors: { primary: '#000000', secondary: '#ffffff', accent: '#0066ff', custom: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Update colors
  if (primary) library.colors.primary = primary;
  if (secondary) library.colors.secondary = secondary;
  if (accent) library.colors.accent = accent;
  if (custom) library.colors.custom = custom;
  library.updatedAt = new Date();

  brandAssetLibraries.set(profileId, library);

  // Also update brand profile if it exists
  const profile = brandProfiles.get(profileId);
  if (profile) {
    profile.colors = {
      primary: library.colors.primary,
      secondary: library.colors.secondary,
      accent: library.colors.accent,
    };
    brandProfiles.set(profileId, profile);
  }

  res.json({ success: true, library });
});

/**
 * DELETE /api/adforge/assets/:profileId/:assetId
 * Delete a brand asset
 */
router.delete('/assets/:profileId/:assetId', async (req: Request, res: Response) => {
  try {
    const { profileId, assetId } = req.params;

    const library = brandAssetLibraries.get(profileId);
    if (!library) {
      res.status(404).json({ success: false, error: 'Asset library not found' });
      return;
    }

    const assetIndex = library.assets.findIndex((a) => a.id === assetId);
    if (assetIndex === -1) {
      res.status(404).json({ success: false, error: 'Asset not found' });
      return;
    }

    const asset = library.assets[assetIndex];

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(asset.publicId);
    } catch (cloudinaryError) {
      console.warn('Failed to delete from Cloudinary:', cloudinaryError);
    }

    // Remove from library
    library.assets.splice(assetIndex, 1);
    library.updatedAt = new Date();
    brandAssetLibraries.set(profileId, library);

    res.json({ success: true, message: 'Asset deleted successfully' });

  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete asset',
    });
  }
});

export default router;
