import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import imageRoutes from './routes/images';
import adforgeRoutes from './routes/adforge';
import campaignRoutes from './routes/campaigns';
import { costTracker, MODEL_PRICING } from './services/costTracker';
import { prisma } from './services/database';

// Load environment variables
// Production (Render): env vars are already set via dashboard
// Development: load from workspace root
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased for base64 images

// Routes
app.use('/api/images', imageRoutes);
app.use('/api/adforge', adforgeRoutes);
app.use('/api/campaigns', campaignRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cost tracking endpoints
app.get('/api/costs', async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    const summary = await costTracker.getSummary(since);
    res.json({ success: true, ...summary });
  } catch (error) {
    console.error('Error getting costs:', error);
    res.status(500).json({ success: false, error: 'Failed to get costs' });
  }
});

app.get('/api/costs/monthly', async (req, res) => {
  try {
    const monthly = await costTracker.getMonthlyUsage();
    const total = await costTracker.getTotalSpending();
    res.json({ success: true, monthly, totalSpending: total });
  } catch (error) {
    console.error('Error getting monthly costs:', error);
    res.status(500).json({ success: false, error: 'Failed to get monthly costs' });
  }
});

app.get('/api/costs/campaign/:id', async (req, res) => {
  try {
    const campaignCosts = await costTracker.getCampaignCosts(req.params.id as string);
    res.json({ success: true, ...campaignCosts });
  } catch (error) {
    console.error('Error getting campaign costs:', error);
    res.status(500).json({ success: false, error: 'Failed to get campaign costs' });
  }
});

app.get('/api/costs/ad/:id', async (req, res) => {
  try {
    const adCosts = await costTracker.getAdCosts(req.params.id as string);
    res.json({ success: true, ...adCosts });
  } catch (error) {
    console.error('Error getting ad costs:', error);
    res.status(500).json({ success: false, error: 'Failed to get ad costs' });
  }
});

app.get('/api/costs/campaigns', async (req, res) => {
  try {
    const campaignsWithCosts = await costTracker.getAllCampaignsWithCosts();
    res.json({ success: true, campaigns: campaignsWithCosts });
  } catch (error) {
    console.error('Error getting campaigns with costs:', error);
    res.status(500).json({ success: false, error: 'Failed to get campaigns with costs' });
  }
});

// Backfill endpoint to estimate and set costs for existing ads without cost data
app.post('/api/costs/backfill', async (req, res) => {
  try {
    // Find all ads without cost data
    const adsWithoutCosts = await prisma.ad.findMany({
      where: {
        OR: [
          { generationCost: null },
          { generationCost: 0 },
        ],
      },
      select: {
        id: true,
        productName: true,
        campaignId: true,
      },
    });

    if (adsWithoutCosts.length === 0) {
      res.json({ success: true, message: 'No ads need cost backfilling', updated: 0 });
      return;
    }

    // Estimate costs based on typical ad generation:
    // - Image prompt generation: ~500 input tokens, ~200 output tokens
    // - Ad copy generation: ~800 input tokens, ~150 output tokens
    // - Image generation: 1 Flux Pro image
    // - Upload: Free (Cloudinary)
    const promptGenCost = (500 / 1000) * MODEL_PRICING['gemini-3-flash'].input +
                          (200 / 1000) * MODEL_PRICING['gemini-3-flash'].output;
    const copyGenCost = (800 / 1000) * MODEL_PRICING['gemini-3-flash'].input +
                        (150 / 1000) * MODEL_PRICING['gemini-3-flash'].output;
    const imageGenCost = MODEL_PRICING['flux-pro-1.1'].perImage;

    const totalCopyGenCost = promptGenCost + copyGenCost;
    const totalCost = imageGenCost + totalCopyGenCost;

    const costBreakdown = {
      imageGeneration: imageGenCost,
      copyGeneration: totalCopyGenCost,
      backgroundRemoval: 0,
      upload: 0,
      total: totalCost,
    };

    // Update all ads without costs
    const updateResult = await prisma.ad.updateMany({
      where: {
        OR: [
          { generationCost: null },
          { generationCost: 0 },
        ],
      },
      data: {
        generationCost: totalCost,
        costBreakdown: JSON.stringify(costBreakdown),
      },
    });

    console.log(`Backfilled costs for ${updateResult.count} ads at $${totalCost.toFixed(4)} each`);

    res.json({
      success: true,
      message: `Backfilled costs for ${updateResult.count} ads`,
      updated: updateResult.count,
      estimatedCostPerAd: totalCost,
      costBreakdown,
    });
  } catch (error) {
    console.error('Error backfilling costs:', error);
    res.status(500).json({ success: false, error: 'Failed to backfill costs' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
