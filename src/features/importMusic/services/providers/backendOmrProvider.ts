/**
 * Backend OMR Provider
 *
 * Production implementation of OmrProvider that connects to the
 * Sound First backend OMR service.
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Auth token injection
 * - 401/403 handling with re-auth callback
 * - Network connectivity checks
 * - AbortController support for cancellation
 */

import type {
  OmrJobRequest,
  OmrJobSubmitResponse,
  OmrJobStatusResponse,
  OmrJobResult,
  ImportedScore,
  LocalImportAsset,
  ImportSourceInfo,
} from "../../../../types/import";
import { createImportError } from "../../../../types/import";
import type {
  OmrProvider,
  OmrProviderConfig,
  BackendOmrRawOutput,
} from "../../types/omrProviderTypes";
import { getApiConfig, getOmrConfig } from "../../config";
import { retryWithBackoff } from "../../utils/retryUtils";
import { checkNetworkAvailable } from "../../utils/networkUtils";
import { devLog, devError } from "../../../../utils/devLogger";

// ============================================================================
// Types
// ============================================================================

/**
 * Auth context for injecting authentication
 */
export interface AuthContext {
  /** Get current auth token */
  getAuthToken: () => Promise<string | null>;
  /** Called when auth fails (401/403), should trigger re-auth flow */
  onAuthFailure?: () => void;
  /** Check if user is authenticated */
  isAuthenticated?: () => boolean;
}

/**
 * Backend provider configuration
 */
export interface BackendOmrProviderConfig {
  /** Auth context for token injection */
  readonly auth?: AuthContext;
  /** Custom fetch implementation (for testing) */
  readonly fetchImpl?: typeof fetch;
  /** Additional headers to include */
  readonly additionalHeaders?: Record<string, string>;
}

/**
 * API response types
 */
interface OmrSubmitApiResponse {
  readonly success: boolean;
  readonly job_id?: string;
  readonly estimated_duration_ms?: number;
  readonly error?: string;
}

interface OmrStatusApiResponse {
  readonly job_id: string;
  readonly status: "queued" | "processing" | "completed" | "failed";
  readonly progress?: number;
  readonly result?: OmrResultApiPayload;
  readonly error?: string;
}

interface OmrResultApiPayload {
  readonly confidence: number;
  readonly music_xml?: string;
  readonly measure_confidence?: number[];
  readonly uncertain_measures?: Array<{
    measure_number: number;
    part_index: number;
    confidence: number;
    reason: string;
  }>;
  readonly metadata?: {
    title?: string;
    composer?: string;
    key_signature?: string;
    time_signature?: string;
    tempo?: number;
  };
  readonly processing_time_ms?: number;
  readonly model_version?: string;
}

/**
 * HTTP error with status code
 */
class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// ============================================================================
// Provider Implementation
// ============================================================================

/**
 * Create a Backend OMR Provider
 *
 * @param config - Provider configuration
 */
