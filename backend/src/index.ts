import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import imageRoutes from './routes/images';
import adforgeRoutes from './routes/adforge';
import { costTracker } from './services/costTracker';

// Load environment variables from the shared .env file
dotenv.config({ path: path.resolve('/Users/anishgillella/Desktop/Stuff/Projects/uplane/.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased for base64 images

// Routes
app.use('/api/images', imageRoutes);
app.use('/api/adforge', adforgeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cost tracking endpoints
app.get('/api/costs', (req, res) => {
  const summary = costTracker.getSummary();
  res.json({ success: true, ...summary });
});

app.post('/api/costs/reset', (req, res) => {
  costTracker.reset();
  res.json({ success: true, message: 'Cost tracker reset' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
