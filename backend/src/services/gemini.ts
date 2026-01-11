import axios from 'axios';
import { costTracker } from './costTracker';

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
 * Send a chat completion request to Gemini 3 Flash Preview via OpenRouter
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
        'HTTP-Referer': 'https://adforge.app',
        'X-Title': 'AdForge',
      },
    }
  );

  const usage = {
    promptTokens: response.data.usage?.prompt_tokens ?? 0,
    completionTokens: response.data.usage?.completion_tokens ?? 0,
  };

  // Track cost
  costTracker.trackTokenUsage('gemini-3-flash', 'chat-completion', usage);

  return {
    content: response.data.choices[0].message.content,
    usage,
  };
}

/**
 * Detect if a URL is likely a product page vs a brand homepage
 */
function detectUrlType(url: string): 'product' | 'brand' {
  const urlLower = url.toLowerCase();

  // Common product page patterns
  const productPatterns = [
    /\/products?\//i,           // /product/ or /products/
    /\/p\//i,                   // /p/ (common shorthand)
    /\/item\//i,                // /item/
    /\/dp\//i,                  // Amazon-style /dp/
    /\/[a-z-]+-[a-z0-9]{5,}/i,  // slug-with-sku pattern
    /\/(t|i|c)\/[^\/]+\/[A-Z0-9-]+$/i, // Nike-style /t/name/SKU
    /\/shop\/[^\/]+\/[^\/]+/i,  // /shop/category/product
    /[\?\&]sku=/i,              // ?sku= query param
    /[\?\&]pid=/i,              // ?pid= query param
    /[\?\&]product_id=/i,       // ?product_id= query param
  ];

  for (const pattern of productPatterns) {
    if (pattern.test(urlLower)) {
      return 'product';
    }
  }

  // If URL has many path segments with alphanumeric IDs, likely a product
  const pathParts = new URL(url).pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    const lastPart = pathParts[pathParts.length - 1];
    // Check if last segment looks like a product SKU (alphanumeric with dashes)
    if (/^[A-Z0-9]+-[A-Z0-9]+$/i.test(lastPart) || /^[A-Z]{2,}\d{3,}/i.test(lastPart)) {
      return 'product';
    }
  }

  return 'brand';
}

/**
 * Analyze brand from website content and extract all products/services
 * @param websiteContent - The extracted content from the website
 * @param url - The URL being analyzed
 * @param userUrlType - Optional user-specified URL type (overrides auto-detection)
 */
