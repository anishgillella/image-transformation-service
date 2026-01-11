// Cost tracking service with database persistence
import { prisma } from './database';

// Pricing per 1K tokens/units (in USD)
export const MODEL_PRICING = {
  // Gemini 3 Flash Preview via OpenRouter
  'gemini-3-flash': {
    input: 0.0005,  // $0.50 per 1M tokens
    output: 0.003,  // $3.00 per 1M tokens
    displayName: 'Gemini 3 Flash',
  },
  // Flux Pro 1.1 (per image generation)
  'flux-pro-1.1': {
    perImage: 0.04,  // $0.04 per image
    displayName: 'Flux Pro 1.1',
  },
  // Flux Pro Fill (per image)
  'flux-pro-fill': {
    perImage: 0.05,  // $0.05 per image
    displayName: 'Flux Pro Fill',
  },
  // Remove.bg (per image)
  'remove-bg': {
    perImage: 0.20,  // $0.20 per image (25 credits free, then pay)
    displayName: 'Remove.bg',
  },
  // Parallel AI (per request - estimated)
  'parallel-ai': {
    perRequest: 0.01, // $0.01 per request (estimate)
    displayName: 'Parallel AI',
  },
  // Cloudinary (free tier, but tracking for reference)
  'cloudinary': {
    perUpload: 0.0, // Free tier
    displayName: 'Cloudinary',
  },
} as const;

export type ModelId = keyof typeof MODEL_PRICING;

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface CostEntryData {
  id: string;
  timestamp: Date;
  model: ModelId;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  imageCount?: number;
  requestCount?: number;
  cost: number;
  adId?: string;
  metadata?: Record<string, any>;
}

export interface CostSummary {
  totalCost: number;
  byModel: Record<string, {
    displayName: string;
    totalCost: number;
    count: number;
    tokens?: { input: number; output: number };
    images?: number;
    requests?: number;
  }>;
  entries: CostEntryData[];
  periodStart: Date;
}

export interface AdCostBreakdown {
  imageGeneration: number;
  copyGeneration: number;
  backgroundRemoval: number;
  upload: number;
  total: number;
}

class CostTracker {
  /**
   * Track token-based model usage (LLMs) and persist to database
   */
  async trackTokenUsage(
    model: 'gemini-3-flash',
    operation: string,
    usage: TokenUsage,
    adId?: string,
    metadata?: Record<string, any>
  ): Promise<CostEntryData> {
    const pricing = MODEL_PRICING[model];
    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const details = JSON.stringify({
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      ...metadata,
    });

    // Persist to database
    const dbEntry = await prisma.costEntry.create({
      data: {
        service: model,
        operation,
        cost: totalCost,
        details,
        adId,
      },
    });

    console.log(`[Cost] ${pricing.displayName} - ${operation}: $${totalCost.toFixed(6)} (${usage.promptTokens}+${usage.completionTokens} tokens)`);

    return {
      id: dbEntry.id,
      timestamp: dbEntry.createdAt,
      model,
      operation,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      cost: totalCost,
      adId: adId || undefined,
      metadata,
    };
  }

  /**
   * Track image generation costs (Flux, Remove.bg) and persist to database
   */
  async trackImageGeneration(
    model: 'flux-pro-1.1' | 'flux-pro-fill' | 'remove-bg' | 'cloudinary',
    operation: string,
    imageCount: number = 1,
    adId?: string,
    metadata?: Record<string, any>
  ): Promise<CostEntryData> {
    const pricing = MODEL_PRICING[model];
    const perImageCost = 'perImage' in pricing ? pricing.perImage : ('perUpload' in pricing ? pricing.perUpload : 0);
    const totalCost = perImageCost * imageCount;

    const details = JSON.stringify({
      imageCount,
      ...metadata,
    });

    // Persist to database
    const dbEntry = await prisma.costEntry.create({
      data: {
        service: model,
        operation,
        cost: totalCost,
        details,
        adId,
      },
    });

    console.log(`[Cost] ${pricing.displayName} - ${operation}: $${totalCost.toFixed(4)} (${imageCount} image(s))`);

    return {
      id: dbEntry.id,
      timestamp: dbEntry.createdAt,
      model,
      operation,
      imageCount,
      cost: totalCost,
      adId: adId || undefined,
      metadata,
    };
  }

  /**
   * Track API request costs (Parallel AI) and persist to database
   */
  async trackApiRequest(
    model: 'parallel-ai',
    operation: string,
    requestCount: number = 1,
    adId?: string,
    metadata?: Record<string, any>
  ): Promise<CostEntryData> {
    const pricing = MODEL_PRICING[model];
    const totalCost = pricing.perRequest * requestCount;

    const details = JSON.stringify({
      requestCount,
      ...metadata,
    });

    // Persist to database
    const dbEntry = await prisma.costEntry.create({
      data: {
        service: model,
        operation,
        cost: totalCost,
        details,
        adId,
      },
    });

    console.log(`[Cost] ${pricing.displayName} - ${operation}: $${totalCost.toFixed(4)} (${requestCount} request(s))`);

    return {
      id: dbEntry.id,
      timestamp: dbEntry.createdAt,
      model,
      operation,
      requestCount,
      cost: totalCost,
      adId: adId || undefined,
      metadata,
    };
  }

