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
export function getBackendUrl(): string {
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
 * Error response from API
 */
interface ApiError {
  detail?: string;
}

/**
 * API helper with automatic JSON handling
 */
export const api = {
  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`);
    if (!response.ok) {
      const error: ApiError = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  },

  /**
   * POST request
   */
  async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error: ApiError = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  },

  /**
   * PUT request
   */
  async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error: ApiError = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  },

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error: ApiError = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  },
};

export default api;
