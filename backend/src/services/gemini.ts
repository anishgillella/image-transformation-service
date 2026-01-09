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
      model: 'google/gemini-2.0-flash-001',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://adforge.app',
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
 * Analyze brand from website content and extract all products/services
 */
export async function analyzeBrand(websiteContent: string, url: string): Promise<string> {
  const systemPrompt = `You are an elite brand strategist with 20+ years of experience at top agencies like Wieden+Kennedy and Droga5. Your expertise is extracting the essence of a brand and understanding their product portfolio for marketing purposes.

TASK: Analyze the provided website content and extract:
1. A comprehensive brand profile
2. ALL products or services offered, with marketing-ready insights for each

ANALYSIS FRAMEWORK:
1. **Brand Essence**: Core promise/value this brand delivers
2. **Visual Identity**: Infer color palette from industry, messaging, and tone
3. **Voice Analysis**: Communication style - formal/casual, technical/accessible, bold/subtle
4. **Audience Profiling**: Who they're speaking to - demographics + psychographics
5. **Product Portfolio**: Every product/service with specific marketing angles

Return a JSON object with EXACTLY this structure (no markdown, just raw JSON):
{
  "companyName": "Official company name",
  "personality": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode"
  },
  "targetAudience": "Overall brand target audience description",
  "voiceTone": "Communication style in 10-15 words",
  "visualStyle": "Visual aesthetic description",
  "industry": "Specific industry/vertical",
  "uniqueSellingPoints": ["USP 1", "USP 2", "USP 3"],
  "products": [
    {
      "name": "Product/Service Name",
      "description": "What it is and what it does",
      "features": ["feature 1", "feature 2", "feature 3"],
      "targetAudience": "Specific audience for THIS product",
      "promotionAngle": "Best way to promote this - the hook, the pain point it solves",
      "keyBenefits": ["benefit 1", "benefit 2", "benefit 3"]
    }
  ]
}

PRODUCT EXTRACTION RULES:
- Extract EVERY product or service mentioned
- If only one product exists, still return it in the products array
- For SaaS: each pricing tier or feature set can be a separate "product"
- For services: each service offering is a product
- promotionAngle should be specific and actionable - what makes someone want to buy THIS product

COLOR INFERENCE GUIDELINES:
- Tech/SaaS: Blues, purples, gradients (Stripe=#635BFF, Slack=#4A154B)
- Finance: Blues, greens, navy (trust, stability)
- Health/Wellness: Greens, teals, soft blues
- Creative/Agency: Bold colors, black/white, unconventional
- E-commerce: Warm and inviting, category-dependent
- B2B Enterprise: Professional blues, grays, conservative

BE SPECIFIC. Every insight should be actionable for creating targeted ads.`;

  const response = await chatWithGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze this company's brand and extract all products (${url}):\n\n---WEBSITE CONTENT---\n${websiteContent}\n---END CONTENT---\n\nExtract the complete brand profile with all products:` },
  ], {
    temperature: 0.4,
    maxTokens: 3000, // Increased for product details
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
  const styleGuidelines: Record<string, string> = {
    minimal: 'Clean, sparse, let whitespace speak. Short punchy copy. Premium feel.',
    gradient: 'Modern, dynamic, tech-forward. Confident, forward-looking language.',
    abstract: 'Creative, artistic, thought-provoking. Can be more conceptual/poetic.',
    lifestyle: 'Relatable, aspirational, human-centered. Focus on benefits and emotions.',
  };

  const systemPrompt = `You are a world-class advertising copywriter who has written campaigns for Apple, Nike, and Airbnb. You write copy that stops thumbs mid-scroll.

TASK: Generate ad copy that feels like it came from the brand's own marketing team.

COPY PRINCIPLES:
1. **Headline**: The hook. 3-8 words max. Creates curiosity or speaks to a pain point. No clickbait.
2. **Body**: Expands on the headline. 1-2 sentences. Benefit-focused, not feature-focused.
3. **CTA**: Action verb + outcome. "Start Free Trial" not "Click Here". 2-4 words.
4. **Hashtags**: Mix of branded, industry, and trending. No spaces, proper capitalization.

STYLE DIRECTION FOR THIS AD: ${styleGuidelines[style] || 'Professional and engaging'}

VOICE MATCHING:
- Read the brand's voice/tone carefully
- Mirror their level of formality
- Use vocabulary that fits their industry
- Match their energy (bold vs. subtle, playful vs. serious)

Return ONLY a JSON object (no markdown):
{
  "headline": "Your headline here",
  "body": "Your body copy here",
  "cta": "Your CTA here",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"]
}`;

  const userPrompt = `Generate scroll-stopping ad copy for:

BRAND: ${brandProfile.companyName}
INDUSTRY: ${brandProfile.industry}
TARGET AUDIENCE: ${brandProfile.targetAudience}
VOICE/TONE: ${brandProfile.voiceTone}
KEY SELLING POINTS:
${brandProfile.uniqueSellingPoints.map((usp: string, i: number) => `${i + 1}. ${usp}`).join('\n')}

AD STYLE: ${style}
${customInstructions ? `\nSPECIAL INSTRUCTIONS: ${customInstructions}` : ''}

Generate the ad copy JSON:`;

  const response = await chatWithGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.85,
    maxTokens: 500,
  });

  return response.content;
}

/**
 * Style-specific prompt templates for Flux
 */
