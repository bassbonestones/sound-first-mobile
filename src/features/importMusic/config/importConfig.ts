/**
 * Import Feature Configuration
 *
 * Centralized configuration for the import feature.
 * Supports environment-aware settings and runtime configuration.
 *
 * DESIGN: Configuration is injected rather than imported directly by services.
 * This allows for:
 * - Easy testing with different configurations
 * - Environment-specific settings (dev/staging/prod)
 * - Runtime configuration updates
 */

import { IMPORT_TIMEOUTS } from "../../../constants/import";

// ============================================================================
// Types
// ============================================================================

/**
 * OMR service mode
 */
export type OmrServiceMode = "mock" | "real";

/**
 * Upload method preference
 */
export type UploadMethod = "signed_url" | "direct";

/**
 * Environment type
 */
export type ImportEnvironment = "development" | "staging" | "production";

/**
 * API configuration
 */
export interface ApiConfig {
  /** Base URL for the API */
  readonly baseUrl: string;
  /** API version prefix */
  readonly apiVersion: string;
  /** Full API URL (computed) */
  readonly apiUrl: string;
  /** Import routes base URL */
  readonly importsUrl: string;
}

/**
 * Upload service configuration
 */
export interface UploadConfig {
  /** Preferred upload method */
  readonly method: UploadMethod;
  /** Upload timeout in ms */
  readonly timeout: number;
  /** Maximum retry attempts */
  readonly maxRetries: number;
  /** Retry delay base (for exponential backoff) */
  readonly retryDelayMs: number;
}

/**
 * OMR service configuration
 */
export interface OmrConfig {
  /** OMR service mode */
  readonly mode: OmrServiceMode;
  /** Polling interval in ms */
  readonly pollInterval: number;
  /** Maximum wait time in ms */
  readonly maxWaitTime: number;
  /** Minimum confidence threshold for auto-accept */
  readonly minConfidenceThreshold: number;
}

/**
 * Memory management configuration
 */
export interface MemoryConfig {
  /** Maximum file size to load into memory (bytes) */
  readonly maxInMemoryFileSize: number;
  /** Warning threshold for file size */
  readonly fileSizeWarningThreshold: number;
}

/**
 * Full import configuration
 */
