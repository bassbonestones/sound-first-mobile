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

/**
 * @typedef {Object} ApiState
 * @property {any} data - Latest response data
 * @property {boolean} loading - Whether a request is in progress
 * @property {Error|null} error - Error from failed request
 * @property {Function} get - GET request
 * @property {Function} post - POST request
 * @property {Function} put - PUT request
 * @property {Function} del - DELETE request
 * @property {Function} reset - Reset state to initial
 */

/**
 * Hook for making API calls with automatic state management
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoReset - Reset state before each request (default: true)
 * @returns {ApiState} API state and methods
 */
export function useApi({ autoReset = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
   * @param {Function} requestFn - Function that returns a promise
   * @returns {Promise<any>} Response data or null on error
   */
  const executeRequest = useCallback(
    async (requestFn) => {
      if (autoReset) {
        setError(null);
      }
      setLoading(true);
      try {
        const result = await requestFn();
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        devError("[useApi] Request failed:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [autoReset],
  );

  /**
   * GET request
   * @param {string} endpoint - API endpoint (e.g., '/materials')
   * @returns {Promise<any>} Response data
   */
  const get = useCallback(
    (endpoint) => {
      return executeRequest(() => api.get(endpoint));
    },
    [executeRequest],
  );

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<any>} Response data
   */
  const post = useCallback(
    (endpoint, body) => {
      return executeRequest(() => api.post(endpoint, body));
    },
    [executeRequest],
  );

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<any>} Response data
   */
  const put = useCallback(
    (endpoint, body) => {
      return executeRequest(() => api.put(endpoint, body));
    },
    [executeRequest],
  );

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} Response data
   */
  const del = useCallback(
    (endpoint) => {
      return executeRequest(() => api.delete(endpoint));
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
    baseUrl, // Expose baseUrl for direct fetch needs
  };
}

export default useApi;
