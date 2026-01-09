import sharp from 'sharp';

/**
 * Flip an image horizontally (mirror effect)
 */
export async function flipHorizontally(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .flop() // flop = horizontal flip
    .png()  // ensure output is PNG (preserves transparency)
    .toBuffer();
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageBuffer: Buffer) {
  return sharp(imageBuffer).metadata();
}
