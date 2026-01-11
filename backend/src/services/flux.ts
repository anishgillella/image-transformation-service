import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { costTracker } from './costTracker';

dotenv.config({ path: path.resolve('/Users/anishgillella/Desktop/Stuff/Projects/uplane/.env') });

const BFL_API_URL = 'https://api.bfl.ml/v1';

interface FluxGenerateOptions {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

/**
 * Round dimensions to be divisible by 32 (Flux API requirement)
 * Also ensures minimum 256 and maximum 1440
 */
function normalizeFluxDimension(dim: number): number {
  // Clamp to valid range
  const clamped = Math.max(256, Math.min(1440, dim));
  // Round to nearest 32
  return Math.round(clamped / 32) * 32;
}

interface FluxFillOptions {
  image: Buffer;
  mask: Buffer;
  prompt: string;
  width?: number;
  height?: number;
}

/**
 * Generate an image using Flux.2 Pro
 */
export async function generateImage(options: FluxGenerateOptions): Promise<Buffer> {
  // Normalize dimensions to Flux API requirements
  const width = normalizeFluxDimension(options.width ?? 1024);
  const height = normalizeFluxDimension(options.height ?? 1024);

  console.log(`Flux: Generating image at ${width}x${height} (requested: ${options.width}x${options.height})`);

  // Step 1: Submit generation request
  const submitResponse = await axios.post(
    `${BFL_API_URL}/flux-pro-1.1`,
    {
      prompt: options.prompt,
      width,
      height,
      steps: options.steps ?? 25,
      guidance: options.guidance ?? 3,
      safety_tolerance: 2,
      output_format: 'png',
    },
    {
      headers: {
        'X-Key': process.env.BFL_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  const taskId = submitResponse.data.id;

  // Step 2: Poll for result
  const imageUrl = await pollForResult(taskId);

  // Step 3: Download image
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  // Track cost
  costTracker.trackImageGeneration('flux-pro-1.1', 'image-generation', 1, { prompt: options.prompt.substring(0, 100) });

  return Buffer.from(imageResponse.data);
}

/**
 * Edit/inpaint an image using Flux Fill
 */
export async function fillImage(options: FluxFillOptions): Promise<Buffer> {
  // Convert buffers to base64
  const imageBase64 = options.image.toString('base64');
  const maskBase64 = options.mask.toString('base64');

  // Step 1: Submit fill request
  const submitResponse = await axios.post(
    `${BFL_API_URL}/flux-pro-1.0-fill`,
    {
      image: imageBase64,
      mask: maskBase64,
      prompt: options.prompt,
      width: options.width ?? 1024,
      height: options.height ?? 1024,
      safety_tolerance: 2,
      output_format: 'png',
    },
    {
      headers: {
        'X-Key': process.env.BFL_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  const taskId = submitResponse.data.id;

  // Step 2: Poll for result
  const imageUrl = await pollForResult(taskId);

  // Step 3: Download image
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  // Track cost
  costTracker.trackImageGeneration('flux-pro-fill', 'image-fill', 1, { prompt: options.prompt.substring(0, 100) });

  return Buffer.from(imageResponse.data);
}

/**
 * Poll BFL API for task completion
 */
async function pollForResult(taskId: string, maxAttempts = 60): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await axios.get(
      `${BFL_API_URL}/get_result?id=${taskId}`,
      {
        headers: {
          'X-Key': process.env.BFL_API_KEY,
        },
      }
    );

    const status = response.data.status;

    if (status === 'Ready') {
      return response.data.result.sample;
    } else if (status === 'Error') {
      throw new Error(`Flux generation failed: ${response.data.error}`);
    }

    // Wait 1 second before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Flux generation timed out');
}

/**
 * Create a mask from a transparent PNG (background = white, product = black)
 */
export async function createMaskFromTransparent(transparentImage: Buffer): Promise<Buffer> {
  const sharp = (await import('sharp')).default;

  // Extract alpha channel and invert it
  // Transparent areas (background) become white
  // Opaque areas (product) become black
  const mask = await sharp(transparentImage)
    .extractChannel('alpha')
    .negate()
    .toBuffer();

  return mask;
}
