/**
 * Mock OMR Provider
 *
 * Testing implementation of OmrProvider that returns configurable mock responses.
 * Useful for:
 * - UI development without backend
 * - Testing error scenarios
 * - Demo mode
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
  MockOmrRawOutput,
} from "../../types/omrProviderTypes";
import { devLog } from "../../../../utils/devLogger";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Mock provider configuration
 */
export interface MockOmrProviderConfig {
  /** Simulate processing delay */
  readonly simulatedDelayMs: number;
  /** Simulate progress steps */
  readonly progressSteps: number;
  /** Chance of simulated failure (0-1) */
  readonly failureRate: number;
  /** Default confidence score */
  readonly defaultConfidence: number;
  /** Whether to generate MusicXML output */
  readonly generateMusicXml: boolean;
}

const DEFAULT_MOCK_CONFIG: MockOmrProviderConfig = {
  simulatedDelayMs: 3000,
  progressSteps: 5,
  failureRate: 0,
  defaultConfidence: 0.85,
  generateMusicXml: true,
};

// ============================================================================
// Mock Job State
// ============================================================================

interface MockJob {
  readonly id: string;
  readonly request: OmrJobRequest;
  readonly startedAt: number;
  readonly config: MockOmrProviderConfig;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  result?: OmrJobResult;
  error?: string;
}

// In-memory job storage
const mockJobs = new Map<string, MockJob>();

// ============================================================================
// Provider Implementation
// ============================================================================

/**
 * Create a Mock OMR Provider
 *
 * @param config - Mock configuration options
 */
