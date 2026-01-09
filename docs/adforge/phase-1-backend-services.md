# Phase 1: Backend Services Integration

## Objective
Set up all external service integrations: Parallel AI, OpenRouter (Gemini), and BFL Flux.

---

## 1.1 Environment Variables

Add to `backend/.env`:

```env
# Existing
PORT=3000
REMOVE_BG_API_KEY=your_key
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# New - AdForge
PARALLEL_API_KEY=your_parallel_ai_key
OPENROUTER_API_KEY=your_openrouter_key
BFL_API_KEY=your_bfl_key
```

Update `backend/.env.example` accordingly.

---

## 1.2 Install Dependencies

```bash
cd backend
npm install node-fetch@2
```

Note: We'll use `axios` (already installed) for most API calls.

---

## 1.3 Parallel AI Service

Create `backend/src/services/parallelAi.ts`:

```typescript
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PARALLEL_API_URL = 'https://api.parallel.ai/v1';

interface ExtractResponse {
  content: string;
  title?: string;
  description?: string;
  url: string;
}

/**
 * Extract clean, LLM-optimized content from a URL
 */
export async function extractWebContent(url: string): Promise<ExtractResponse> {
  const response = await axios.post(
    `${PARALLEL_API_URL}/extract`,
    {
      url,
      include_metadata: true,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.PARALLEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    content: response.data.content,
    title: response.data.metadata?.title,
    description: response.data.metadata?.description,
    url: response.data.url,
  };
}

/**
 * Search the web for additional company information
 */
export async function searchCompanyInfo(query: string): Promise<string[]> {
  const response = await axios.post(
    `${PARALLEL_API_URL}/search`,
    {
      query,
      num_results: 5,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.PARALLEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.results.map((r: any) => r.excerpt);
}
```

---

## 1.4 OpenRouter (Gemini) Service

Create `backend/src/services/gemini.ts`:

```typescript
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GeminiResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Send a chat completion request to Gemini 3 Flash via OpenRouter
 */
export async function chatWithGemini(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<GeminiResponse> {
  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: 'google/gemini-3-flash-preview',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://adforge.app', // Required by OpenRouter
        'X-Title': 'AdForge',
      },
    }
  );

  return {
    content: response.data.choices[0].message.content,
    usage: {
      promptTokens: response.data.usage?.prompt_tokens ?? 0,
      completionTokens: response.data.usage?.completion_tokens ?? 0,
    },
  };
}

/**
 * Analyze brand from website content
 */
export async function analyzeBrand(websiteContent: string, url: string): Promise<string> {
  const systemPrompt = `You are a brand strategist and marketing expert. Analyze the provided website content and extract a comprehensive brand profile.

Return a JSON object with exactly this structure:
{
  "companyName": "string",
  "personality": ["trait1", "trait2", "trait3"],
  "colors": {
    "primary": "#hexcode (best guess from content/industry)",
    "secondary": "#hexcode",
    "accent": "#hexcode"
  },
  "targetAudience": "string describing ideal customer",
  "voiceTone": "string describing communication style",
  "visualStyle": "string describing visual aesthetic",
  "industry": "string",
  "uniqueSellingPoints": ["usp1", "usp2", "usp3"]
}

Be specific and insightful. Don't be generic. Really understand what makes this brand unique.`;

  const response = await chatWithGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze this company (${url}):\n\n${websiteContent}` },
  ], {
    temperature: 0.5, // Lower for more consistent structured output
  });

  return response.content;
}

/**
 * Generate ad copy based on brand profile
 */
export async function generateAdCopy(
  brandProfile: any,
  style: string,
  customInstructions?: string
): Promise<string> {
  const systemPrompt = `You are an expert advertising copywriter. Generate compelling ad copy that perfectly matches the brand's voice and style.

Return a JSON object with exactly this structure:
{
  "headline": "Punchy headline under 10 words",
  "body": "Compelling body copy, 1-2 sentences max",
  "cta": "Action-oriented CTA, 2-4 words",
  "hashtags": ["tag1", "tag2", "tag3", "tag4"]
}

The copy should:
- Match the brand's voice/tone exactly
- Appeal to the target audience
- Highlight unique selling points
- Be suitable for social media ads
- Feel authentic to the brand, not generic`;

  const userPrompt = `Generate ad copy for this brand:

Brand Profile:
${JSON.stringify(brandProfile, null, 2)}

Ad Style: ${style}
${customInstructions ? `Custom Instructions: ${customInstructions}` : ''}`;

  const response = await chatWithGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.8, // Higher for creative copy
  });

  return response.content;
}

/**
 * Generate image prompt based on brand profile
 */
export async function generateImagePrompt(
  brandProfile: any,
  style: string,
  hasProductImage: boolean,
  customInstructions?: string
): Promise<string> {
  const systemPrompt = `You are an expert at writing prompts for AI image generation. Create a detailed prompt for generating a professional ad background/scene.

