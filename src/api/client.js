/**
 * API Client - Centralized backend communication
 *
 * Provides:
 * - getBackendUrl() - Platform-aware base URL
 * - api object with get/post/put/delete methods
 * - Automatic JSON handling and error normalization
 */

import { Platform } from "react-native";

// Local IP for development - change this to your machine's IP
const LOCAL_IP = "192.168.1.19";

/**
 * Get the backend URL based on platform
 */
export function getBackendUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  } else if (Platform.OS === "ios") {
    return `http://${LOCAL_IP}:8000`;
  } else if (Platform.OS === "web") {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${hostname}:8000`;
  }
  return `http://${LOCAL_IP}:8000`;
}

export const baseUrl = getBackendUrl();

/**
 * API helper with automatic JSON handling
 */
export const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint (without base URL)
   * @returns {Promise<any>} - Parsed JSON response
   */
  async get(endpoint) {
    const response = await fetch(`${baseUrl}${endpoint}`);
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} data - Request body
   * @returns {Promise<any>} - Parsed JSON response
   */
  async post(endpoint, data) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {object} data - Request body
   * @returns {Promise<any>} - Parsed JSON response
   */
  async put(endpoint, data) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint (without base URL)
   * @returns {Promise<any>} - Parsed JSON response
   */
  async delete(endpoint) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },
};

export default api;
