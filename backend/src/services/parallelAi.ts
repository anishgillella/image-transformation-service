import axios from 'axios';
import { costTracker } from './costTracker';

const PARALLEL_API_URL = 'https://api.parallel.ai/v1';

interface WebContentResponse {
  content: string;
  title?: string;
  description?: string;
  url: string;
}

interface TaskRunResponse {
  run_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  is_active: boolean;
  output?: any;
  error?: string;
}

/**
 * Extract comprehensive brand and product information from a company website.
 * Uses Parallel AI Task API for intelligent web research.
 */
export async function extractBrandContent(url: string): Promise<WebContentResponse> {
  // Create a task run using the Task API
  const createResponse = await axios.post(
    `${PARALLEL_API_URL}/tasks/runs`,
    {
      input: `Research and extract comprehensive brand and product information from this company website: ${url}`,
      task_spec: {
        output_schema: {
          type: 'json',
          json_schema: {
            type: 'object',
            properties: {
              company_name: { type: 'string', description: 'Official company name' },
              description: { type: 'string', description: 'Company description and mission' },
              industry: { type: 'string', description: 'Industry and market positioning' },
              brand_voice: { type: 'string', description: 'Brand voice and communication style' },
              visual_identity: { type: 'string', description: 'Visual identity description' },
              target_audience: { type: 'string', description: 'Overall target audience' },
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    features: { type: 'array', items: { type: 'string' } },
                    target_audience: { type: 'string' },
                    benefits: { type: 'array', items: { type: 'string' } },
                    pricing: { type: 'string' }
                  }
                },
                description: 'All products or services offered'
              },
              unique_selling_points: { type: 'array', items: { type: 'string' } },
              competitive_advantages: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      },
      processor: 'core-fast'
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.PARALLEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const taskId = createResponse.data.run_id;
  console.log(`Parallel AI task created: ${taskId}`);

  // Poll for task completion
  const result = await pollTaskCompletion(taskId);

  // Track cost (no adId, just metadata)
  costTracker.trackApiRequest('parallel-ai', 'web-content-extraction', 1, undefined, { url });

  // Format the output as content string for downstream processing
  const output = result.output;
  const contentString = JSON.stringify(output, null, 2);

  return {
    content: contentString,
    title: output?.company_name,
    description: output?.description,
    url: url,
  };
}

/**
 * Poll for task completion
 */
async function pollTaskCompletion(taskId: string, maxAttempts = 60, intervalMs = 2000): Promise<TaskRunResponse> {
  // 60 attempts * 2 seconds = 120 seconds = 2 minutes minimum
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await axios.get(
      `${PARALLEL_API_URL}/tasks/runs/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PARALLEL_API_KEY}`,
        },
      }
    );

    const task: TaskRunResponse = response.data;
    console.log(`Parallel AI task status: ${task.status} (attempt ${attempt + 1}/${maxAttempts})`);

    if (task.status === 'completed' || !task.is_active) {
      if (task.status === 'failed') {
        throw new Error(`Parallel AI task failed: ${task.error || 'Unknown error'}`);
      }
      console.log(`Parallel AI task completed: ${taskId}`);

      // Fetch the result
      const resultResponse = await axios.get(
        `${PARALLEL_API_URL}/tasks/runs/${taskId}/result`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.PARALLEL_API_KEY}`,
          },
        }
      );

      return { ...task, output: resultResponse.data };
    }

    if (task.status === 'failed') {
      throw new Error(`Parallel AI task failed: ${task.error || 'Unknown error'}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Parallel AI task timed out');
}
