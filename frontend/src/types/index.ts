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
  | 'error';

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
  sessionStart: string;
}
