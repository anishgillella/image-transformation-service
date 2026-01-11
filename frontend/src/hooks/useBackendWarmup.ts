import { useState, useEffect, useCallback } from 'react';
import { backendWarmup } from '../services/backend-warmup';

interface UseBackendWarmupReturn {
  isWarming: boolean;
  isReady: boolean;
  error: string | null;
  checkHealth: () => Promise<boolean>;
  withWarmup: <T>(apiCall: () => Promise<T>) => Promise<T>;
}

export function useBackendWarmup(): UseBackendWarmupReturn {
  const [state, setState] = useState(backendWarmup.getState());

  useEffect(() => {
    const unsubscribe = backendWarmup.subscribe(setState);
    return unsubscribe;
  }, []);

  const checkHealth = useCallback(() => backendWarmup.checkHealth(), []);
  const withWarmup = useCallback(
    <T,>(apiCall: () => Promise<T>) => backendWarmup.withWarmup(apiCall),
    []
  );

  return {
    ...state,
    checkHealth,
    withWarmup,
  };
}
