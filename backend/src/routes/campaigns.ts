import { Router, Request, Response } from 'express';
import { prisma } from '../services/database';

// Define CampaignStatus locally to avoid Prisma client import issues during build
const CampaignStatus = {
  DRAFT: 'DRAFT',
  GENERATING: 'GENERATING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;
import { generateAdCopy, generateImagePrompt } from '../services/gemini';
import { generateImage } from '../services/flux';
import { uploadToCloudinary } from '../services/cloudinary';
import { costTracker, MODEL_PRICING } from '../services/costTracker';

const router = Router();

// Platform dimensions for campaign generation
const PLATFORM_DIMENSIONS: Record<string, { name: string; width: number; height: number }> = {
  'instagram-feed': { name: 'Instagram Feed', width: 1080, height: 1080 },
  'instagram-story': { name: 'Instagram Story', width: 1080, height: 1920 },
  'facebook-feed': { name: 'Facebook Feed', width: 1200, height: 628 },
  'twitter': { name: 'Twitter/X Post', width: 1200, height: 675 },
  'linkedin': { name: 'LinkedIn Post', width: 1200, height: 627 },
  'pinterest': { name: 'Pinterest Pin', width: 1000, height: 1500 },
  'tiktok': { name: 'TikTok', width: 1080, height: 1920 },
};

/**
 * GET /api/campaigns
 * List all campaigns
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        brandProfile: {
          select: {
            id: true,
            companyName: true,
            primaryColor: true,
          },
        },
        ads: {
          select: {
            id: true,
            imageUrl: true,
            style: true,
          },
          take: 4, // Preview thumbnails
        },
        _count: {
          select: { ads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      campaigns: campaigns.map((c: any) => ({
        ...c,
        targetPlatforms: JSON.parse(c.targetPlatforms || '[]'),
        adCount: c._count.ads,
      })),
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch campaigns',
    });
  }
});

/**
 * GET /api/campaigns/:id
 * Get a specific campaign with all ads
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        brandProfile: true,
        ads: {
          include: {
            exports: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    }) as any;

    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    // Parse JSON fields
    const parsedCampaign = {
      ...campaign,
      targetPlatforms: JSON.parse(campaign.targetPlatforms || '[]'),
      brandProfile: {
        ...campaign.brandProfile,
        personality: JSON.parse(campaign.brandProfile.personality || '[]'),
        uniqueSellingPoints: JSON.parse(campaign.brandProfile.uniqueSellingPoints || '[]'),
        products: JSON.parse(campaign.brandProfile.products || '[]'),
        colors: {
          primary: campaign.brandProfile.primaryColor,
          secondary: campaign.brandProfile.secondaryColor,
          accent: campaign.brandProfile.accentColor,
        },
      },
      ads: campaign.ads.map((ad: any) => ({
        ...ad,
        hashtags: JSON.parse(ad.hashtags || '[]'),
        copy: {
          headline: ad.headline,
          body: ad.body,
          cta: ad.cta,
          hashtags: JSON.parse(ad.hashtags || '[]'),
        },
      })),
    };

    res.json({ success: true, campaign: parsedCampaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch campaign',
    });
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, brandProfileId, targetPlatforms, style, customInstructions, selectedProducts, includeBrandAd } = req.body;

    if (!name || !brandProfileId || !targetPlatforms || targetPlatforms.length === 0) {
      res.status(400).json({
        success: false,
        error: 'name, brandProfileId, and at least one targetPlatform are required',
      });
      return;
    }

    // Verify brand profile exists
    const brandProfile = await prisma.brandProfile.findUnique({
      where: { id: brandProfileId },
    });

    if (!brandProfile) {
      res.status(404).json({ success: false, error: 'Brand profile not found' });
      return;
    }

    // Validate platforms
    const validPlatforms = targetPlatforms.filter((p: string) => PLATFORM_DIMENSIONS[p]);
    if (validPlatforms.length === 0) {
      res.status(400).json({
        success: false,
        error: `Invalid platforms. Valid options: ${Object.keys(PLATFORM_DIMENSIONS).join(', ')}`,
      });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        brandProfileId,
        targetPlatforms: JSON.stringify(validPlatforms),
        style,
        customInstructions,
        selectedProducts: selectedProducts ? JSON.stringify(selectedProducts) : null,
        includeBrandAd: includeBrandAd !== false, // Default to true
        status: CampaignStatus.DRAFT,
      },
      include: {
        brandProfile: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      campaign: {
        ...campaign,
        targetPlatforms: validPlatforms,
        selectedProducts: selectedProducts || [],
      },
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create campaign',
    });
  }
});

/**
 * PUT /api/campaigns/:id
 * Update a campaign
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const { name, description, targetPlatforms, style, customInstructions, status } = req.body;

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!existingCampaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (targetPlatforms !== undefined) {
      const validPlatforms = targetPlatforms.filter((p: string) => PLATFORM_DIMENSIONS[p]);
      updateData.targetPlatforms = JSON.stringify(validPlatforms);
    }
    if (style !== undefined) updateData.style = style;
    if (customInstructions !== undefined) updateData.customInstructions = customInstructions;
    if (status !== undefined && Object.values(CampaignStatus).includes(status)) {
      updateData.status = status;
    }

    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
      include: {
        brandProfile: {
          select: {
            id: true,
            companyName: true,
          },
        },
        _count: {
          select: { ads: true },
        },
      },
    }) as any;

    res.json({
      success: true,
      campaign: {
        ...campaign,
        targetPlatforms: JSON.parse(campaign.targetPlatforms || '[]'),
        adCount: campaign._count.ads,
      },
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update campaign',
    });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete a campaign and all its ads
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    // Delete campaign (cascades to ads due to schema)
    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete campaign',
    });
  }
});

/**
 * POST /api/campaigns/:id/generate
 * Generate all ads for a campaign across target platforms
 */
router.post('/:id/generate', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        brandProfile: true,
      },
    }) as any;

    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    const targetPlatforms = JSON.parse(campaign.targetPlatforms || '[]');
    if (targetPlatforms.length === 0) {
      res.status(400).json({ success: false, error: 'No target platforms configured' });
      return;
    }

    // Update campaign status to generating
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.GENERATING },
    });

    // Return immediately - generation happens async
    res.json({
      success: true,
      message: `Starting ad generation for ${targetPlatforms.length} platforms`,
      campaignId: campaign.id,
      platforms: targetPlatforms.map((p: string) => ({
        id: p,
        ...PLATFORM_DIMENSIONS[p],
      })),
    });

    // Generate ads in background
    generateCampaignAds(campaign, targetPlatforms).catch((error) => {
      console.error('Background ad generation failed:', error);
    });
  } catch (error) {
    console.error('Error generating campaign ads:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate campaign',
    });
  }
});