export interface ImportConfig {
  readonly environment: ImportEnvironment;
  readonly api: ApiConfig;
  readonly upload: UploadConfig;
  readonly omr: OmrConfig;
  readonly memory: MemoryConfig;
  /** Enable verbose logging */
  readonly debugMode: boolean;
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEVELOPMENT_API_URL = "http://localhost:8000";
const STAGING_API_URL = "https://staging-api.soundfirst.app";
const PRODUCTION_API_URL = "https://api.soundfirst.app";

/**
 * Create API config for an environment
 */
function createApiConfig(baseUrl: string): ApiConfig {
  const apiVersion = "v1";
  return {
    baseUrl,
    apiVersion,
    apiUrl: `${baseUrl}/api/${apiVersion}`,
    importsUrl: `${baseUrl}/imports`,
  };
}

/**
 * Check if real OMR mode should be used in development
 * Set EXPO_PUBLIC_USE_REAL_OMR=true to test with real backend
 */
function shouldUseRealOmr(): boolean {
  return process.env.EXPO_PUBLIC_USE_REAL_OMR === "true";
}

/**
 * Development configuration
 */
const developmentConfig: ImportConfig = {
  environment: "development",
  api: createApiConfig(DEVELOPMENT_API_URL),
  upload: {
    method: "direct",
    timeout: IMPORT_TIMEOUTS.UPLOAD,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  omr: {
    mode: shouldUseRealOmr() ? "real" : "mock",
    pollInterval: IMPORT_TIMEOUTS.OMR_POLL_INTERVAL,
    maxWaitTime: IMPORT_TIMEOUTS.OMR_MAX_WAIT,
    minConfidenceThreshold: 0.7,
  },
  memory: {
    maxInMemoryFileSize: 20 * 1024 * 1024, // 20 MB
    fileSizeWarningThreshold: 10 * 1024 * 1024, // 10 MB
  },
  debugMode: true,
};

/**
 * Staging configuration
 */
const stagingConfig: ImportConfig = {
  environment: "staging",
  api: createApiConfig(STAGING_API_URL),
  upload: {
    method: "signed_url",
    timeout: IMPORT_TIMEOUTS.UPLOAD,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  omr: {
    mode: "real",
    pollInterval: IMPORT_TIMEOUTS.OMR_POLL_INTERVAL,
    maxWaitTime: IMPORT_TIMEOUTS.OMR_MAX_WAIT,
    minConfidenceThreshold: 0.7,
  },
  memory: {
    maxInMemoryFileSize: 20 * 1024 * 1024,
    fileSizeWarningThreshold: 10 * 1024 * 1024,
  },
  debugMode: true,
};

/**
 * Production configuration
 */
const productionConfig: ImportConfig = {
  environment: "production",
  api: createApiConfig(PRODUCTION_API_URL),
  upload: {
    method: "signed_url",
    timeout: IMPORT_TIMEOUTS.UPLOAD,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  omr: {
    mode: "real",
    pollInterval: IMPORT_TIMEOUTS.OMR_POLL_INTERVAL,
    maxWaitTime: IMPORT_TIMEOUTS.OMR_MAX_WAIT,
    minConfidenceThreshold: 0.8,
  },
  memory: {
    maxInMemoryFileSize: 20 * 1024 * 1024,
    fileSizeWarningThreshold: 10 * 1024 * 1024,
  },
  debugMode: false,
};

// ============================================================================
// Configuration State
// ============================================================================

/**
 * Determine current environment from NODE_ENV
 */
function detectEnvironment(): ImportEnvironment {
  const nodeEnv = process.env.NODE_ENV;
  const expoEnv = process.env.EXPO_PUBLIC_ENV;

  // Check Expo-specific env first
  if (expoEnv === "staging") return "staging";
  if (expoEnv === "production") return "production";

  // Fall back to NODE_ENV
  if (nodeEnv === "production") return "production";

  return "development";
}

/**
 * Get configuration for an environment
 */
function getConfigForEnvironment(env: ImportEnvironment): ImportConfig {
  switch (env) {
    case "production":
      return productionConfig;
    case "staging":
      return stagingConfig;
    case "development":
    default:
      return developmentConfig;
  }
}

// Current active configuration
let activeConfig: ImportConfig = getConfigForEnvironment(detectEnvironment());

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the current import configuration
 *
 * @returns Current active configuration
 */
export function getImportConfig(): ImportConfig {
  return activeConfig;
}

/**
 * Get API configuration
 */
export function getApiConfig(): ApiConfig {
  return activeConfig.api;
}

/**
 * Get upload configuration
 */
export function getUploadConfig(): UploadConfig {
  return activeConfig.upload;
}

/**
 * Get OMR configuration
 */
export function getOmrConfig(): OmrConfig {
  return activeConfig.omr;
}

/**
 * Get memory configuration
 */
export function getMemoryConfig(): MemoryConfig {
  return activeConfig.memory;
}

/**
 * Check if running in development mode
 */
export function isDevMode(): boolean {
  return activeConfig.environment === "development";
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return activeConfig.debugMode;
}

/**
 * Check if using mock OMR service
 */
export function isOmrMockMode(): boolean {
  return activeConfig.omr.mode === "mock";
}

/**
 * Override the active configuration (for testing)
 *
 * @param config - Partial configuration to merge
 * @returns Previous configuration (for restoration)
 */
export function overrideConfig(config: Partial<ImportConfig>): ImportConfig {
  const previous = activeConfig;
  activeConfig = { ...activeConfig, ...config };
  return previous;
}

/**
 * Reset configuration to environment default
 */
export function resetConfig(): void {
  activeConfig = getConfigForEnvironment(detectEnvironment());
}

/**
 * Set configuration for a specific environment
 *
 * Useful for testing different environment behaviors
 */
export function setEnvironment(env: ImportEnvironment): void {
  activeConfig = getConfigForEnvironment(env);
}
