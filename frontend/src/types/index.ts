// Image Transformer types
export interface ProcessedImage {
  id: string;
  originalName: string;
  url: string;
  publicId: string;
  createdAt: string;
}

export interface UploadResponse {
  success: boolean;
  image?: ProcessedImage;
  error?: string;
}

export type AppState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

// AdForge types
export interface Product {
  name: string;
  description: string;
  features: string[];
  targetAudience: string;
  promotionAngle: string;
  keyBenefits: string[];
}

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
  products: Product[];
  analyzedAt: string;
}

export interface AnalyzeResponse {
  success: boolean;
  profileId?: string;
  brandProfile?: BrandProfile;
  error?: string;
}

export type AdStyle = 'minimal' | 'gradient' | 'abstract' | 'lifestyle';

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface GeneratedAd {
  id: string;
  brandProfile: BrandProfile;
  style: AdStyle;
  imageUrl: string;
  copy: AdCopy;
  hasProductImage: boolean;
  productName?: string; // The product this ad is for (undefined = overall brand)
  createdAt: string;
}

export interface GenerateResponse {
  success: boolean;
  ad?: GeneratedAd;
  selectedProduct?: {
    name: string;
    index: number;
  } | null;
  error?: string;
}

export type AdForgeState =
  | 'idle'
  | 'analyzing'
  | 'profile-ready'
  | 'configuring'
  | 'generating'
  | 'complete'
  | 'batch-complete'
  | 'error';

// Copy variations types
export interface CopyVariations {
  headlines: string[];
  bodies: string[];
  ctas: string[];
  hashtags: string[];
}

// Export formats
export type ExportPlatform =
  | 'instagram-feed'
  | 'instagram-story'
  | 'facebook-feed'
  | 'twitter'
  | 'linkedin'
  | 'pinterest'
  | 'tiktok';

export interface PlatformInfo {
  id: ExportPlatform;
  name: string;
  width: number;
  height: number;
}

export interface ExportResult {
  platform: ExportPlatform;
  platformName: string;
  width: number;
  height: number;
  format: 'png' | 'jpg';
  url: string;
}

export interface ExportAllResult {
  [platform: string]: {
    url: string;
    width: number;
    height: number;
    platformName: string;
  };
}

// Brand asset library types
export interface BrandAsset {
  id: string;
  profileId: string;
  type: 'logo' | 'image';
  name: string;
  url: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
  };
  createdAt: string;
}

export interface BrandAssetLibrary {
  profileId: string;
  assets: BrandAsset[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    custom: string[];
  };
}

// Campaign types
export type CampaignStatus = 'DRAFT' | 'GENERATING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  targetPlatforms: ExportPlatform[];
  style?: AdStyle;
  customInstructions?: string;
  brandProfileId: string;
  brandProfile?: {
    id: string;
    companyName: string;
    primaryColor?: string;
    colors?: {
      primary: string;
      secondary: string;
      accent: string;
    };
    products?: Array<{
      name: string;
      description: string;
      keyBenefits?: string[];
    }>;
  };
  ads?: GeneratedAd[];
  adCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignCreateInput {
  name: string;
  description?: string;
  brandProfileId: string;
  targetPlatforms: ExportPlatform[];
  style?: AdStyle;
  customInstructions?: string;
  selectedProducts?: number[];
  includeBrandAd?: boolean;
}

export interface CampaignUpdateInput {
  name?: string;
  description?: string;
  targetPlatforms?: ExportPlatform[];
  style?: AdStyle;
  customInstructions?: string;
  status?: CampaignStatus;
  selectedProducts?: number[];
  includeBrandAd?: boolean;
}

// Cost tracking types
export interface CostEntry {
  id: string;
  timestamp: string;
  model: string;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  imageCount?: number;
  requestCount?: number;
  cost: number;
  metadata?: Record<string, unknown>;
}

export interface ModelCostSummary {
  displayName: string;
  totalCost: number;
  count: number;
  tokens?: { input: number; output: number };
  images?: number;
  requests?: number;
}

export interface CostSummary {
  success: boolean;
  totalCost: number;
  byModel: Record<string, ModelCostSummary>;
  entries: CostEntry[];
  periodStart: string;
}
