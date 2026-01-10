import type {
  Campaign,
  CampaignCreateInput,
  CampaignUpdateInput,
  PlatformInfo,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Fetch all campaigns
 */
export async function getCampaigns(): Promise<{ success: boolean; campaigns: Campaign[]; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns`);
  return response.json();
}

/**
 * Fetch a single campaign with all ads
 */
export async function getCampaign(id: string): Promise<{ success: boolean; campaign?: Campaign; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns/${id}`);
  return response.json();
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  input: CampaignCreateInput
): Promise<{ success: boolean; campaign?: Campaign; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return response.json();
}

/**
 * Update a campaign
 */
export async function updateCampaign(
  id: string,
  input: CampaignUpdateInput
): Promise<{ success: boolean; campaign?: Campaign; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return response.json();
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

/**
 * Generate ads for all platforms in a campaign
 */
export async function generateCampaignAds(
  id: string
): Promise<{ success: boolean; message?: string; campaignId?: string; platforms?: PlatformInfo[]; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns/${id}/generate`, {
    method: 'POST',
  });
  return response.json();
}

/**
 * Add an existing ad to a campaign
 */
export async function addAdToCampaign(
  campaignId: string,
  adId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns/${campaignId}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adId }),
  });
  return response.json();
}

/**
 * Remove an ad from a campaign
 */
export async function removeAdFromCampaign(
  campaignId: string,
  adId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns/${campaignId}/ads/${adId}`, {
    method: 'DELETE',
  });
  return response.json();
}

/**
 * Get available platforms for campaigns
 */
export async function getCampaignPlatforms(): Promise<{ success: boolean; platforms: PlatformInfo[]; error?: string }> {
  const response = await fetch(`${API_URL}/campaigns/platforms/list`);
  return response.json();
}
