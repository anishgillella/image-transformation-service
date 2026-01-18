import axios from 'axios';
import { costTracker } from './costTracker';

// OpenAI DALL-E API
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

interface FluxGenerateOptions {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

/**
 * Map dimensions to DALL-E 3 supported sizes
 * DALL-E 3 supports: 1024x1024, 1024x1792 (portrait), 1792x1024 (landscape)
 */
function getDalleSize(width: number, height: number): '1024x1024' | '1024x1792' | '1792x1024' {
  const aspectRatio = width / height;

  if (aspectRatio > 1.3) {
    // Landscape
    return '1792x1024';
  } else if (aspectRatio < 0.77) {
    // Portrait
    return '1024x1792';
  } else {
    // Square-ish
    return '1024x1024';
  }
}

interface FluxFillOptions {
  image: Buffer;
  mask: Buffer;
  prompt: string;
  width?: number;
  height?: number;
}

/**
 * Generate an image using OpenAI DALL-E 3
 */
export async function generateImage(options: FluxGenerateOptions): Promise<Buffer> {
  const requestedWidth = options.width ?? 1024;
  const requestedHeight = options.height ?? 1024;
  const size = getDalleSize(requestedWidth, requestedHeight);

  console.log(`DALL-E: Generating image at ${size} (requested: ${requestedWidth}x${requestedHeight})`);

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Please add it to your .env file.');
  }

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'dall-e-3',
        prompt: options.prompt,
        n: 1,
        size: size,
        quality: 'standard',
        response_format: 'url',
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minute timeout
      }
    );

    const imageUrl = response.data.data[0].url;

    // Download image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });

    // Track cost - DALL-E 3 pricing
    const cost = size === '1024x1024' ? 0.04 : 0.08; // Standard quality pricing
    costTracker.trackImageGeneration('dalle-3', 'image-generation', 1, undefined, {
      prompt: options.prompt.substring(0, 100),
      size,
      cost,
    });

    return Buffer.from(imageResponse.data);
  } catch (error: any) {
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data?.error;

      if (status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY.');
      } else if (status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again in a few moments.');
      } else if (status === 400 && errorData?.code === 'content_policy_violation') {
        throw new Error('Image generation failed: Content policy violation. Try a different prompt.');
      } else if (status === 400) {
        throw new Error(`Image generation failed: ${errorData?.message || 'Bad request'}`);
      } else if (status === 500 || status === 503) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      }

      throw new Error(`Image generation failed: ${errorData?.message || error.message}`);
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Image generation timed out. Please try again.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to OpenAI. Check your internet connection.');
    }

    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Edit/inpaint an image using DALL-E 2 (DALL-E 3 doesn't support inpainting)
 * Falls back to generating a new image with context from the prompt
 */
export async function fillImage(options: FluxFillOptions): Promise<Buffer> {
  // DALL-E 3 doesn't support inpainting, so we generate a new image
  // with the prompt that describes what we want
  console.log('DALL-E: Fill/inpaint not supported, generating new image with prompt');

  return generateImage({
    prompt: options.prompt,
    width: options.width,
    height: options.height,
  });
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
