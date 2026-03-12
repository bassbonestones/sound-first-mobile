/**
 * API TypeScript types
 *
 * Common types for API requests, responses, and error handling.
 */

// ============================================================================
// HTTP Methods
// ============================================================================

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// ============================================================================
// API Error
// ============================================================================

export interface ApiError {
  detail?: string;
  message?: string;
  status?: number;
  statusText?: string;
}

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

// ============================================================================
// Fetch State (for hooks)
// ============================================================================

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Success Response (standard backend format)
// ============================================================================

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

// ============================================================================
// Request Options
// ============================================================================

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

// ============================================================================
// API Client Interface
// ============================================================================

export interface ApiClient {
  get: <T>(endpoint: string, options?: RequestOptions) => Promise<T>;
  post: <T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ) => Promise<T>;
  put: <T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ) => Promise<T>;
  delete: <T>(endpoint: string, options?: RequestOptions) => Promise<T>;
}
