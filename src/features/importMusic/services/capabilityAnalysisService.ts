/**
 * Capability Analysis Service
 *
 * Analyzes MusicXML content to discover musical capabilities.
 * Calls the backend /materials/analyze endpoint to get detailed
 * capability information including domains, soft gates, and scores.
 */

import { devLog, devError } from "../../../utils/devLogger";
import { getApiConfig } from "../config/importConfig";
import type {
  CapabilityAnalysisResult,
  CapabilityAnalysisRequest,
  LearningPathRequest,
  LearningPathResponse,
  LearningPathCapability,
} from "../types/analysisTypes";

// ============================================================================
// Types
// ============================================================================

export interface AnalysisServiceResult {
  success: true;
  data: CapabilityAnalysisResult;
}

export interface AnalysisServiceError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type AnalysisResult = AnalysisServiceResult | AnalysisServiceError;

// ============================================================================
// Configuration
// ============================================================================

interface AnalysisConfig {
  /** Base URL for materials API (e.g., http://localhost:8000/api/v1/materials) */
  materialsUrl: string;
  /** Request timeout in ms */
  timeoutMs: number;
}

function getDefaultConfig(): AnalysisConfig {
  const apiConfig = getApiConfig();
  return {
    // Materials endpoint is at root level, not under /api/v1
    materialsUrl: `${apiConfig.baseUrl}/materials`,
    timeoutMs: 30000,
  };
}

// ============================================================================
// Service
// ============================================================================

/**
 * Analyze MusicXML content to discover capabilities.
 *
 * @param musicXml - MusicXML content as string
 * @param options - Optional configuration
 * @returns Analysis result with capabilities and scores
 */
