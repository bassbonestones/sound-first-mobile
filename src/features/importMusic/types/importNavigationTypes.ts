/**
 * Import Navigation Types
 *
 * Type-safe navigation param definitions for import feature screens.
 * Eliminates `any` types in navigation props throughout the feature.
 */

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ImportedScore, UncertainMeasure } from "../../../types/import";

// ============================================================================
// Param List
// ============================================================================

/**
 * Navigation params for all import feature screens
 *
 * Use this type with your root navigator to get type-safe navigation.
 *
 * @example
 * ```tsx
 * // In your navigation types file:
 * import type { ImportStackParamList } from './features/importMusic';
 *
 * export type RootStackParamList = {
 *   Home: undefined;
 *   // Spread import screens
 *   ...ImportStackParamList;
 * };
 * ```
 */
export type ImportStackParamList = {
  ImportMusic: ImportMusicParams;
  ScoreViewer: ScoreViewerParams;
  ScoreCorrection: ScoreCorrectionParams;
  MyScores: MyScoresParams;
  ImportedScorePractice: ImportedScorePracticeParams;
};

// ============================================================================
// Individual Screen Params
// ============================================================================

/**
 * Params for ImportMusicScreen
 */
export interface ImportMusicParams {
  /** Optional: Pre-selected file URI to import (from share extension) */
  initialFileUri?: string;
  /** Optional: Source of the import request */
  source?: "menu" | "share_extension" | "deep_link";
}

/**
 * Params for ScoreViewerScreen
 *
 * Supports two modes:
 * 1. Direct import: score + rawMusicXml passed directly
 * 2. From library: scoreId passed, loads from storage
 */
export type ScoreViewerParams =
  | ScoreViewerDirectParams
  | ScoreViewerFromStorageParams;

/**
 * Direct import mode - score data passed in navigation
 */
export interface ScoreViewerDirectParams {
  /** The imported score */
  score: ImportedScore;
  /** Raw MusicXML content for rendering */
  rawMusicXml: string;
  /** Score ID is not provided in direct mode */
  scoreId?: undefined;
}

/**
 * From storage mode - load by score ID
 */
export interface ScoreViewerFromStorageParams {
  /** Score ID to load from storage */
  scoreId: string;
  /** Score is not provided when loading by ID */
  score?: undefined;
  /** Raw MusicXML is not provided when loading by ID */
  rawMusicXml?: undefined;
}

/**
 * Params for ScoreCorrectionScreen
 */
export interface ScoreCorrectionParams {
  /** The score being corrected */
  score: ImportedScore;
  /** Raw MusicXML for re-rendering after corrections */
  rawMusicXml: string;
  /** Measures flagged as uncertain by OMR */
  uncertainMeasures: UncertainMeasure[];
}

/**
 * Params for MyScoresScreen
 */
export interface MyScoresParams {
  /** Optional: Filter to show only favorites */
  filterFavorites?: boolean;
  /** Optional: Filter by tags */
  filterTags?: string[];
}

/**
 * Params for ImportedScorePracticeScreen
 */
export interface ImportedScorePracticeParams {
  /** The score to practice */
  score: ImportedScore;
  /** Raw MusicXML for notation display */
  rawMusicXml: string;
  /** Optional: Initial tempo override */
  initialTempo?: number;
  /** Optional: Measure range to practice */
  measureRange?: {
    start: number;
    end: number;
  };
}

// ============================================================================
// Screen Props Types
// ============================================================================

/**
 * Props for ImportMusicScreen
 */
export type ImportMusicScreenProps = NativeStackScreenProps<
  ImportStackParamList,
  "ImportMusic"
>;

/**
 * Props for ScoreViewerScreen
 */
export type ScoreViewerScreenProps = NativeStackScreenProps<
  ImportStackParamList,
  "ScoreViewer"
>;

/**
 * Props for ScoreCorrectionScreen
 */
export type ScoreCorrectionScreenProps = NativeStackScreenProps<
  ImportStackParamList,
  "ScoreCorrection"
>;

/**
 * Props for MyScoresScreen
 */
export type MyScoresScreenProps = NativeStackScreenProps<
  ImportStackParamList,
  "MyScores"
>;

/**
 * Props for ImportedScorePracticeScreen
 */
export type ImportedScorePracticeScreenProps = NativeStackScreenProps<
  ImportStackParamList,
  "ImportedScorePractice"
>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if ScoreViewerParams is direct mode
 */
export function isDirectScoreParams(
  params: ScoreViewerParams,
): params is ScoreViewerDirectParams {
  return "score" in params && params.score !== undefined;
}

/**
 * Check if ScoreViewerParams is storage mode
 */
export function isStorageScoreParams(
  params: ScoreViewerParams,
): params is ScoreViewerFromStorageParams {
  return "scoreId" in params && params.scoreId !== undefined;
}
