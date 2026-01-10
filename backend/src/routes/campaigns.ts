import { Router, Request, Response } from 'express';
import { prisma } from '../services/database';
import { CampaignStatus } from '@prisma/client';

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
      campaigns: campaigns.map((c) => ({
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
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        brandProfile: true,
        ads: {
          include: {
            exports: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

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
      ads: campaign.ads.map((ad) => ({
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
    const { name, description, brandProfileId, targetPlatforms, style, customInstructions } = req.body;

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
    const { name, description, targetPlatforms, style, customInstructions, status } = req.body;

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
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
      where: { id: req.params.id },
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
    });

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
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
    });

    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    // Delete campaign (cascades to ads due to schema)
    await prisma.campaign.delete({
      where: { id: req.params.id },
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
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        brandProfile: true,
      },
    });

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

    // TODO: Trigger actual ad generation in background
    // This would call the existing ad generation logic for each platform
    // For now, mark as active after a delay
    setTimeout(async () => {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: CampaignStatus.ACTIVE },
      });
    }, 2000);
  } catch (error) {
    console.error('Error generating campaign ads:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate campaign',
    });
  }
});

/**
 * POST /api/campaigns/:id/ads
 * Add an existing ad to a campaign
 */
router.post('/:id/ads', async (req: Request, res: Response) => {
  try {
    const { adId } = req.body;

    if (!adId) {
      res.status(400).json({ success: false, error: 'adId is required' });
      return;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
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
    const ad = await prisma.ad.findFirst({
      where: {
        id: req.params.adId,
        campaignId: req.params.id,
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
