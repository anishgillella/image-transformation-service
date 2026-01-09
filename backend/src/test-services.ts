import { extractBrandContent } from './services/parallelAi';
import { analyzeBrand } from './services/gemini';
import { generateImage } from './services/flux';
import dotenv from 'dotenv';

dotenv.config();

async function testServices() {
  console.log('Testing AdForge services...\n');

  // Test 1: Parallel AI
  console.log('1. Testing Parallel AI...');
  try {
    const content = await extractBrandContent('https://stripe.com');
    console.log('✓ Parallel AI working. Content length:', content.content.length);
    console.log('  Title:', content.title);
  } catch (error) {
    console.log('✗ Parallel AI failed:', error instanceof Error ? error.message : error);
  }

  // Test 2: Gemini
  console.log('\n2. Testing Gemini...');
  try {
    const analysis = await analyzeBrand(
      'Stripe is a financial infrastructure platform for businesses. We help companies accept payments, grow their revenue, and accelerate new business opportunities.',
      'https://stripe.com'
    );
    console.log('✓ Gemini working. Analysis:', analysis.substring(0, 200) + '...');
  } catch (error) {
    console.log('✗ Gemini failed:', error instanceof Error ? error.message : error);
  }

  // Test 3: Flux
  console.log('\n3. Testing Flux...');
  try {
    const image = await generateImage({
      prompt: 'A minimal, modern gradient background in purple and blue tones, suitable for tech advertising',
      width: 512,
      height: 512,
    });
    console.log('✓ Flux working. Image size:', image.length, 'bytes');
  } catch (error) {
    console.log('✗ Flux failed:', error instanceof Error ? error.message : error);
  }

  console.log('\nAll tests complete!');
}

testServices();