const STYLE_TEMPLATES = {
  minimal: {
    withProduct: `Clean, minimalist product photography backdrop. Solid or subtly textured background in {colors}. Soft, even studio lighting. Large negative space in center for product placement. Premium, high-end aesthetic. Sharp focus, no distractions. Professional advertising photography style.`,
    withoutProduct: `Minimalist abstract composition. Clean geometric shapes or subtle gradients in {colors}. Elegant negative space. Premium, sophisticated aesthetic. Could work as a high-end brand ad backdrop. No text, no people. Sharp, modern, Apple-inspired visual style.`,
  },
  gradient: {
    withProduct: `Modern gradient background for product showcase. Smooth color transition using {colors}. Subtle light rays or bokeh effects. Clear central space for product. Contemporary, tech-forward aesthetic. Studio lighting with soft reflections. Professional product photography setup.`,
    withoutProduct: `Dynamic gradient artwork. Bold, flowing color transitions using {colors}. Abstract light effects, lens flares, or particle effects. Modern, energetic, tech-forward mood. Suitable for SaaS or tech advertising. No text. High resolution, sharp details.`,
  },
  abstract: {
    withProduct: `Artistic abstract background for product display. Creative shapes, textures, or patterns in {colors}. Artistic but not overwhelming - product should remain hero. Interesting visual texture. Contemporary art meets commercial photography. Clear central focal area.`,
    withoutProduct: `Bold abstract art composition. Expressive shapes, dynamic forms, artistic texture in {colors}. Creative, thought-provoking, gallery-worthy aesthetic. Could be a campaign hero image. No text, no recognizable objects. High contrast, visually striking.`,
  },
  lifestyle: {
    withProduct: `Lifestyle scene background for product integration. {scene_context}. Natural lighting, warm and inviting atmosphere. Colors complementing {colors}. Shallow depth of field with blurred background. Clear foreground space for product. Authentic, aspirational mood.`,
    withoutProduct: `Aspirational lifestyle photography. {scene_context}. Natural lighting, candid feel. Color palette incorporating {colors}. Evokes emotion and desire. No text overlays. Could be an Instagram ad or billboard. Professional photography quality.`,
  },
};

/**
 * Generate image prompt based on brand profile
 */
export async function generateImagePrompt(
  brandProfile: any,
  style: string,
  hasProductImage: boolean,
  customInstructions?: string
): Promise<string> {
  const template = STYLE_TEMPLATES[style as keyof typeof STYLE_TEMPLATES] || STYLE_TEMPLATES.minimal;
  const baseTemplate = hasProductImage ? template.withProduct : template.withoutProduct;

  const systemPrompt = `You are an expert prompt engineer for Flux, a state-of-the-art AI image generator. You create prompts that produce stunning, professional advertising visuals.

FLUX PROMPT BEST PRACTICES:
1. Start with the main subject/scene description
2. Specify lighting (studio, natural, dramatic, soft)
3. Include color palette explicitly
4. Mention style references (photography style, art movement)
5. Add quality boosters: "professional photography", "8k", "sharp focus", "high detail"
6. Avoid: text, logos, watermarks, hands, faces (unless specifically needed)

YOUR TASK: Create a Flux prompt for a ${hasProductImage ? 'product photography backdrop (MUST have clear central space for product)' : 'standalone ad visual'}.

TEMPLATE TO ENHANCE:
${baseTemplate}

Make it specific to the brand while following the template structure. Output ONLY the final prompt, no explanations.`;

  const colorString = `${brandProfile.colors.primary}, ${brandProfile.colors.secondary}, and ${brandProfile.colors.accent}`;

  // Generate scene context for lifestyle based on industry
  const sceneContexts: Record<string, string> = {
    'Tech': 'Modern home office or co-working space',
    'SaaS': 'Clean desk setup with laptop and coffee',
    'Finance': 'Professional office environment or upscale home',
    'Health': 'Bright, airy wellness space or nature setting',
    'E-commerce': 'Stylish living room or trendy cafe',
    'Food': 'Beautiful kitchen or dining setting',
    'Fashion': 'Urban street scene or minimalist studio',
    'default': 'Modern, aspirational environment fitting the brand',
  };

  const sceneContext = sceneContexts[brandProfile.industry] || sceneContexts['default'];

  const userPrompt = `Create a Flux image generation prompt for:

BRAND: ${brandProfile.companyName}
INDUSTRY: ${brandProfile.industry}
VISUAL STYLE: ${brandProfile.visualStyle}
BRAND PERSONALITY: ${brandProfile.personality.join(', ')}
COLOR PALETTE: ${colorString}

AD STYLE: ${style}
${hasProductImage ? 'REQUIREMENT: Must have clear, uncluttered central area for product compositing' : 'REQUIREMENT: Complete standalone visual, no product needed'}

SCENE CONTEXT (for lifestyle): ${sceneContext}
${customInstructions ? `SPECIAL INSTRUCTIONS: ${customInstructions}` : ''}

Generate the optimized Flux prompt:`;

  const response = await chatWithGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.75,
    maxTokens: 400,
  });

  // Clean up the response - remove any markdown or extra formatting
  let prompt = response.content.trim();
  prompt = prompt.replace(/^["']|["']$/g, ''); // Remove surrounding quotes if present
  prompt = prompt.replace(/```[\s\S]*?```/g, ''); // Remove code blocks

  return prompt;
}
