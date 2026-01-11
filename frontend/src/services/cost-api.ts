import type { CostSummary } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get cost summary (from database)
 */
export async function getCosts(since?: Date): Promise<CostSummary> {
  const url = since
    ? `${API_URL}/costs?since=${since.toISOString()}`
    : `${API_URL}/costs`;
  const response = await fetch(url);
  return response.json();
}

/**
 * Get monthly usage breakdown
 */
export async function getMonthlyUsage(): Promise<{
  success: boolean;
  monthly: { month: string; total: number; byService: Record<string, number> }[];
  totalSpending: number;
}> {
  const response = await fetch(`${API_URL}/costs/monthly`);
  return response.json();
}

/**
 * Get costs for a specific campaign
 */
export async function getCampaignCosts(campaignId: string): Promise<{
  success: boolean;
  total: number;
  adCount: number;
  avgPerAd: number;
  ads: {
    id: string;
    productName: string;
    cost: number;
    breakdown: {
      imageGeneration: number;
      copyGeneration: number;
      backgroundRemoval: number;
      upload: number;
      total: number;
    } | null;
  }[];
}> {
  const response = await fetch(`${API_URL}/costs/campaign/${campaignId}`);
  return response.json();
}

/**
 * Get costs for a specific ad
 */
export async function getAdCosts(adId: string): Promise<{
  success: boolean;
  total: number;
  breakdown: {
    imageGeneration: number;
    copyGeneration: number;
    backgroundRemoval: number;
    upload: number;
    total: number;
  } | null;
  entries: any[];
}> {
  const response = await fetch(`${API_URL}/costs/ad/${adId}`);
  return response.json();
}

/**
 * Get costs for all campaigns
 */
export async function getAllCampaignCosts(): Promise<{
  success: boolean;
  campaigns: {
    id: string;
    name: string;
    total: number;
    adCount: number;
    avgPerAd: number;
    createdAt: string;
  }[];
  totalAcrossCampaigns: number;
}> {
  const response = await fetch(`${API_URL}/costs/campaigns`);
  return response.json();
}
