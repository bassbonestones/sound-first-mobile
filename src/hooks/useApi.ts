/**
 * useApi - React hook for API calls with automatic state management
 *
 * Wraps the api client with loading/error state and provides
 * convenience methods for common operations.
 *
 * @example
 * const { get, post, loading, error, data } = useApi();
 *
 * // Simple GET
 * await get('/materials');
 *
 * // POST with body
 * await post('/sessions', { focus_card_id: 1 });
 */

import { useState, useCallback } from "react";
import { devError } from "../utils/devLogger";
import { api, baseUrl } from "../api/client";

export interface UseApiOptions {
  autoReset?: boolean;
}

export interface UseApiReturn<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  get: <R = T>(endpoint: string) => Promise<R | null>;
  post: <R = T>(endpoint: string, body?: unknown) => Promise<R | null>;
  put: <R = T>(endpoint: string, body?: unknown) => Promise<R | null>;
  del: <R = T>(endpoint: string) => Promise<R | null>;
  reset: () => void;
  baseUrl: string;
}

/**
 * Hook for making API calls with automatic state management
 * @param options - Configuration options
 * @returns API state and methods
 */
export function useApi<T = unknown>({
  autoReset = true,
}: UseApiOptions = {}): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  /**
   * Execute an API request with state management
   */
  const executeRequest = useCallback(
    async <R>(requestFn: () => Promise<R>): Promise<R | null> => {
      if (autoReset) {
        setError(null);
      }
      setLoading(true);
      try {
        const result = await requestFn();
        setData(result as unknown as T);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        devError("[useApi] Request failed:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [autoReset],
  );

  /**
   * GET request
   */
  const get = useCallback(
    <R = T>(endpoint: string): Promise<R | null> => {
      return executeRequest<R>(() => api.get(endpoint));
    },
    [executeRequest],
  );

  /**
   * POST request
   */
  const post = useCallback(
    <R = T>(endpoint: string, body?: unknown): Promise<R | null> => {
      return executeRequest<R>(() => api.post(endpoint, body));
    },
    [executeRequest],
  );

  /**
   * PUT request
   */
  const put = useCallback(
    <R = T>(endpoint: string, body?: unknown): Promise<R | null> => {
      return executeRequest<R>(() => api.put(endpoint, body));
    },
    [executeRequest],
  );

  /**
   * DELETE request
   */
  const del = useCallback(
    <R = T>(endpoint: string): Promise<R | null> => {
      return executeRequest<R>(() => api.delete(endpoint));
    },
    [executeRequest],
  );

  return {
    data,
    loading,
    error,
    get,
    post,
    put,
    del,
    reset,
    baseUrl,
  };
}

export default useApi;
