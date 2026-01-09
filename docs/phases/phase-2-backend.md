# Phase 2: Backend Implementation

## Objective
Build the complete backend API with image processing pipeline: upload → background removal → flip → host.

---

## 2.1 Type Definitions

Create `src/types/index.ts`:

```typescript
export interface ProcessedImage {
  id: string;
  originalName: string;
  url: string;
  publicId: string;
  createdAt: Date;
}

export interface UploadResponse {
  success: boolean;
  image?: ProcessedImage;
  error?: string;
}

export interface ImageListResponse {
  success: boolean;
  images: ProcessedImage[];
}
```

---

## 2.2 Cloudinary Service

Create `src/services/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary
 */
export async function uploadToCloudinary(
  imageBuffer: Buffer,
  filename: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'transformed-images',
        public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(imageBuffer);
  });
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
```

---

## 2.3 Remove.bg Service

Create `src/services/removeBg.ts`:

```typescript
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

/**
 * Remove background from an image using Remove.bg API
 * Returns a PNG buffer with transparent background
 */
export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData();
  formData.append('image_file', imageBuffer, {
    filename: 'image.png',
    contentType: 'image/png',
  });
  formData.append('size', 'auto');

  const response = await axios.post(REMOVE_BG_API_URL, formData, {
    headers: {
      ...formData.getHeaders(),
      'X-Api-Key': process.env.REMOVE_BG_API_KEY,
    },
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data);
}
```

---

## 2.4 Image Processor Service

Create `src/services/imageProcessor.ts`:

```typescript
import sharp from 'sharp';

/**
 * Flip an image horizontally (mirror effect)
 */
export async function flipHorizontally(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .flop() // flop = horizontal flip
    .png()  // ensure output is PNG (preserves transparency)
    .toBuffer();
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageBuffer: Buffer) {
  return sharp(imageBuffer).metadata();
}
```

---

## 2.5 Upload Middleware

Create `src/middleware/upload.ts`:

```typescript
import multer from 'multer';

// Store files in memory as buffers
const storage = multer.memoryStorage();

// File filter - accept common image formats
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
});
```

---

## 2.6 Image Routes

Create `src/routes/images.ts`:

```typescript
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
      return res.status(400).json({ success: false, error: 'No image file provided' });
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
    return res.status(404).json({ success: false, error: 'Image not found' });
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
      return res.status(404).json({ success: false, error: 'Image not found' });
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
```

---

## 2.7 Update Server Entry Point

Update `src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import imageRoutes from './routes/images';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/images', imageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 2.8 Testing the Backend

### Test with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Upload an image
curl -X POST http://localhost:3000/api/images/upload \
  -F "image=@/path/to/your/image.jpg"

# List all images
curl http://localhost:3000/api/images

# Get single image
curl http://localhost:3000/api/images/{image-id}

# Delete image
curl -X DELETE http://localhost:3000/api/images/{image-id}
```

### Expected Response for Upload

```json
{
  "success": true,
  "image": {
    "id": "1234567890-filename",
    "originalName": "photo.jpg",
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v123/transformed-images/1234567890-photo.png",
    "publicId": "transformed-images/1234567890-photo",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 2.9 Verification Checklist

- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Upload endpoint receives file
- [ ] Remove.bg API is called successfully
- [ ] Image is flipped horizontally
- [ ] Image is uploaded to Cloudinary
- [ ] URL is returned in response
- [ ] List endpoint returns all images
- [ ] Delete endpoint removes image from Cloudinary

---

## 2.10 Troubleshooting

### "Invalid API Key" from Remove.bg
- Check `REMOVE_BG_API_KEY` in `.env`
- Ensure no extra spaces or quotes

### "Upload failed" from Cloudinary
- Verify all three Cloudinary env vars are set
- Check Cloudinary dashboard for API credentials

### "Cannot read property of undefined"
- Ensure all services are properly imported
- Check that `dotenv.config()` is called before accessing env vars

---

## Next Phase

Backend is complete. Proceed to **Phase 3: Frontend Implementation** to build the user interface.
