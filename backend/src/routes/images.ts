import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { removeBackground } from '../services/removeBg';
import { flipHorizontally } from '../services/imageProcessor';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinary';
import { ProcessedImage } from '../types';

const router = Router();

// In-memory storage for session (cleared on server restart)
const imageStore: Map<string, ProcessedImage> = new Map();

/**
 * POST /api/images/upload
 * Upload an image, remove background, flip, and host
 */
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No image file provided' });
      return;
    }

    const originalBuffer = req.file.buffer;
    const originalName = req.file.originalname;

    console.log(`Processing image: ${originalName}`);

    // Step 1: Remove background
    console.log('Removing background...');
    const noBgBuffer = await removeBackground(originalBuffer);

    // Step 2: Flip horizontally
    console.log('Flipping image...');
    const flippedBuffer = await flipHorizontally(noBgBuffer);

    // Step 3: Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const { url, publicId } = await uploadToCloudinary(flippedBuffer, originalName);

    // Create image record
    const image: ProcessedImage = {
      id: publicId.split('/').pop() || publicId,
      originalName,
      url,
      publicId,
      createdAt: new Date(),
    };

    // Store in memory
    imageStore.set(image.id, image);

    console.log(`Image processed successfully: ${url}`);

    res.json({ success: true, image });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image',
    });
  }
});

/**
 * GET /api/images
 * List all processed images
 */
router.get('/', (req: Request, res: Response) => {
  const images = Array.from(imageStore.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  res.json({ success: true, images });
});

/**
 * GET /api/images/:id
 * Get a single image by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  const image = imageStore.get(req.params.id);

  if (!image) {
    res.status(404).json({ success: false, error: 'Image not found' });
    return;
  }

  res.json({ success: true, image });
});

/**
 * DELETE /api/images/:id
 * Delete an image
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const image = imageStore.get(req.params.id);

    if (!image) {
      res.status(404).json({ success: false, error: 'Image not found' });
      return;
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(image.publicId);

    // Remove from memory
    imageStore.delete(req.params.id);

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    });
  }
});

export default router;
