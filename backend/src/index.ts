import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import imageRoutes from './routes/images';
import adforgeRoutes from './routes/adforge';
import campaignRoutes from './routes/campaigns';
import { costTracker } from './services/costTracker';

// Load environment variables from workspace root (uplane/.env)
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

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
    const allCampaignCosts = await costTracker.getAllCampaignCosts();
    res.json({ success: true, ...allCampaignCosts });
  } catch (error) {
    console.error('Error getting all campaign costs:', error);
    res.status(500).json({ success: false, error: 'Failed to get campaign costs' });
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