export function createMockOmrProvider(
  config: Partial<MockOmrProviderConfig> = {},
): OmrProvider {
  const mockConfig = { ...DEFAULT_MOCK_CONFIG, ...config };

  return {
    type: "mock",
    name: "Mock OMR Provider",
    requiresNetwork: false,
    supportsProgress: true,

    async submitJob(
      request: OmrJobRequest,
      _providerConfig?: OmrProviderConfig,
    ): Promise<OmrJobSubmitResponse> {
      devLog("[MockOMR] Submitting job:", request.remoteAssetId);

      // Generate mock job ID
      const jobId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Check for simulated failure on submission
      if (Math.random() < mockConfig.failureRate * 0.3) {
        return {
          success: false,
          jobId: null,
          estimatedDurationMs: null,
          error: createImportError(
            "omr_submission_failed",
            "Mock submission failure",
            "Could not start music recognition.",
            { severity: "recoverable", recoverable: true },
          ),
        };
      }

      // Create mock job
      const job: MockJob = {
        id: jobId,
        request,
        startedAt: Date.now(),
        config: mockConfig,
        status: "queued",
        progress: 0,
      };

      mockJobs.set(jobId, job);

      return {
        success: true,
        jobId,
        estimatedDurationMs: mockConfig.simulatedDelayMs,
        error: null,
      };
    },

    async getJobStatus(jobId: string): Promise<OmrJobStatusResponse> {
      const job = mockJobs.get(jobId);

      if (!job) {
        return {
          jobId,
          status: "failed",
          progress: null,
          result: null,
          error: createImportError(
            "omr_processing_failed",
            "Job not found",
            "Could not find the recognition job.",
            { severity: "fatal", recoverable: false },
          ),
        };
      }

      // Simulate progress over time
      const elapsed = Date.now() - job.startedAt;
      const expectedDuration = job.config.simulatedDelayMs;

      if (elapsed < expectedDuration) {
        // Still processing
        const rawProgress = elapsed / expectedDuration;
        const steppedProgress =
          Math.floor(rawProgress * job.config.progressSteps) /
          job.config.progressSteps;

        job.status = "processing";
        job.progress = Math.min(steppedProgress, 0.95);

        return {
          jobId,
          status: "processing",
          progress: job.progress,
          result: null,
          error: null,
        };
      }

      // Processing complete
      if (job.status !== "completed" && job.status !== "failed") {
        // Simulate random failure
        if (Math.random() < job.config.failureRate) {
          job.status = "failed";
          job.error = "Simulated processing failure";
        } else {
          job.status = "completed";
          job.result = createMockResult(job);
        }
      }

      if (job.status === "failed") {
        return {
          jobId,
          status: "failed",
          progress: null,
          result: null,
          error: createImportError(
            "omr_processing_failed",
            job.error ?? "Unknown error",
            "Music recognition failed.",
            { severity: "recoverable", recoverable: true },
          ),
        };
      }

      return {
        jobId,
        status: "completed",
        progress: 1,
        result: job.result ?? null,
        error: null,
      };
    },

    async waitForCompletion(
      jobId: string,
      providerConfig?: OmrProviderConfig,
    ): Promise<OmrJobStatusResponse> {
      const pollInterval = 200; // Fast polling for mock
      const maxWait = 60000;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWait) {
        if (providerConfig?.cancellationToken?.cancelled) {
          return {
            jobId,
            status: "failed",
            progress: null,
            result: null,
            error: createImportError(
              "omr_processing_failed",
              "Cancelled",
              "Recognition was cancelled.",
              { severity: "recoverable", recoverable: true },
            ),
          };
        }

        const status = await this.getJobStatus(jobId);

        if (providerConfig?.onProgress && status.progress !== null) {
          providerConfig.onProgress(status.progress, status.status);
        }

        if (status.status === "completed" || status.status === "failed") {
          return status;
        }

        await sleep(pollInterval);
      }

      return {
        jobId,
        status: "timeout",
        progress: null,
        result: null,
        error: createImportError(
          "omr_timeout",
          "Timeout waiting for completion",
          "Recognition is taking too long.",
          { severity: "recoverable", recoverable: true },
        ),
      };
    },

    normalizeResult(
      result: OmrJobResult,
      sourceInfo: Omit<ImportSourceInfo, "importedAt">,
    ): ImportedScore {
      // Create a minimal score from mock result
      const rawOutput = result.rawOutput as MockOmrRawOutput;

      return {
        id: `mock_score_${rawOutput.data.mockId}`,
        metadata: {
          title: "Mock Recognized Score",
          composer: null,
          arranger: null,
          movementTitle: null,
          workTitle: null,
          copyright: null,
          keySignature: {
            fifths: 0,
            mode: "major",
            displayName: "C Major",
          },
          timeSignature: {
            beats: 4,
            beatType: 4,
            displayName: "4/4",
          },
          tempo: {
            bpm: 120,
            beatUnit: "quarter",
            marking: null,
          },
        },
        parts: [
          {
            id: "P1",
            name: "Part 1",
            abbreviation: null,
            instrument: null,
            measures: [],
          },
        ],
        measureCount: 8,
        sourceInfo: {
          ...sourceInfo,
          importedAt: Date.now(),
        },
        confidence: {
          overall: result.confidence,
          measureConfidence: new Array(8).fill(result.confidence),
          needsReview: result.confidence < 0.7,
        },
      };
    },

    async preprocessAsset(
      asset: LocalImportAsset,
    ): Promise<{ uri: string; metadata?: Record<string, unknown> }> {
      devLog("[MockOMR] Preprocessing asset:", asset.fileName);
      // Mock preprocessing - just return the original
      return {
        uri: asset.uri,
        metadata: {
          preprocessed: true,
          originalName: asset.fileName,
        },
      };
    },

    async cancelJob(jobId: string): Promise<boolean> {
      const job = mockJobs.get(jobId);
      if (job && job.status === "processing") {
        job.status = "failed";
        job.error = "Cancelled by user";
        return true;
      }
      return false;
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMockResult(job: MockJob): OmrJobResult {
  const rawOutput: MockOmrRawOutput = {
    provider: "mock",
    data: {
      mockId: job.id,
      generatedAt: Date.now(),
    },
  };

  // Create sample MusicXML if configured
  let musicXml: string | null = null;
  if (job.config.generateMusicXml) {
    musicXml = createMockMusicXml();
  }

  return {
    rawOutput,
    confidence: job.config.defaultConfidence,
    uncertainMeasures:
      job.config.defaultConfidence < 0.8
        ? [
            {
              measureNumber: 3,
              partIndex: 0,
              confidence: 0.55,
              reason: "Unclear notation",
            },
          ]
        : [],
    musicXml,
  };
}

function createMockMusicXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Mock Recognized Score</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Part 1</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;
}

// ============================================================================
// Export
// ============================================================================

/**
 * Default mock provider instance
 */
export const mockOmrProvider = createMockOmrProvider();
