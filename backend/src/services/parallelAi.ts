import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PARALLEL_API_URL = 'https://api.parallel.ai/v1';

interface WebContentResponse {
  content: string;
  title?: string;
  description?: string;
  url: string;
}

/**
 * Extract comprehensive brand and product information from a company website.
 * Parallel AI handles intelligent crawling and content extraction automatically.
 */
export async function extractBrandContent(url: string): Promise<WebContentResponse> {
  const response = await axios.post(
    `${PARALLEL_API_URL}/extract`,
    {
      url,
      include_metadata: true,
      // Let Parallel AI intelligently extract all relevant brand and product information
      prompt: `Extract comprehensive information about this company for marketing purposes:

COMPANY OVERVIEW:
- Official company name
- Company description and mission
- Industry and market positioning
- Brand voice and communication style
- Visual identity (colors, design language if mentioned)
- Overall target audience

PRODUCTS/SERVICES (extract ALL products or services offered):
For EACH product or service, extract:
- Product/service name
- Detailed description
- Key features and specifications
- Target audience for this specific product
- Benefits and value propositions
- Pricing information if available
- Use cases or applications

MARKETING INTELLIGENCE:
- Unique selling propositions
- Competitive advantages
- Customer testimonials or social proof if available
- Any promotional messaging or campaigns mentioned

Be thorough - extract information about every product and service you can find.`,
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
