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
