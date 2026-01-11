const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface WarmupState {
  isWarming: boolean;
  isReady: boolean;
  error: string | null;
}

type WarmupListener = (state: WarmupState) => void;

class BackendWarmupService {
  private state: WarmupState = {
    isWarming: false,
    isReady: false,
    error: null,
  };

  private listeners: Set<WarmupListener> = new Set();
  private checkPromise: Promise<boolean> | null = null;
  private lastCheckTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  subscribe(listener: WarmupListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private setState(updates: Partial<WarmupState>) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  async checkHealth(): Promise<boolean> {
    // If we've recently checked and backend is ready, skip
    const now = Date.now();
    if (this.state.isReady && (now - this.lastCheckTime) < this.CACHE_DURATION) {
      return true;
    }

    // If already checking, return the existing promise
    if (this.checkPromise) {
      return this.checkPromise;
    }

    this.checkPromise = this.performHealthCheck();
    const result = await this.checkPromise;
    this.checkPromise = null;
    return result;
  }

  private async performHealthCheck(): Promise<boolean> {
    this.setState({ isWarming: true, error: null });

    const maxAttempts = 20; // Try for up to ~60 seconds
    const retryDelay = 3000; // 3 seconds between retries

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          this.lastCheckTime = Date.now();
          this.setState({ isWarming: false, isReady: true });
          return true;
        }
      } catch (error) {
        // Server is likely waking up, continue retrying
        console.log(`Backend warmup attempt ${attempt}/${maxAttempts}...`);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    this.setState({
      isWarming: false,
      isReady: false,
      error: 'Unable to connect to server. Please try again later.',
    });
    return false;
  }

  /**
   * Wrap an API call with automatic warmup detection
   * Shows the warmup loader if the backend needs to wake up
   */
  async withWarmup<T>(apiCall: () => Promise<T>): Promise<T> {
    // First, ensure backend is ready
    const isReady = await this.checkHealth();

    if (!isReady) {
      throw new Error('Backend is not available');
    }

    // Now make the actual API call
    return apiCall();
  }

  getState(): WarmupState {
    return { ...this.state };
  }

  // Reset state (useful for testing or forcing re-check)
  reset() {
    this.state = { isWarming: false, isReady: false, error: null };
    this.lastCheckTime = 0;
    this.checkPromise = null;
    this.notify();
  }
}

// Singleton instance
export const backendWarmup = new BackendWarmupService();
