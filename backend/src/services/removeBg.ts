import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

/**
 * Remove background from an image using Remove.bg API
 * Returns a PNG buffer with transparent background
 */
export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData();
  formData.append('image_file', imageBuffer, {
    filename: 'image.png',
    contentType: 'image/png',
  });
  formData.append('size', 'auto');

  const response = await axios.post(REMOVE_BG_API_URL, formData, {
    headers: {
      ...formData.getHeaders(),
      'X-Api-Key': process.env.REMOVE_BG_API_KEY,
    },
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data);
}