export async function analyzeCapabilities(
  musicXml: string,
  options?: {
    title?: string;
    config?: Partial<AnalysisConfig>;
  },
): Promise<AnalysisResult> {
  const config = { ...getDefaultConfig(), ...options?.config };

  devLog("CapabilityAnalysis: Starting capability analysis", {
    musicXmlLength: musicXml.length,
    title: options?.title,
  });

  try {
    const request: CapabilityAnalysisRequest = {
      musicxml_content: musicXml,
      title: options?.title,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(`${config.materialsUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        devError(
          `CapabilityAnalysis: Analysis failed: ${response.status}`,
          { errorText },
        );
        return {
          success: false,
          error: {
            code: "ANALYSIS_FAILED",
            message: `Analysis failed: ${response.status}`,
            details: errorText,
          },
        };
      }

      const data = (await response.json()) as CapabilityAnalysisResult;

      devLog("CapabilityAnalysis: Analysis complete", {
        capabilities: data.capability_count,
        domains: Object.keys(data.capabilities_by_domain).length,
      });

      return {
        success: true,
        data,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isTimeout =
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : "network";

    devError(`CapabilityAnalysis: Analysis error: ${isTimeout}`, {
      error: errorMessage,
    });

    return {
      success: false,
      error: {
        code: isTimeout === "timeout" ? "TIMEOUT" : "NETWORK_ERROR",
        message:
          isTimeout === "timeout"
            ? "Analysis timed out"
            : `Network error: ${errorMessage}`,
      },
    };
  }
}

// ============================================================================
// Mock Implementation for Testing
// ============================================================================

/**
 * Mock analysis result for testing without backend.
 */
export function getMockAnalysisResult(
  musicXml: string,
  title?: string,
): CapabilityAnalysisResult {
  return {
    title: title || "Mock Score",
    capabilities: [
      "treble_clef",
      "4_4_time",
      "key_c_major",
      "whole_note",
      "half_note",
      "quarter_note",
      "whole_rest",
      "half_rest",
      "quarter_rest",
      "piano",
      "forte",
      "m2_ascending",
      "M2_ascending",
      "m3_ascending",
    ],
    capabilities_by_domain: {
      clef: ["treble_clef"],
      time_signature: ["4_4_time"],
      key_signature: ["key_c_major"],
      note_value: ["whole_note", "half_note", "quarter_note"],
      rest: ["whole_rest", "half_rest", "quarter_rest"],
      dynamic: ["piano", "forte"],
      interval_melodic: ["m2_ascending", "M2_ascending", "m3_ascending"],
    },
    capability_count: 14,
    range_analysis: {
      lowest_pitch: "C4",
      highest_pitch: "G5",
      range_semitones: 19,
      pitch_density: {
        total_pitches: 32,
        unique_pitches: 12,
        most_common: [
          { pitch: "C4", count: 8 },
          { pitch: "G4", count: 6 },
        ],
      },
    },
    chromatic_complexity: 0.15,
    measure_count: 8,
    tempo_bpm: 120,
    tempo_marking: "Moderato",
    tempo_profile: {
      tempo_marking: "Moderato",
      tempo_bpm: 120,
      has_tempo_changes: false,
      tempo_terms: ["Moderato"],
    },
    soft_gates: {
      interval_velocity_score: 0.6,
      rhythm_velocity_score: 0.5,
      tonal_velocity_score: 0.3,
      tempo_velocity_score: 0.4,
      range_velocity_score: 0.7,
      throughput_velocity_score: null,
    },
    unified_scores: {
      difficulty_score: 2.5,
      complexity_score: 3.0,
      accessibility_score: 8.0,
    },
    detailed_extraction: {
      clefs: ["G2"],
      time_signatures: ["4/4"],
      key_signatures: ["C major"],
      note_values: ["whole", "half", "quarter"],
      rests: ["whole", "half", "quarter"],
      dynamics: ["p", "f"],
      articulations: [],
      ornaments: [],
      tempo_terms: ["Moderato"],
      expression_terms: [],
      intervals: ["m2", "M2", "m3"],
      repeat_structures: [],
    },
  };
}

/**
 * Analyze with mock data (for offline/testing).
 */
export async function analyzeCapabilitiesMock(
  musicXml: string,
  options?: { title?: string },
): Promise<AnalysisResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    data: getMockAnalysisResult(musicXml, options?.title),
  };
}

// ============================================================================
// Learning Path Service
// ============================================================================

export interface LearningPathServiceResult {
  success: true;
  data: LearningPathResponse;
}

export interface LearningPathServiceError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type LearningPathResult =
  | LearningPathServiceResult
  | LearningPathServiceError;

/**
 * Generate a learning path from capabilities found in an imported score.
 *
 * Takes capability names detected in the score and the user ID,
 * returns an ordered list of capabilities the user needs to learn,
 * sorted by prerequisites (learn prerequisites first).
 *
 * @param capabilityNames - List of capability names from the imported score
 * @param userId - User ID to check mastery against
 * @param config - Optional configuration
 * @returns Learning path with capabilities ordered by prerequisite depth
 */
export async function generateLearningPath(
  capabilityNames: string[],
  userId: number,
  config?: Partial<{ materialsUrl: string; timeoutMs: number }>,
): Promise<LearningPathResult> {
  const defaultConfig = getDefaultConfig();
  const finalConfig = { ...defaultConfig, ...config };

  devLog("LearningPath: Generating learning path", {
    capabilityCount: capabilityNames.length,
    userId,
  });

  try {
    const request: LearningPathRequest = {
      capability_names: capabilityNames,
      user_id: userId,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      finalConfig.timeoutMs,
    );

    try {
      const response = await fetch(`${finalConfig.materialsUrl}/learning-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        devError(`LearningPath: Generation failed: ${response.status}`, {
          errorText,
        });
        return {
          success: false,
          error: {
            code: "LEARNING_PATH_FAILED",
            message: `Learning path generation failed: ${response.status}`,
            details: errorText,
          },
        };
      }

      const data = (await response.json()) as LearningPathResponse;

      devLog("LearningPath: Generation complete", {
        toLearn: data.capabilities_to_learn,
        alreadyMastered: data.capabilities_already_mastered,
      });

      return {
        success: true,
        data,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isTimeout =
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : "network";

    devError(`LearningPath: Error: ${isTimeout}`, { error: errorMessage });

    return {
      success: false,
      error: {
        code: isTimeout === "timeout" ? "TIMEOUT" : "NETWORK_ERROR",
        message:
          isTimeout === "timeout"
            ? "Learning path generation timed out"
            : `Network error: ${errorMessage}`,
      },
    };
  }
}

/**
 * Mock learning path result for testing without backend.
 */
export function getMockLearningPath(
  capabilityNames: string[],
  userId: number,
): LearningPathResponse {
  const mockCapabilities: LearningPathCapability[] = capabilityNames.map(
    (name, index) => ({
      id: index + 1,
      name,
      display_name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      domain: name.includes("clef")
        ? "clef"
        : name.includes("time")
          ? "time_signature"
          : name.includes("note")
            ? "note_value"
            : "interval_melodic",
      difficulty_tier: 1,
      is_mastered: index < 3, // First 3 are mastered
      prerequisite_names: [],
      depth: 0,
    }),
  );

  const toLearn = mockCapabilities.filter((c) => !c.is_mastered);
  const mastered = mockCapabilities.filter((c) => c.is_mastered);

  // Group by domain
  const pathByDomain: Record<string, LearningPathCapability[]> = {};
  for (const cap of toLearn) {
    if (!pathByDomain[cap.domain]) {
      pathByDomain[cap.domain] = [];
    }
    pathByDomain[cap.domain].push(cap);
  }

  return {
    user_id: userId,
    total_capabilities_in_score: capabilityNames.length,
    capabilities_already_mastered: mastered.length,
    capabilities_to_learn: toLearn.length,
    learning_path: mockCapabilities,
    path_by_domain: pathByDomain,
  };
}

/**
 * Generate learning path with mock data (for offline/testing).
 */
export async function generateLearningPathMock(
  capabilityNames: string[],
  userId: number,
): Promise<LearningPathResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    success: true,
    data: getMockLearningPath(capabilityNames, userId),
  };
}