The prompt should:
- Be specific and detailed (50-100 words)
- Incorporate the brand's colors and visual style
- Match the selected ad style
- ${hasProductImage ? 'Leave clear space in the center for a product to be composited' : 'Create a complete, standalone ad visual'}
- Be suitable for commercial advertising
- NOT include any text or typography (that will be added separately)

Return ONLY the prompt text, no JSON or explanation.`;

  const userPrompt = `Create an image generation prompt for:

Brand: ${brandProfile.companyName}
Colors: Primary ${brandProfile.colors.primary}, Secondary ${brandProfile.colors.secondary}
Visual Style: ${brandProfile.visualStyle}
Industry: ${brandProfile.industry}
Personality: ${brandProfile.personality.join(', ')}

Ad Style: ${style}
Has Product Image: ${hasProductImage}
${customInstructions ? `Custom Instructions: ${customInstructions}` : ''}`;

  const response = await chatWithGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.7,
  });

  return response.content;
}
```

---

## 1.5 BFL Flux Service

Create `backend/src/services/flux.ts`:

```typescript
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BFL_API_URL = 'https://api.bfl.ml/v1';

interface FluxGenerateOptions {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

interface FluxFillOptions {
  image: Buffer;        // Original image with product
  mask: Buffer;         // Mask indicating area to fill (background)
  prompt: string;
  width?: number;
  height?: number;
}

/**
 * Generate an image using Flux.2 Pro
 */
export async function generateImage(options: FluxGenerateOptions): Promise<Buffer> {
  // Step 1: Submit generation request
  const submitResponse = await axios.post(
    `${BFL_API_URL}/flux-pro-1.1`,
    {
      prompt: options.prompt,
      width: options.width ?? 1024,
      height: options.height ?? 1024,
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
```

---

## 1.6 Update Types

Add to `backend/src/types/index.ts`:

```typescript
// Existing types...

// AdForge types
export interface BrandProfile {
  companyName: string;
  url: string;
  personality: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  targetAudience: string;
  voiceTone: string;
  visualStyle: string;
  industry: string;
  uniqueSellingPoints: string[];
  analyzedAt: Date;
}

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export type AdStyle = 'minimal' | 'gradient' | 'abstract' | 'lifestyle';

export interface GeneratedAd {
  id: string;
  brandProfile: BrandProfile;
  style: AdStyle;
  customInstructions?: string;
  imageUrl: string;
  copy: AdCopy;
  hasProductImage: boolean;
  productImageUrl?: string;
  createdAt: Date;
}

export interface AnalyzeRequest {
  url: string;
}

export interface GenerateRequest {
  brandProfile: BrandProfile;
  style: AdStyle;
  customInstructions?: string;
  productImage?: string; // Base64 encoded
}
```

---

## 1.7 Verification Checklist

### Parallel AI
- [ ] API key set in `.env`
- [ ] Can extract content from a test URL
- [ ] Returns clean markdown content

### OpenRouter (Gemini)
- [ ] API key set in `.env`
- [ ] Can send chat completion request
- [ ] Returns valid JSON for brand analysis

### BFL Flux
- [ ] API key set in `.env`
- [ ] Can submit generation request
- [ ] Can poll for and receive result
- [ ] Generated images are valid PNGs

---

## 1.8 Testing the Services

Create a test script `backend/src/test-services.ts`:

```typescript
import { extractWebContent } from './services/parallelAi';
import { analyzeBrand } from './services/gemini';
import { generateImage } from './services/flux';
import dotenv from 'dotenv';

dotenv.config();

async function testServices() {
  console.log('Testing AdForge services...\n');

  // Test 1: Parallel AI
  console.log('1. Testing Parallel AI...');
  try {
    const content = await extractWebContent('https://uplane.com');
    console.log('✓ Parallel AI working. Content length:', content.content.length);
  } catch (error) {
    console.log('✗ Parallel AI failed:', error);
  }

  // Test 2: Gemini
  console.log('\n2. Testing Gemini...');
  try {
    const analysis = await analyzeBrand('Uplane is an AI marketing platform...', 'https://uplane.com');
    console.log('✓ Gemini working. Analysis:', analysis.substring(0, 200) + '...');
  } catch (error) {
    console.log('✗ Gemini failed:', error);
  }

  // Test 3: Flux
  console.log('\n3. Testing Flux...');
  try {
    const image = await generateImage({
      prompt: 'A minimal, modern gradient background in purple and blue tones, suitable for tech advertising',
      width: 512,
      height: 512,
    });
    console.log('✓ Flux working. Image size:', image.length, 'bytes');
  } catch (error) {
    console.log('✗ Flux failed:', error);
  }

  console.log('\nAll tests complete!');
}

testServices();
```

Run with:
```bash
npx ts-node src/test-services.ts
```

---

## Next Phase

Once all services are working, proceed to **Phase 2: Brand Analysis** to build the URL analysis endpoint and brand profile display.