/**
 * Background function to generate ads for all platforms and products
 */
async function generateCampaignAds(campaign: any, targetPlatforms: string[]) {
  const brandProfile = campaign.brandProfile;
  const style = campaign.style || 'minimal';
  const customInstructions = campaign.customInstructions || '';
  const selectedProductIndices: number[] = campaign.selectedProducts
    ? JSON.parse(campaign.selectedProducts)
    : [];
  const includeBrandAd = campaign.includeBrandAd !== false;

  // Parse brand data from JSON strings
  const brandContext = {
    companyName: brandProfile.companyName,
    url: brandProfile.url,
    personality: JSON.parse(brandProfile.personality || '[]'),
    colors: {
      primary: brandProfile.primaryColor,
      secondary: brandProfile.secondaryColor,
      accent: brandProfile.accentColor,
    },
    targetAudience: brandProfile.targetAudience,
    voiceTone: brandProfile.voiceTone,
    visualStyle: brandProfile.visualStyle,
    industry: brandProfile.industry,
    uniqueSellingPoints: JSON.parse(brandProfile.uniqueSellingPoints || '[]'),
    products: JSON.parse(brandProfile.products || '[]'),
  };

  // Build list of ad targets (brand + selected products)
  interface AdTarget {
    type: 'brand' | 'product';
    name: string;
    product?: any;
    productIndex?: number;
  }

  const adTargets: AdTarget[] = [];

  if (includeBrandAd) {
    adTargets.push({ type: 'brand', name: brandContext.companyName });
  }

  for (const idx of selectedProductIndices) {
    if (idx >= 0 && idx < brandContext.products.length) {
      adTargets.push({
        type: 'product',
        name: brandContext.products[idx].name,
        product: brandContext.products[idx],
        productIndex: idx,
      });
    }
  }

  console.log(`\n=== Starting Campaign Ad Generation ===`);
  console.log(`Campaign: ${campaign.name}`);
  console.log(`Brand: ${brandProfile.companyName}`);
  console.log(`Platforms: ${targetPlatforms.join(', ')}`);
  console.log(`Style: ${style}`);
  console.log(`Ad Targets: ${adTargets.map(t => t.name).join(', ')}`);
  console.log(`Total ads to generate: ${adTargets.length * targetPlatforms.length}`);

  try {
    // Generate ads for each target (brand/product) on each platform
    for (const target of adTargets) {
      for (const platform of targetPlatforms) {
        const dimensions = PLATFORM_DIMENSIONS[platform];
        if (!dimensions) {
          console.log(`Skipping unknown platform: ${platform}`);
          continue;
        }

        const adLabel = target.type === 'brand'
          ? `${brandContext.companyName} (Brand)`
          : `${target.name} (Product)`;

        console.log(`\n--- Generating ad: ${adLabel} for ${dimensions.name} (${dimensions.width}x${dimensions.height}) ---`);

        try {
          // Build context for this specific ad
          const adContext = target.type === 'product' && target.product ? {
            ...brandContext,
            targetAudience: target.product.targetAudience || brandContext.targetAudience,
            uniqueSellingPoints: target.product.keyBenefits || brandContext.uniqueSellingPoints,
            productName: target.product.name,
            productDescription: target.product.description,
            promotionAngle: target.product.promotionAngle,
          } : brandContext;

          // Initialize cost tracking for this ad
          let copyGenerationCost = 0;
          let imageGenerationCost = 0;
          const uploadCost = 0; // Cloudinary is free tier
          const backgroundRemovalCost = 0; // Not used in campaign generation

          // Step 1: Generate image prompt
          console.log('Generating image prompt...');
          const imagePrompt = await generateImagePrompt(
            adContext,
            style,
            false, // no product image
            customInstructions
          );
          console.log('Image prompt:', imagePrompt.substring(0, 100) + '...');
          // Estimate cost for prompt generation (typically ~500 input, ~200 output tokens)
          const promptGenCost = (500 / 1000) * MODEL_PRICING['gemini-3-flash'].input +
                                (200 / 1000) * MODEL_PRICING['gemini-3-flash'].output;
          copyGenerationCost += promptGenCost;

          // Step 2: Generate image at platform dimensions
          console.log('Generating image...');
          const imageBuffer = await generateImage({
            prompt: imagePrompt,
            width: dimensions.width,
            height: dimensions.height,
          });
          // Cost for image generation
          imageGenerationCost = MODEL_PRICING['flux-pro-1.1'].perImage;

          // Step 3: Upload to Cloudinary
          console.log('Uploading to Cloudinary...');
          const imageName = `campaign-${campaign.id}-${target.type}-${platform}-${Date.now()}`;
          const { url: imageUrl } = await uploadToCloudinary(imageBuffer, imageName);
          console.log('Image uploaded:', imageUrl);

          // Step 4: Generate ad copy
          console.log('Generating ad copy...');
          const copyRaw = await generateAdCopy(adContext, style, customInstructions);
          // Estimate cost for copy generation (typically ~800 input, ~150 output tokens)
          const copyGenCost = (800 / 1000) * MODEL_PRICING['gemini-3-flash'].input +
                              (150 / 1000) * MODEL_PRICING['gemini-3-flash'].output;
          copyGenerationCost += copyGenCost;

          let adCopy: { headline: string; body: string; cta: string; hashtags: string[] };
          try {
            const jsonMatch = copyRaw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, copyRaw];
            adCopy = JSON.parse(jsonMatch[1] || copyRaw);
          } catch {
            const name = target.type === 'product' ? target.name : brandContext.companyName;
            adCopy = {
              headline: `Discover ${name}`,
              body: target.type === 'product' && target.product
                ? target.product.promotionAngle || target.product.description
                : (brandContext.uniqueSellingPoints[0] || 'Experience the difference.'),
              cta: 'Learn More',
              hashtags: ['#' + brandContext.companyName.replace(/\s/g, ''), '#' + brandContext.industry.replace(/\s/g, '')],
            };
          }

          // Calculate total cost breakdown
          const totalCost = imageGenerationCost + copyGenerationCost + uploadCost + backgroundRemovalCost;
          const costBreakdown = {
            imageGeneration: imageGenerationCost,
            copyGeneration: copyGenerationCost,
            backgroundRemoval: backgroundRemovalCost,
            upload: uploadCost,
            total: totalCost,
          };

          // Step 5: Save ad to database with cost tracking
          const ad = await prisma.ad.create({
            data: {
              style,
              imageUrl,
              headline: adCopy.headline,
              body: adCopy.body,
              cta: adCopy.cta,
              hashtags: JSON.stringify(adCopy.hashtags),
              imagePrompt,
              productName: target.type === 'product' ? target.name : null,
              productIndex: target.productIndex ?? null,
              brandProfileId: brandProfile.id,
              campaignId: campaign.id,
              generationCost: totalCost,
              costBreakdown: JSON.stringify(costBreakdown),
            },
          });

          // Step 6: Create export record for this platform
          await prisma.adExport.create({
            data: {
              platform,
              width: dimensions.width,
              height: dimensions.height,
              format: 'png',
              url: imageUrl,
              adId: ad.id,
            },
          });

          console.log(`Ad created: ${ad.id} with cost: $${totalCost.toFixed(4)}`);
        } catch (adError) {
          console.error(`Failed to generate ad for ${adLabel} on ${platform}:`, adError);
          // Continue with other ads
        }
      }
    }

    // Update campaign status to active
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.ACTIVE },
    });

    console.log(`\n=== Campaign Ad Generation Complete ===\n`);
  } catch (error) {
    console.error('Campaign generation error:', error);
    // Mark campaign as failed/draft
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.DRAFT },
    });
  }
}