  /**
   * Update an ad with its total generation cost and breakdown
   */
  async updateAdCosts(adId: string, breakdown: AdCostBreakdown): Promise<void> {
    await prisma.ad.update({
      where: { id: adId },
      data: {
        generationCost: breakdown.total,
        costBreakdown: JSON.stringify(breakdown),
      },
    });
    console.log(`[Cost] Updated ad ${adId} with total cost: $${breakdown.total.toFixed(4)}`);
  }

  /**
   * Get cost summary for a specific ad
   */
  async getAdCosts(adId: string): Promise<{ total: number; breakdown: AdCostBreakdown | null; entries: any[] }> {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: { costs: true },
    });

    if (!ad) {
      return { total: 0, breakdown: null, entries: [] };
    }

    return {
      total: ad.generationCost || 0,
      breakdown: ad.costBreakdown ? JSON.parse(ad.costBreakdown) : null,
      entries: ad.costs,
    };
  }

  /**
   * Get cost summary for a campaign (aggregates all ads)
   */
  async getCampaignCosts(campaignId: string): Promise<{ total: number; adCount: number; avgPerAd: number; ads: any[] }> {
    const ads = await prisma.ad.findMany({
      where: { campaignId },
      select: {
        id: true,
        productName: true,
        generationCost: true,
        costBreakdown: true,
      },
    });

    const total = ads.reduce((sum: number, ad: any) => sum + (ad.generationCost || 0), 0);
    const adCount = ads.length;
    const avgPerAd = adCount > 0 ? total / adCount : 0;

    return {
      total,
      adCount,
      avgPerAd,
      ads: ads.map((ad: any) => ({
        id: ad.id,
        productName: ad.productName || 'Brand Ad',
        cost: ad.generationCost || 0,
        breakdown: ad.costBreakdown ? JSON.parse(ad.costBreakdown) : null,
      })),
    };
  }

  /**
   * Get summary of all costs from database
   */
  async getSummary(since?: Date): Promise<CostSummary> {
    const whereClause = since ? { createdAt: { gte: since } } : {};

    const entries = await prisma.costEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 entries
    });

    const byModel: CostSummary['byModel'] = {};

    for (const entry of entries) {
      const model = entry.service as ModelId;
      if (!byModel[model]) {
        const pricing = MODEL_PRICING[model];
        byModel[model] = {
          displayName: pricing?.displayName || model,
          totalCost: 0,
          count: 0,
        };
      }

      byModel[model].totalCost += entry.cost;
      byModel[model].count += 1;

      // Parse details for additional info
      if (entry.details) {
        try {
          const details = JSON.parse(entry.details);

          // Track tokens for LLMs
          if (details.inputTokens !== undefined && details.outputTokens !== undefined) {
            if (!byModel[model].tokens) {
              byModel[model].tokens = { input: 0, output: 0 };
            }
            byModel[model].tokens!.input += details.inputTokens;
            byModel[model].tokens!.output += details.outputTokens;
          }

          // Track images
          if (details.imageCount !== undefined) {
            if (!byModel[model].images) {
              byModel[model].images = 0;
            }
            byModel[model].images! += details.imageCount;
          }

          // Track requests
          if (details.requestCount !== undefined) {
            if (!byModel[model].requests) {
              byModel[model].requests = 0;
            }
            byModel[model].requests! += details.requestCount;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    const totalCost = entries.reduce((sum: number, entry: any) => sum + entry.cost, 0);

    return {
      totalCost,
      byModel,
      entries: entries.map((e: any) => ({
        id: e.id,
        timestamp: e.createdAt,
        model: e.service as ModelId,
        operation: e.operation,
        cost: e.cost,
        adId: e.adId || undefined,
      })),
      periodStart: since || new Date(0),
    };
  }

  /**
   * Get monthly usage summary
   */
  async getMonthlyUsage(): Promise<{ month: string; total: number; byService: Record<string, number> }[]> {
    const entries = await prisma.costEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Group by month
    const byMonth: Record<string, { total: number; byService: Record<string, number> }> = {};

    for (const entry of entries) {
      const monthKey = entry.createdAt.toISOString().slice(0, 7); // YYYY-MM

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { total: 0, byService: {} };
      }

      byMonth[monthKey].total += entry.cost;
      byMonth[monthKey].byService[entry.service] =
        (byMonth[monthKey].byService[entry.service] || 0) + entry.cost;
    }

    return Object.entries(byMonth).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  /**
   * Get total spending
   */
  async getTotalSpending(): Promise<number> {
    const result = await prisma.costEntry.aggregate({
      _sum: { cost: true },
    });
    return result._sum.cost || 0;
  }
}

// Export singleton instance
export const costTracker = new CostTracker();
