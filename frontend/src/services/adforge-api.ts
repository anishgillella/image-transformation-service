import type { AnalyzeResponse, BrandProfile, AdStyle, GenerateResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Analyze a company URL and get brand profile with products
 */
export async function analyzeCompany(url: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/adforge/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  return response.json();
}

/**
 * Get a stored brand profile
 */
export async function getBrandProfile(profileId: string): Promise<{ success: boolean; brandProfile?: BrandProfile }> {
  const response = await fetch(`${API_URL}/adforge/profile/${profileId}`);
  return response.json();
}

/**
 * Update a brand profile
 */
export async function updateBrandProfile(
  profileId: string,
  updates: Partial<BrandProfile>
): Promise<{ success: boolean; brandProfile?: BrandProfile }> {
  const response = await fetch(`${API_URL}/adforge/profile/${profileId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  return response.json();
}

/**
 * Generate an ad (brand-level or product-specific)
 */
export async function generateAd(options: {
  profileId: string;
  style: AdStyle;
  customInstructions?: string;
  productIndex?: number;
  productImage?: File;
}): Promise<GenerateResponse> {
  const formData = new FormData();
  formData.append('profileId', options.profileId);
  formData.append('style', options.style);

  if (options.customInstructions) {
    formData.append('customInstructions', options.customInstructions);
  }

  if (options.productIndex !== undefined) {
    formData.append('productIndex', options.productIndex.toString());
  }

  if (options.productImage) {
    formData.append('productImage', options.productImage);
  }

  const response = await fetch(`${API_URL}/adforge/generate`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

/**
 * Regenerate copy for an existing ad
 */
export async function regenerateAdCopy(adId: string): Promise<GenerateResponse> {
  const response = await fetch(`${API_URL}/adforge/${adId}/regenerate-copy`, {
    method: 'POST',
  });

  return response.json();
}

/**
 * Get all generated ads
 */
export async function getAds(): Promise<{ success: boolean; ads: any[] }> {
  const response = await fetch(`${API_URL}/adforge/ads`);
  return response.json();
}

/**
 * Delete an ad
 */
export async function deleteAd(adId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/adforge/ads/${adId}`, {
    method: 'DELETE',
  });

  return response.json();
}
