import type { CostSummary } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get cost summary for the current session
 */
export async function getCosts(): Promise<CostSummary> {
  const response = await fetch(`${API_URL}/costs`);
  return response.json();
}

/**
 * Reset cost tracking
 */
export async function resetCosts(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/costs/reset`, {
    method: 'POST',
  });
  return response.json();
}
