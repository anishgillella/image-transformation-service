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