export function createBackendOmrProvider(
  config: BackendOmrProviderConfig = {},
): OmrProvider {
  const { auth, fetchImpl = fetch, additionalHeaders = {} } = config;

  /**
   * Build headers for API requests
   */
  async function buildHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...additionalHeaders,
    };

    // Inject auth token if available
    if (auth) {
      const token = await auth.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle HTTP response errors
   */
  async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }

      // Handle auth failures
      if (response.status === 401 || response.status === 403) {
        auth?.onAuthFailure?.();
        throw new HttpError(
          `Authentication failed: ${response.status}`,
          response.status,
          body,
        );
      }

      throw new HttpError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        body,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make an API request with retry logic
   */
  async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const apiConfig = getApiConfig();
    // Use importsUrl for import-related endpoints
    const url = `${apiConfig.importsUrl}${endpoint}`;

    devLog("[BackendOMR] API request:", options.method ?? "GET", url);

    const result = await retryWithBackoff(
      async () => {
        const headers = await buildHeaders();
        const response = await fetchImpl(url, {
          ...options,
          headers: {
            ...headers,
            ...(options.headers as Record<string, string>),
          },
          signal,
        });
        return handleResponse<T>(response);
      },
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        isRetryable: (error) => {
          // Don't retry auth failures
          if (error instanceof HttpError) {
            if (error.status === 401 || error.status === 403) {
              return false;
            }
            // Retry server errors
            return error.status >= 500;
          }
          // Retry network errors
          return (
            error instanceof Error &&
            (error.message.includes("network") ||
              error.message.includes("fetch") ||
              error.message.includes("timeout"))
          );
        },
        signal,
      },
    );

    if (!result.success) {
      throw result.error;
    }

    return result.data;
  }

  return {
    type: "backend",
    name: "Sound First OMR Service",
    requiresNetwork: true,
    supportsProgress: true,

    async submitJob(
      request: OmrJobRequest,
      providerConfig?: OmrProviderConfig,
    ): Promise<OmrJobSubmitResponse> {
      devLog("[BackendOMR] Submitting job:", request.remoteAssetId);

      // Check network connectivity
      const networkCheck = await checkNetworkAvailable();
      if (!networkCheck.available) {
        return {
          success: false,
          jobId: null,
          estimatedDurationMs: null,
          error:
            networkCheck.error ??
            createImportError(
              "network_error",
              "No network connection",
              "Please check your internet connection.",
              { severity: "recoverable", recoverable: true },
            ),
        };
      }

      try {
        const response = await apiRequest<OmrSubmitApiResponse>(
          "/omr/submit",
          {
            method: "POST",
            body: JSON.stringify({
              asset_id: request.remoteAssetId,
              source_type: request.sourceType,
              options: request.options,
            }),
          },
          providerConfig?.cancellationToken?.cancelled
            ? AbortSignal.abort()
            : undefined,
        );

        if (!response.success || !response.job_id) {
          return {
            success: false,
            jobId: null,
            estimatedDurationMs: null,
            error: createImportError(
              "omr_submission_failed",
              response.error ?? "Failed to submit OMR job",
              "Could not start music recognition. Please try again.",
              { severity: "recoverable", recoverable: true },
            ),
          };
        }

        return {
          success: true,
          jobId: response.job_id,
          estimatedDurationMs: response.estimated_duration_ms ?? null,
          error: null,
        };
      } catch (error) {
        devError("[BackendOMR] Submit failed:", error);

        if (
          error instanceof HttpError &&
          (error.status === 401 || error.status === 403)
        ) {
          return {
            success: false,
            jobId: null,
            estimatedDurationMs: null,
            error: createImportError(
              "permission_denied",
              "Authentication required",
              "Please sign in to use music recognition.",
              { severity: "recoverable", recoverable: true },
            ),
          };
        }

        return {
          success: false,
          jobId: null,
          estimatedDurationMs: null,
          error: createImportError(
            "omr_submission_failed",
            error instanceof Error ? error.message : String(error),
            "Could not start music recognition. Please try again.",
            {
              severity: "recoverable",
              recoverable: true,
              cause: error instanceof Error ? error : undefined,
            },
          ),
        };
      }
    },

    async getJobStatus(jobId: string): Promise<OmrJobStatusResponse> {
      devLog("[BackendOMR] Getting status for job:", jobId);

      try {
        const response = await apiRequest<OmrStatusApiResponse>(
          `/omr/status/${jobId}`,
          { method: "GET" },
        );

        return {
          jobId: response.job_id,
          status: response.status,
          progress: response.progress ?? null,
          result: response.result
            ? mapApiResultToJobResult(response.result, jobId)
            : null,
          error: response.error
            ? createImportError(
                "omr_processing_failed",
                response.error,
                "Music recognition encountered an error.",
                { severity: "recoverable", recoverable: true },
              )
            : null,
        };
      } catch (error) {
        devError("[BackendOMR] Get status failed:", error);

        return {
          jobId,
          status: "failed",
          progress: null,
          result: null,
          error: createImportError(
            "omr_processing_failed",
            error instanceof Error ? error.message : String(error),
            "Could not check recognition status.",
            {
              severity: "recoverable",
              recoverable: true,
              cause: error instanceof Error ? error : undefined,
            },
          ),
        };
      }
    },

    async waitForCompletion(
      jobId: string,
      providerConfig?: OmrProviderConfig,
    ): Promise<OmrJobStatusResponse> {
      const omrConfig = getOmrConfig();
      const startTime = Date.now();
      const maxWait = providerConfig?.timeout ?? omrConfig.maxWaitTime;

      while (Date.now() - startTime < maxWait) {
        // Check for cancellation
        if (providerConfig?.cancellationToken?.cancelled) {
          return {
            jobId,
            status: "failed",
            progress: null,
            result: null,
            error: createImportError(
              "omr_processing_failed",
              "Cancelled by user",
              "Recognition was cancelled.",
              { severity: "recoverable", recoverable: true },
            ),
          };
        }

        const status = await this.getJobStatus(jobId);

        // Report progress
        if (providerConfig?.onProgress && status.progress !== null) {
          providerConfig.onProgress(status.progress, status.status);
        }

        // Check if complete
        if (status.status === "completed" || status.status === "failed") {
          return status;
        }

        // Wait before next poll
        await sleep(omrConfig.pollInterval);
      }

      // Timeout
      return {
        jobId,
        status: "failed",
        progress: null,
        result: null,
        error: createImportError(
          "omr_timeout",
          `OMR job timed out after ${maxWait}ms`,
          "Recognition is taking too long. Please try again with a clearer image.",
          {
            severity: "recoverable",
            recoverable: true,
            recoveryHint: "Try a clearer, higher-resolution image",
          },
        ),
      };
    },

    normalizeResult(
      result: OmrJobResult,
      sourceInfo: Omit<ImportSourceInfo, "importedAt">,
    ): ImportedScore {
      const rawOutput = result.rawOutput as BackendOmrRawOutput;

      // If the result includes MusicXML, we could parse it to get full score
      // For now, create structure from available metadata
      const id = `backend_score_${rawOutput.data.jobId}_${Date.now()}`;

      return {
        id,
        metadata: {
          title: null, // Would come from parsing MusicXML
          composer: null,
          arranger: null,
          movementTitle: null,
          workTitle: null,
          copyright: null,
          keySignature: null,
          timeSignature: null,
          tempo: null,
        },
        parts: [], // Would come from parsing MusicXML
        measureCount: 0,
        sourceInfo: {
          ...sourceInfo,
          importedAt: Date.now(),
        },
        confidence: {
          overall: result.confidence,
          measureConfidence: [],
          needsReview: result.confidence < 0.7,
        },
      };
    },

    async preprocessAsset(
      asset: LocalImportAsset,
    ): Promise<{ uri: string; metadata?: Record<string, unknown> }> {
      devLog("[BackendOMR] Preprocessing asset:", asset.fileName);
      // Backend provider doesn't do local preprocessing
      // All preprocessing happens server-side
      return {
        uri: asset.uri,
        metadata: {
          sourceType: asset.sourceType,
          originalName: asset.fileName,
        },
      };
    },

    async cancelJob(jobId: string): Promise<boolean> {
      devLog("[BackendOMR] Cancelling job:", jobId);

      try {
        await apiRequest<{ success: boolean }>(`/omr/cancel/${jobId}`, {
          method: "POST",
        });
        return true;
      } catch (error) {
        devError("[BackendOMR] Cancel failed:", error);
        return false;
      }
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapApiResultToJobResult(
  apiResult: OmrResultApiPayload,
  jobId: string,
): OmrJobResult {
  const rawOutput: BackendOmrRawOutput = {
    provider: "backend",
    data: {
      jobId,
      processingTimeMs: apiResult.processing_time_ms ?? 0,
      modelVersion: apiResult.model_version ?? "unknown",
    },
  };

  return {
    rawOutput,
    confidence: apiResult.confidence,
    uncertainMeasures: (apiResult.uncertain_measures ?? []).map((um) => ({
      measureNumber: um.measure_number,
      partIndex: um.part_index,
      confidence: um.confidence,
      reason: um.reason,
    })),
    musicXml: apiResult.music_xml ?? null,
  };
}

// ============================================================================
// Export
// ============================================================================

/**
 * Default backend provider instance (no auth)
 *
 * For production use, create a new instance with auth context:
 * ```
 * const provider = createBackendOmrProvider({
 *   auth: {
 *     getAuthToken: () => getStoredToken(),
 *     onAuthFailure: () => navigation.navigate('Login'),
 *   },
 * });
 * ```
 */
export const backendOmrProvider = createBackendOmrProvider();
