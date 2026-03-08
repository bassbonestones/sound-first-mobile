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

/**
 * @typedef {Object} AsyncState
 * @property {any} data - The result data from successful operations
 * @property {boolean} loading - Whether an operation is in progress
 * @property {Error|null} error - Error from failed operations
 * @property {Function} execute - Execute an async function with automatic state management
 * @property {Function} setData - Manually set data
 * @property {Function} reset - Reset to initial state
 */

/**
 * Hook for managing async operation state
 * @param {any} initialData - Initial data value
 * @returns {AsyncState} State and control functions
 */
export function useAsyncState(initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute an async function with automatic loading/error state
   * @param {Function} asyncFn - Async function to execute
   * @returns {Promise<any>} Result from asyncFn or null on error
   */
  const execute = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      console.error("[useAsyncState] Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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

export default useAsyncState;
