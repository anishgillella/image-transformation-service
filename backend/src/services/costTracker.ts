import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('/Users/anishgillella/Desktop/Stuff/Projects/uplane/.env') });

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

export interface CostEntry {
  id: string;
  timestamp: Date;
  model: ModelId;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  imageCount?: number;
  requestCount?: number;
  cost: number;
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
  entries: CostEntry[];
  sessionStart: Date;
}

class CostTracker {
  private entries: CostEntry[] = [];
  private sessionStart: Date = new Date();

  /**
   * Track token-based model usage (LLMs)
   */
  trackTokenUsage(
    model: 'gemini-3-flash',
    operation: string,
    usage: TokenUsage,
    metadata?: Record<string, any>
  ): CostEntry {
    const pricing = MODEL_PRICING[model];
    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const entry: CostEntry = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      model,
      operation,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      cost: totalCost,
      metadata,
    };

    this.entries.push(entry);
    console.log(`[Cost] ${pricing.displayName} - ${operation}: $${totalCost.toFixed(6)} (${usage.promptTokens}+${usage.completionTokens} tokens)`);
    return entry;
  }

  /**
   * Track image generation costs (Flux, Remove.bg)
   */
  trackImageGeneration(
    model: 'flux-pro-1.1' | 'flux-pro-fill' | 'remove-bg' | 'cloudinary',
    operation: string,
    imageCount: number = 1,
    metadata?: Record<string, any>
  ): CostEntry {
    const pricing = MODEL_PRICING[model];
    const perImageCost = 'perImage' in pricing ? pricing.perImage : ('perUpload' in pricing ? pricing.perUpload : 0);
    const totalCost = perImageCost * imageCount;

    const entry: CostEntry = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      model,
      operation,
      imageCount,
      cost: totalCost,
      metadata,
    };

    this.entries.push(entry);
    console.log(`[Cost] ${pricing.displayName} - ${operation}: $${totalCost.toFixed(4)} (${imageCount} image(s))`);
    return entry;
  }

  /**
   * Track API request costs (Parallel AI)
   */
  trackApiRequest(
    model: 'parallel-ai',
    operation: string,
    requestCount: number = 1,
    metadata?: Record<string, any>
  ): CostEntry {
    const pricing = MODEL_PRICING[model];
    const totalCost = pricing.perRequest * requestCount;

    const entry: CostEntry = {
      id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      model,
      operation,
      requestCount,
      cost: totalCost,
      metadata,
    };

    this.entries.push(entry);
    console.log(`[Cost] ${pricing.displayName} - ${operation}: $${totalCost.toFixed(4)} (${requestCount} request(s))`);
    return entry;
  }

  /**
   * Get summary of all costs
   */
  getSummary(): CostSummary {
    const byModel: CostSummary['byModel'] = {};

    for (const entry of this.entries) {
      if (!byModel[entry.model]) {
        const pricing = MODEL_PRICING[entry.model];
        byModel[entry.model] = {
          displayName: pricing.displayName,
          totalCost: 0,
          count: 0,
        };
      }

      byModel[entry.model].totalCost += entry.cost;
      byModel[entry.model].count += 1;

      // Track tokens for LLMs
      if (entry.inputTokens !== undefined && entry.outputTokens !== undefined) {
        if (!byModel[entry.model].tokens) {
          byModel[entry.model].tokens = { input: 0, output: 0 };
        }
        byModel[entry.model].tokens!.input += entry.inputTokens;
        byModel[entry.model].tokens!.output += entry.outputTokens;
      }

      // Track images
      if (entry.imageCount !== undefined) {
        if (!byModel[entry.model].images) {
          byModel[entry.model].images = 0;
        }
        byModel[entry.model].images! += entry.imageCount;
      }

      // Track requests
      if (entry.requestCount !== undefined) {
        if (!byModel[entry.model].requests) {
          byModel[entry.model].requests = 0;
        }
        byModel[entry.model].requests! += entry.requestCount;
      }
    }

    const totalCost = this.entries.reduce((sum, entry) => sum + entry.cost, 0);

    return {
      totalCost,
      byModel,
      entries: [...this.entries].reverse(), // Most recent first
      sessionStart: this.sessionStart,
    };
  }

  /**
   * Reset all tracked costs (for new session)
   */
  reset(): void {
    this.entries = [];
    this.sessionStart = new Date();
    console.log('[Cost] Tracker reset');
  }

  /**
   * Get entries for a specific time range
   */
  getEntriesSince(since: Date): CostEntry[] {
    return this.entries.filter(entry => entry.timestamp >= since);
  }
}

// Export singleton instance
export const costTracker = new CostTracker();
