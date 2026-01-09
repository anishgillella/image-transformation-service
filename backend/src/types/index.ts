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