export async function analyzeBrand(websiteContent: string, url: string, userUrlType?: 'brand' | 'product'): Promise<string> {
  // Use user-specified type if provided, otherwise auto-detect
  const urlType = userUrlType || detectUrlType(url);
  console.log(`URL type: ${urlType} for ${url}${userUrlType ? ' (user specified)' : ' (auto-detected)'}`);

  const basePrompt = `You are an elite brand strategist with 20+ years of experience at top agencies like Wieden+Kennedy and Droga5. Your expertise is extracting the essence of a brand and understanding their product portfolio for marketing purposes.`;

  const productPageInstructions = `
PAGE TYPE: This is a SPECIFIC PRODUCT PAGE.

IMPORTANT:
- The main product shown is what we want to create ads for
- Extract the parent company/brand info for brand consistency
- Focus deeply on THIS specific product's features, benefits, and selling points
- The products array should contain THIS product as the primary entry with rich detail
- You may include 1-2 related products if mentioned, but the main product should be comprehensive`;

  const brandPageInstructions = `
PAGE TYPE: This appears to be a BRAND HOMEPAGE or general page.

IMPORTANT:
- Extract the overall brand identity and positioning
- Find ALL products or services mentioned on this page
- Each product should have detailed marketing insights`;

  const pageTypeInstructions = urlType === 'product' ? productPageInstructions : brandPageInstructions;

  const systemPrompt = `${basePrompt}

${pageTypeInstructions}

ANALYSIS FRAMEWORK:
1. **Brand Essence**: Core promise/value this brand delivers
2. **Visual Identity**: Infer color palette from industry, messaging, and tone
3. **Voice Analysis**: Communication style - formal/casual, technical/accessible, bold/subtle
4. **Audience Profiling**: Who they're speaking to - demographics + psychographics
5. **Product Portfolio**: ${urlType === 'product' ? 'Deep-dive on the specific product shown' : 'Every product/service with specific marketing angles'}

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
${urlType === 'product' ? `
- Focus on the MAIN product being displayed
- Extract ALL features, specs, and benefits mentioned
- The promotionAngle should be highly specific to this exact product
- Include price point if visible (for ad targeting context)
- Make the product description rich and detailed for ad generation` : `
- Extract EVERY product or service mentioned
- If only one product exists, still return it in the products array
- For SaaS: each pricing tier or feature set can be a separate "product"
- For services: each service offering is a product`}
- promotionAngle should be specific and actionable - what makes someone want to buy THIS product

COLOR INFERENCE GUIDELINES:
- Tech/SaaS: Blues, purples, gradients (Stripe=#635BFF, Slack=#4A154B)
- Finance: Blues, greens, navy (trust, stability)
- Health/Wellness: Greens, teals, soft blues
- Creative/Agency: Bold colors, black/white, unconventional
- E-commerce: Warm and inviting, category-dependent
- B2B Enterprise: Professional blues, grays, conservative
- Athletic/Sportswear: Bold blacks, energetic colors (Nike=#FA5400, Adidas=#000000)

BE SPECIFIC. Every insight should be actionable for creating targeted ads.`;

  const userPrompt = urlType === 'product'
    ? `Analyze this PRODUCT PAGE and extract brand info + detailed product information (${url}):\n\n---WEBSITE CONTENT---\n${websiteContent}\n---END CONTENT---\n\nExtract the brand profile with focus on this specific product:`
    : `Analyze this company's brand and extract all products (${url}):\n\n---WEBSITE CONTENT---\n${websiteContent}\n---END CONTENT---\n\nExtract the complete brand profile with all products:`;

  const response = await chatWithGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.4,
    maxTokens: 3000,
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
 * Generate multiple copy variations (3 headlines, 3 bodies, 2 CTAs)
 */
export async function generateCopyVariations(
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

TASK: Generate MULTIPLE variations of ad copy for A/B testing. Each variation should be distinctly different while maintaining brand voice.

COPY PRINCIPLES:
1. **Headlines**: The hook. 3-8 words max. Creates curiosity or speaks to a pain point. No clickbait.
2. **Bodies**: Expands on the value. 1-2 sentences. Benefit-focused, not feature-focused.
3. **CTAs**: Action verb + outcome. "Start Free Trial" not "Click Here". 2-4 words.
4. **Hashtags**: Mix of branded, industry, and trending. 4 hashtags total.

VARIATION STRATEGY:
- Headline 1: Pain point focused
- Headline 2: Benefit/outcome focused
- Headline 3: Curiosity/intrigue focused
- Body 1: Emotional appeal
- Body 2: Logical/feature appeal
- Body 3: Social proof/urgency appeal
- CTA 1: Action-oriented
- CTA 2: Value-oriented

STYLE DIRECTION: ${styleGuidelines[style] || 'Professional and engaging'}

Return ONLY a JSON object (no markdown):
{
  "headlines": ["headline1", "headline2", "headline3"],
  "bodies": ["body1", "body2", "body3"],
  "ctas": ["cta1", "cta2"],
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"]
}`;

  const userPrompt = `Generate multiple copy variations for:

BRAND: ${brandProfile.companyName}
INDUSTRY: ${brandProfile.industry}
TARGET AUDIENCE: ${brandProfile.targetAudience}
VOICE/TONE: ${brandProfile.voiceTone}
KEY SELLING POINTS:
${brandProfile.uniqueSellingPoints.map((usp: string, i: number) => `${i + 1}. ${usp}`).join('\n')}

AD STYLE: ${style}
${customInstructions ? `\nSPECIAL INSTRUCTIONS: ${customInstructions}` : ''}

Generate the copy variations JSON:`;

  const response = await chatWithGemini([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.9, // Higher temperature for more variation
    maxTokens: 800,
  });

  return response.content;
}

/**
 * Style-specific prompt templates for Flux
 */
const STYLE_TEMPLATES = {
  minimal: {
    withProduct: `Clean, minimalist product photography backdrop. Solid or subtly textured background in {colors}. Soft, even studio lighting. Large negative space in center for product placement. Premium, high-end aesthetic. Sharp focus, no distractions. Professional advertising photography style.`,
    withoutProduct: `Minimalist product showcase. The product as hero element on clean background in {colors}. Premium studio photography lighting. Professional advertising aesthetic. Sharp focus on product details. High-end brand feel. No text overlays. 8K quality, commercial photography.`,
  },
  gradient: {
    withProduct: `Modern gradient background for product showcase. Smooth color transition using {colors}. Subtle light rays or bokeh effects. Clear central space for product. Contemporary, tech-forward aesthetic. Studio lighting with soft reflections. Professional product photography setup.`,
    withoutProduct: `Product hero shot with dynamic gradient background. The product floating or displayed prominently with flowing color transitions using {colors}. Modern tech-forward aesthetic. Dramatic lighting with reflections. Professional advertising photography. No text. 8K quality.`,
  },
  abstract: {
    withProduct: `Artistic abstract background for product display. Creative shapes, textures, or patterns in {colors}. Artistic but not overwhelming - product should remain hero. Interesting visual texture. Contemporary art meets commercial photography. Clear central focal area.`,
    withoutProduct: `Product showcase with bold abstract art elements. The product as focal point surrounded by expressive shapes and artistic textures in {colors}. Creative advertising visual. Gallery-worthy aesthetic meets commercial photography. No text. High contrast, visually striking.`,
  },
  lifestyle: {
    withProduct: `Lifestyle scene background for product integration. {scene_context}. Natural lighting, warm and inviting atmosphere. Colors complementing {colors}. Shallow depth of field with blurred background. Clear foreground space for product. Authentic, aspirational mood.`,
    withoutProduct: `Product in lifestyle context. The product naturally integrated into {scene_context}. Natural lighting, aspirational feel. Color palette incorporating {colors}. Shows the product in use or context. Professional lifestyle photography. No text overlays. Instagram-worthy quality.`,
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

  // Check if this is a product-specific ad
  const isProductAd = brandProfile.productName && brandProfile.productDescription;

  const userPrompt = `Create a Flux image generation prompt for:

BRAND: ${brandProfile.companyName}
INDUSTRY: ${brandProfile.industry}
VISUAL STYLE: ${brandProfile.visualStyle}
BRAND PERSONALITY: ${brandProfile.personality?.join(', ') || 'professional, modern'}
COLOR PALETTE: ${colorString}

${isProductAd ? `PRODUCT BEING ADVERTISED:
- Product Name: ${brandProfile.productName}
- Product Description: ${brandProfile.productDescription}
- Key Benefits: ${brandProfile.uniqueSellingPoints?.join(', ') || 'innovative, high-quality'}
- Promotion Angle: ${brandProfile.promotionAngle || 'showcase the product'}

IMPORTANT: This is a product-specific advertisement. The image MUST visually represent or evoke this specific product. For tech products like phones, show the device or tech-inspired visuals. For services, show relevant imagery.` : ''}

AD STYLE: ${style}
${hasProductImage ? 'REQUIREMENT: Must have clear, uncluttered central area for product compositing' : isProductAd ? 'REQUIREMENT: Generate a visual that clearly represents and advertises this specific product. Show the product or product-related imagery.' : 'REQUIREMENT: Complete standalone brand visual'}

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