/**
 * POST /api/campaigns/:id/ads
 * Add an existing ad to a campaign
 */
router.post('/:id/ads', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const { adId } = req.body;

    if (!adId) {
      res.status(400).json({ success: false, error: 'adId is required' });
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    const ad = await prisma.ad.update({
      where: { id: adId },
      data: { campaignId: campaign.id },
    });

    res.json({ success: true, ad });
  } catch (error) {
    console.error('Error adding ad to campaign:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add ad to campaign',
    });
  }
});

/**
 * DELETE /api/campaigns/:id/ads/:adId
 * Remove an ad from a campaign (doesn't delete the ad)
 */
router.delete('/:id/ads/:adId', async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const adId = req.params.adId as string;
    const ad = await prisma.ad.findFirst({
      where: {
        id: adId,
        campaignId: campaignId,
      },
    });

    if (!ad) {
      res.status(404).json({ success: false, error: 'Ad not found in this campaign' });
      return;
    }

    await prisma.ad.update({
      where: { id: ad.id },
      data: { campaignId: null },
    });

    res.json({ success: true, message: 'Ad removed from campaign' });
  } catch (error) {
    console.error('Error removing ad from campaign:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove ad from campaign',
    });
  }
});

/**
 * GET /api/campaigns/platforms
 * Get list of available platforms
 */
router.get('/platforms/list', (_req: Request, res: Response) => {
  const platforms = Object.entries(PLATFORM_DIMENSIONS).map(([id, info]) => ({
    id,
    ...info,
  }));

  res.json({ success: true, platforms });
});

export default router;
