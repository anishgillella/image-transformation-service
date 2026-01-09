import type { ProcessedImage, UploadResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Upload an image for processing
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/images/upload`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

/**
 * Get all processed images
 */
export async function getImages(): Promise<ProcessedImage[]> {
  const response = await fetch(`${API_URL}/images`);
  const data = await response.json();
  return data.images || [];
}

/**
 * Delete an image
 */
export async function deleteImage(id: string): Promise<void> {
  await fetch(`${API_URL}/images/${id}`, {
    method: 'DELETE',
  });
}
