/**
 * OMR Provider Types
 *
 * Interface definition for OMR (Optical Music Recognition) providers.
 * Allows swapping between different OMR backends without changing consumer code.
 *
 * Supported providers:
 * - MockOmrProvider: Returns fixed responses for testing
 * - BackendOmrProvider: Calls the actual backend OMR service
 * - (Future) AudiverisProvider: Direct integration with Audiveris
 */

import type {
  OmrJobRequest,
  OmrJobSubmitResponse,
  OmrJobStatusResponse,
  OmrJobResult,
  ImportedScore,
  LocalImportAsset,
  ImportSourceInfo,
} from "../../../types/import";

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Supported OMR provider identifiers
 */
export type OmrProviderType = "mock" | "backend" | "audiveris" | "oemer";

/**
 * Raw output from different OMR providers
 *
 * Using discriminated union for type-safe access to provider-specific data
 */
export type OmrRawOutput =
  | MockOmrRawOutput
  | BackendOmrRawOutput
  | AudiverisOmrRawOutput
  | UnknownOmrRawOutput;

/**
 * Mock provider output (for testing)
 */
export interface MockOmrRawOutput {
  readonly provider: "mock";
  readonly data: {
    readonly mockId: string;
    readonly generatedAt: number;
  };
}

/**
 * Backend provider output
 */
export interface BackendOmrRawOutput {
  readonly provider: "backend";
  readonly data: {
    readonly jobId: string;
    readonly processingTimeMs: number;
    readonly modelVersion: string;
  };
}

/**
 * Audiveris provider output
 */
export interface AudiverisOmrRawOutput {
  readonly provider: "audiveris";
  readonly data: {
    readonly version: string;
    readonly sheetCount: number;
    readonly rawMusicXml: string;
  };
}

/**
 * Unknown provider output (fallback)
 */
export interface UnknownOmrRawOutput {
  readonly provider: "unknown";
  readonly data: unknown;
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Progress callback for OMR operations
 */
export type OmrProgressCallback = (
  /** Normalized progress 0-1 */
  progress: number,
  /** Human-readable status message */
  message: string,
) => void;

/**
 * Cancellation signal for OMR operations
 */
export interface OmrCancellationToken {
  readonly cancelled: boolean;
}

/**
 * Configuration for OMR provider operations
 */
export interface OmrProviderConfig {
  /** Progress callback */
  readonly onProgress?: OmrProgressCallback;
  /** Cancellation token */
  readonly cancellationToken?: OmrCancellationToken;
  /** Override default timeout (ms) */
  readonly timeout?: number;
}

/**
 * Typed OMR job result with provider-specific raw output
 */
export interface TypedOmrJobResult extends Omit<OmrJobResult, "rawOutput"> {
  readonly rawOutput: OmrRawOutput;
}

/**
 * OMR Provider interface
 *
 * All OMR providers must implement this interface.
 * This allows for consistent behavior regardless of the underlying
 * OMR engine (mock, backend service, local processing).
 */
export interface OmrProvider {
  /**
   * Provider identifier
   */
  readonly type: OmrProviderType;

  /**
   * Human-readable provider name
   */
  readonly name: string;

  /**
   * Whether this provider requires network access
   */
  readonly requiresNetwork: boolean;

  /**
   * Whether this provider supports real-time progress updates
   */
  readonly supportsProgress: boolean;

  /**
   * Submit an asset for OMR processing
   *
   * @param request - The job submission request
   * @param config - Optional configuration
   * @returns Submit response with job ID
   */
  submitJob(
    request: OmrJobRequest,
    config?: OmrProviderConfig,
  ): Promise<OmrJobSubmitResponse>;

  /**
   * Get the status of an OMR job
   *
   * @param jobId - The job ID from submission
   * @returns Current job status
   */
  getJobStatus(jobId: string): Promise<OmrJobStatusResponse>;

  /**
   * Wait for job completion with polling
   *
   * @param jobId - The job ID to wait for
   * @param config - Configuration with optional progress callback
   * @returns Final job status with result or error
   */
  waitForCompletion(
    jobId: string,
    config?: OmrProviderConfig,
  ): Promise<OmrJobStatusResponse>;

  /**
   * Normalize OMR result to ImportedScore
   *
   * @param result - The OMR job result
   * @param sourceInfo - Source information for the score
   * @returns Normalized ImportedScore
   */
  normalizeResult(
    result: OmrJobResult,
    sourceInfo: Omit<ImportSourceInfo, "importedAt">,
  ): ImportedScore;

  /**
   * Preprocess an asset before OMR submission
   *
   * This may include image enhancement, perspective correction,
   * PDF page extraction, etc.
   *
   * @param asset - The local asset to preprocess
   * @returns Preprocessed asset with updated URI
   */
  preprocessAsset(
    asset: LocalImportAsset,
  ): Promise<{ uri: string; metadata?: Record<string, unknown> }>;

  /**
   * Cancel an in-progress job (if supported)
   *
   * @param jobId - The job ID to cancel
   * @returns Whether cancellation was successful
   */
  cancelJob?(jobId: string): Promise<boolean>;
}

// ============================================================================
// Provider Factory
// ============================================================================

/**
 * Provider registry
 */
const providers = new Map<OmrProviderType, OmrProvider>();

/**
 * Register an OMR provider
 */
export function registerOmrProvider(provider: OmrProvider): void {
  providers.set(provider.type, provider);
}

/**
 * Get an OMR provider by type
 */
export function getOmrProvider(type: OmrProviderType): OmrProvider | undefined {
  return providers.get(type);
}

/**
 * Get the currently active OMR provider based on configuration
 */
export function getActiveOmrProvider(): OmrProvider {
  // Import config dynamically to avoid circular dependency
  // This require is intentional to break the circular import
  const { getOmrConfig } = require("../config/importConfig") as {
    getOmrConfig: () => { mode: "mock" | "real" };
  };
  const config = getOmrConfig();

  const providerType: OmrProviderType =
    config.mode === "mock" ? "mock" : "backend";
  const provider = providers.get(providerType);

  if (!provider) {
    throw new Error(
      `OMR provider "${providerType}" not registered. ` +
        `Available providers: ${Array.from(providers.keys()).join(", ")}`,
    );
  }

  return provider;
}

/**
 * List all registered providers
 */
export function listOmrProviders(): OmrProviderType[] {
  return Array.from(providers.keys());
}

// ============================================================================
// Progress Normalization
// ============================================================================

/**
 * Normalize progress from different providers to 0-1 range
 *
 * Different providers report progress differently:
 * - Some use 0-100 percentage
 * - Some use 0-1 decimal
 * - Some report step counts
 *
 * @param rawProgress - Raw progress value from provider
 * @param format - How the provider reports progress
 * @returns Normalized progress 0-1
 */
export function normalizeProgress(
  rawProgress: number | null,
  format: "percentage" | "decimal" | "steps" = "decimal",
  totalSteps?: number,
): number {
  if (rawProgress === null) return 0;

  switch (format) {
    case "percentage":
      return Math.min(1, Math.max(0, rawProgress / 100));
    case "decimal":
      return Math.min(1, Math.max(0, rawProgress));
    case "steps":
      if (!totalSteps || totalSteps <= 0) return 0;
      return Math.min(1, Math.max(0, rawProgress / totalSteps));
    default:
      return 0;
  }
}
