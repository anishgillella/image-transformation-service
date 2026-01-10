export interface ProcessedImage {
  id: string;
  originalName: string;
  url: string;
  publicId: string;
  createdAt: Date;
}

export interface UploadResponse {
  success: boolean;
  image?: ProcessedImage;
  error?: string;
}

export interface ImageListResponse {
  success: boolean;
  images: ProcessedImage[];
}

// AdForge types

// Individual product/service within a company
export interface Product {
  name: string;
  description: string;
  features: string[];
  targetAudience: string;
  promotionAngle: string; // How to best promote this product
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
  targetAudience: string; // Overall brand target audience
  voiceTone: string;
  visualStyle: string;
  industry: string;
  uniqueSellingPoints: string[];
  products: Product[]; // All products/services offered
  analyzedAt: Date;
}

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export type AdStyle = 'minimal' | 'gradient' | 'abstract' | 'lifestyle';

export interface GeneratedAd {
  id: string;
  brandProfile: BrandProfile;
  style: AdStyle;
  customInstructions?: string;
  imageUrl: string;
  copy: AdCopy;
  hasProductImage: boolean;
  productImageUrl?: string;
  productName?: string; // The product this ad is for (undefined = overall brand)
  createdAt: Date;
}

export interface AnalyzeRequest {
  url: string;
}

export interface GenerateRequest {
  brandProfile: BrandProfile;
  style: AdStyle;
  customInstructions?: string;
  productImage?: string;
}

// Copy variations types
export interface CopyVariation {
  headline: string;
  body: string;
  cta: string;
}

export interface CopyVariations {
  headlines: string[];
  bodies: string[];
  ctas: string[];
  hashtags: string[];
}

export interface GeneratedAdWithVariations extends GeneratedAd {
  copyVariations?: CopyVariations;
}

// Export formats
export type ExportPlatform =
  | 'instagram-feed'      // 1080x1080
  | 'instagram-story'     // 1080x1920
  | 'facebook-feed'       // 1200x628
  | 'twitter'             // 1200x675
  | 'linkedin'            // 1200x627
  | 'pinterest'           // 1000x1500
  | 'tiktok';             // 1080x1920

export interface ExportDimensions {
  width: number;
  height: number;
  name: string;
}

export const PLATFORM_DIMENSIONS: Record<ExportPlatform, ExportDimensions> = {
  'instagram-feed': { width: 1080, height: 1080, name: 'Instagram Feed' },
  'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story' },
  'facebook-feed': { width: 1200, height: 628, name: 'Facebook Feed' },
  'twitter': { width: 1200, height: 675, name: 'Twitter/X' },
  'linkedin': { width: 1200, height: 627, name: 'LinkedIn' },
  'pinterest': { width: 1000, height: 1500, name: 'Pinterest' },
  'tiktok': { width: 1080, height: 1920, name: 'TikTok' },
};

// Brand asset library types
export interface BrandAsset {
  id: string;
  profileId: string;
  type: 'logo' | 'image' | 'font';
  name: string;
  url: string;
  publicId: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    fontFamily?: string;
  };
  createdAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}
