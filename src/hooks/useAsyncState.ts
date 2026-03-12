/**
 * useAsyncState - Generic async operation state management
 *
 * Provides consistent loading/error/data state pattern for async operations.
 *
 * @example
 * const { data, loading, error, execute, reset } = useAsyncState();
 *
 * const fetchData = async () => {
 *   const result = await execute(async () => {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   });
 *   return result;
 * };
 */

import { useState, useCallback } from "react";
import { devError } from "../utils/devLogger";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: <R = T>(asyncFn: () => Promise<R>) => Promise<R | null>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  reset: () => void;
}

/**
 * Hook for managing async operation state
 * @param initialData - Initial data value
 * @returns State and control functions
 */
export function useAsyncState<T = unknown>(
  initialData: T | null = null,
): AsyncState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Execute an async function with automatic loading/error state
   */
  const execute = useCallback(
    async <R = T>(asyncFn: () => Promise<R>): Promise<R | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn();
        setData(result as unknown as T);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        devError("[useAsyncState] Error:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    execute,
    setData,
    reset,
  };
}
