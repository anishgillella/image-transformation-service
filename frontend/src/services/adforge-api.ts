import type {
  AnalyzeResponse,
  BrandProfile,
  AdStyle,
  GenerateResponse,
  CopyVariations,
  ExportPlatform,
  ExportResult,
  ExportAllResult,
  PlatformInfo,
  BrandAsset,
  BrandAssetLibrary,
} from '../types';

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

// ============================================================
// COPY VARIATIONS API
// ============================================================

/**
 * Generate copy variations for an ad
 */
export async function generateCopyVariations(
  adId: string
): Promise<{ success: boolean; variations?: CopyVariations; error?: string }> {
  const response = await fetch(`${API_URL}/adforge/${adId}/generate-variations`, {
    method: 'POST',
  });

  return response.json();
}

/**
 * Get stored copy variations for an ad
 */
export async function getCopyVariations(
  adId: string
): Promise<{ success: boolean; variations?: CopyVariations; error?: string }> {
  const response = await fetch(`${API_URL}/adforge/${adId}/variations`);
  return response.json();
}

/**
 * Select specific copy from variations
 */
export async function selectCopy(
  adId: string,
  selection: { headline?: string; body?: string; cta?: string; hashtags?: string[] }
): Promise<{ success: boolean; ad?: any; error?: string }> {
  const response = await fetch(`${API_URL}/adforge/${adId}/select-copy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(selection),
  });

  return response.json();
}

// ============================================================
// EXPORT TO FORMATS API
// ============================================================

/**
 * Get available export platforms
 */
export async function getExportPlatforms(): Promise<{
  success: boolean;
  platforms?: PlatformInfo[];
}> {
  const response = await fetch(`${API_URL}/adforge/platforms`);
  return response.json();
}

/**
 * Export ad to a specific platform format
 */
export async function exportAd(
  adId: string,
  platform: ExportPlatform,
  format: 'png' | 'jpg' = 'png'
): Promise<{ success: boolean; export?: ExportResult; error?: string }> {
  const response = await fetch(`${API_URL}/adforge/${adId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, format }),
  });

  return response.json();
}

/**
 * Export ad to all platform formats
 */
export async function exportAdToAllPlatforms(
  adId: string,
  format: 'png' | 'jpg' = 'png'
): Promise<{ success: boolean; exports?: ExportAllResult; format?: string; error?: string }> {
  const response = await fetch(`${API_URL}/adforge/${adId}/export-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });

  return response.json();
}

// ============================================================
// BRAND ASSET LIBRARY API
// ============================================================

/**
 * Upload a brand asset
 */
export async function uploadBrandAsset(
  profileId: string,
  file: File,
  type: 'logo' | 'image',
  name?: string
): Promise<{ success: boolean; asset?: BrandAsset; error?: string }> {
  const formData = new FormData();
  formData.append('asset', file);
  formData.append('type', type);
  if (name) formData.append('name', name);

  const response = await fetch(`${API_URL}/adforge/assets/${profileId}`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

/**
 * Get brand asset library
 */
export async function getBrandAssets(
  profileId: string
): Promise<{ success: boolean; library?: BrandAssetLibrary; error?: string }> {
  const response = await fetch(`${API_URL}/adforge/assets/${profileId}`);
  return response.json();
}

/**
 * Update brand colors
 */
export async function updateBrandColors(
  profileId: string,
  colors: { primary?: string; secondary?: string; accent?: string; custom?: string[] }
): Promise<{ success: boolean; library?: BrandAssetLibrary; error?: string }> {
  const response = await fetch(`${API_URL}/adforge/assets/${profileId}/colors`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(colors),
  });

  return response.json();
}

/**
 * Delete a brand asset
 */
export async function deleteBrandAsset(
  profileId: string,
  assetId: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/adforge/assets/${profileId}/${assetId}`, {
    method: 'DELETE',
  });

  return response.json();
}
