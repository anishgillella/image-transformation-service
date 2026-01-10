import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load env first
dotenv.config({ path: path.resolve('/Users/anishgillella/Desktop/Stuff/Projects/uplane/.env') });

async function testAllAPIs() {
  console.log('='.repeat(60));
  console.log('API Connection Test');
  console.log('='.repeat(60));
  console.log('\nEnvironment Variables Loaded:');
  console.log('-'.repeat(40));

  const envVars = [
    'OPENROUTER_API_KEY',
    'BFL_API_KEY',
    'REMOVE_BG_API_KEY',
    'PARALLEL_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  for (const key of envVars) {
    const value = process.env[key];
    if (value) {
      console.log(`✓ ${key}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`);
    } else {
      console.log(`✗ ${key}: NOT SET`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Testing API Connections');
  console.log('='.repeat(60));

  // Test 1: OpenRouter (Gemini)
  console.log('\n1. OpenRouter (Gemini 3 Flash Preview)');
  console.log('-'.repeat(40));
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: 'Say "API working" in exactly 2 words' }],
        max_tokens: 10,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✓ OpenRouter/Gemini: WORKING');
    console.log(`  Response: ${response.data.choices[0].message.content}`);
    console.log(`  Tokens: ${response.data.usage?.prompt_tokens || 0} input, ${response.data.usage?.completion_tokens || 0} output`);
  } catch (error: any) {
    console.log('✗ OpenRouter/Gemini: FAILED');
    console.log(`  Error: ${error.response?.data?.error?.message || error.message}`);
  }

  // Test 2: BFL (Flux) - submit a minimal request to verify auth
  console.log('\n2. BFL API (Flux Pro)');
  console.log('-'.repeat(40));
  try {
    // Submit a minimal generation request to verify API key works
    const response = await axios.post(
      'https://api.bfl.ml/v1/flux-pro-1.1',
      {
        prompt: 'test',
        width: 256,
        height: 256,
        steps: 1,
      },
      {
        headers: {
          'X-Key': process.env.BFL_API_KEY,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );
    // 200/201 means request accepted
    // 401/403 means auth failed
    // 402 means payment required (valid key but no credits)
    if (response.status === 200 || response.status === 201) {
      console.log('✓ BFL/Flux: WORKING');
      console.log(`  Task ID: ${response.data.id}`);
    } else if (response.status === 401 || response.status === 403) {
      console.log('✗ BFL/Flux: AUTH FAILED');
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.data)}`);
    } else if (response.status === 402) {
      console.log('⚠ BFL/Flux: NO CREDITS (auth valid)');
      console.log(`  Response: ${JSON.stringify(response.data)}`);
    } else {
      console.log(`? BFL/Flux: Status ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error: any) {
    console.log('✗ BFL/Flux: FAILED');
    console.log(`  Error: ${error.message}`);
  }

  // Test 3: Remove.bg
  console.log('\n3. Remove.bg API');
  console.log('-'.repeat(40));
  try {
    // Check account info endpoint
    const response = await axios.get(
      'https://api.remove.bg/v1.0/account',
      {
        headers: {
          'X-Api-Key': process.env.REMOVE_BG_API_KEY,
        },
        validateStatus: () => true,
      }
    );
    if (response.status === 200) {
      console.log('✓ Remove.bg: WORKING');
      console.log(`  Credits: ${response.data.data?.attributes?.credits?.total || 'N/A'}`);
    } else {
      console.log('✗ Remove.bg: FAILED');
      console.log(`  Status: ${response.status}`);
    }
  } catch (error: any) {
    console.log('✗ Remove.bg: FAILED');
    console.log(`  Error: ${error.message}`);
  }

  // Test 4: Parallel AI (Task API)
  console.log('\n4. Parallel AI (Task API)');
  console.log('-'.repeat(40));
  try {
    // Test with the Task API endpoint
    const response = await axios.post(
      'https://api.parallel.ai/v1/tasks/runs',
      {
        input: 'What is 2+2?',
        task_spec: {
          output_schema: 'A single number'
        },
        processor: 'base'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PARALLEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );
    if (response.status === 200 || response.status === 201 || response.status === 202) {
      console.log('✓ Parallel AI: WORKING');
      console.log(`  Task ID: ${response.data.run_id || response.data.id}`);
      console.log(`  Status: ${response.data.status}`);
    } else if (response.status === 401 || response.status === 403) {
      console.log('✗ Parallel AI: AUTH FAILED');
      console.log(`  Response: ${JSON.stringify(response.data)}`);
    } else {
      console.log(`? Parallel AI: Status ${response.status}`);
      console.log(`  Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error: any) {
    console.log('✗ Parallel AI: FAILED');
    console.log(`  Error: ${error.message}`);
  }

  // Test 5: Cloudinary
  console.log('\n5. Cloudinary');
  console.log('-'.repeat(40));
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.log('✗ Cloudinary: MISSING CREDENTIALS');
    } else {
      // Test with ping endpoint
      const response = await axios.get(
        `https://api.cloudinary.com/v1_1/${cloudName}/ping`,
        {
          auth: {
            username: apiKey,
            password: apiSecret,
          },
          validateStatus: () => true,
        }
      );
      if (response.status === 200) {
        console.log('✓ Cloudinary: WORKING');
        console.log(`  Cloud Name: ${cloudName}`);
      } else {
        console.log('✗ Cloudinary: FAILED');
        console.log(`  Status: ${response.status}`);
      }
    }
  } catch (error: any) {
    console.log('✗ Cloudinary: FAILED');
    console.log(`  Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
}

testAllAPIs();
