/**
 * Navigation Types
 *
 * Unified type definitions for all app navigation.
 * Eliminates loose navigation typing across the app.
 */

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { ImportedScore, UncertainMeasure } from "../types/import";

// ============================================================================
// Root Stack Param List
// ============================================================================

/**
 * Complete param list for the root stack navigator.
 *
 * All app screens should be listed here with their params.
 *
 * @example
 * ```tsx
 * // Use in a screen:
 * type Props = RootStackScreenProps<'Home'>;
 *
 * function HomeScreen({ navigation, route }: Props) {
 *   navigation.navigate('Session', { duration: 20 }); // Type-safe!
 * }
 * ```
 */
export type RootStackParamList = {
  // Core screens
  Home: undefined;
  Onboarding: OnboardingParams;
  FirstNote: FirstNoteParams;

  // Practice flow
  StartPractice: StartPracticeParams;
  SelfDirected: SelfDirectedParams;
  Session: SessionParams;
  SessionEnd: SessionEndParams;
  FocusCard: FocusCardParams;
  Rating: RatingParams;

  // History & Admin
  History: undefined;
  Admin: undefined;
  ExerciseTest: ExerciseTestParams;
  TuneMastery: TuneMasteryParams;
  GenerationPreview: GenerationPreviewParams;

  // Import Music feature
  ImportMusic: ImportMusicParams;
  ScoreViewer: ScoreViewerParams;
  ScoreCorrection: ScoreCorrectionParams;
  MyScores: MyScoresParams;
  ImportedScorePractice: ImportedScorePracticeParams;

  // Practice Composer feature
  Composer: ComposerParams;
};

// ============================================================================
// Screen Param Interfaces
// ============================================================================

/** Params for OnboardingScreen */
export interface OnboardingParams {
  /** Resume from a specific step */
  initialStep?: number;
}

/** Params for FirstNoteScreen */
export interface FirstNoteParams {
  /** Instrument ID to use */
  instrumentId?: number;
  /** Whether to skip to playing */
  skipIntro?: boolean;
}

/** Params for StartPracticeScreen */
export interface StartPracticeParams {
  /** Pre-selected instrument ID */
  instrumentId?: number;
}

/** Params for SelfDirectedScreen */
export interface SelfDirectedParams {
  /** Pre-selected duration */
  duration?: number;
}

/** Params for SessionScreen */
export interface SessionParams {
  /** Session duration in minutes */
  duration?: number;
  /** Fatigue level 1-5 */
  fatigue?: number;
  /** Instrument ID for this session */
  instrumentId?: number;
  /** Session content plan from API */
  sessionContentPlan?: unknown;
  /** Unique key to force re-render */
  sessionKey?: number;
  /** Whether this is an extension of a previous session */
  extendSession?: boolean;
  /** User ID */
  userId?: number;
}

/** Params for SessionEndScreen */
export interface SessionEndParams {
  /** Number of activities completed */
  completedCount?: number;
  /** Total session duration in minutes */
  totalDuration?: number;
  /** Original session params for extension */
  sessionParams?: Record<string, unknown>;
}

/** Params for FocusCardScreen */
export interface FocusCardParams {
  /** Focus card content text */
  focusCard: string;
}

/** Params for RatingScreen */
export interface RatingParams {
  /** Session ID to rate */
  sessionId?: number;
}

/** Params for ExerciseTestScreen */
export interface ExerciseTestParams {
  /** Exercise type to test */
  exerciseType?: string;
}

/** Params for TuneMasteryScreen */
export interface TuneMasteryParams {
  /** Initial tune ID */
  tuneId?: string;
}

/** Params for GenerationPreviewScreen */
export interface GenerationPreviewParams {
  /** Pre-selected generation type */
  generationType?: "scale" | "arpeggio" | "lick";
  /** Pre-selected root key */
  rootKey?: string;
}

// ============================================================================
// Import Music Screen Params
// ============================================================================

/** Params for ImportMusicScreen */
export interface ImportMusicParams {
  /** Pre-selected file URI to import (from share extension) */
  initialFileUri?: string;
  /** Source of the import request */
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

/** Direct import mode - score data passed in navigation */
export interface ScoreViewerDirectParams {
  /** The imported score */
  score: ImportedScore;
  /** Raw MusicXML content for rendering */
  rawMusicXml: string;
  /** Score ID is not provided in direct mode */
  scoreId?: undefined;
}

/** From storage mode - load by score ID */
export interface ScoreViewerFromStorageParams {
  /** Score ID to load from storage */
  scoreId: string;
  /** Score is not provided when loading by ID */
  score?: undefined;
  /** Raw MusicXML is not provided when loading by ID */
  rawMusicXml?: undefined;
}

/** Params for ScoreCorrectionScreen */
export interface ScoreCorrectionParams {
  /** The score being corrected */
  score: ImportedScore;
  /** Raw MusicXML for re-rendering after corrections */
  rawMusicXml: string;
  /** Measures flagged as uncertain by OMR */
  uncertainMeasures: UncertainMeasure[];
}

/** Params for MyScoresScreen */
export interface MyScoresParams {
  /** Filter to show only favorites */
  filterFavorites?: boolean;
  /** Filter by tags */
  filterTags?: string[];
}

/** Params for ImportedScorePracticeScreen */
export interface ImportedScorePracticeParams {
  /** The score to practice */
  score: ImportedScore;
  /** Raw MusicXML for notation display */
  rawMusicXml: string;
  /** Initial tempo override */
  initialTempo?: number;
  /** Measure range to practice */
  measureRange?: {
    start: number;
    end: number;
  };
}

// ============================================================================
// Practice Composer Params
// ============================================================================

/** Params for ComposerScreen */
export interface ComposerParams {
  /** Score ID to load from storage (undefined for new score) */
  scoreId?: string;
}

// ============================================================================
// Screen Props Types
// ============================================================================

/**
 * Generic screen props type for any screen in the root stack.
 *
 * @example
 * ```tsx
 * type HomeProps = RootStackScreenProps<'Home'>;
 *
 * function HomeScreen({ navigation, route }: HomeProps) {
 *   // navigation and route are fully typed
 * }
 * ```
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Individual screen prop types for convenience
export type HomeScreenProps = RootStackScreenProps<"Home">;
export type OnboardingScreenProps = RootStackScreenProps<"Onboarding">;
export type FirstNoteScreenProps = RootStackScreenProps<"FirstNote">;
export type StartPracticeScreenProps = RootStackScreenProps<"StartPractice">;
export type SelfDirectedScreenProps = RootStackScreenProps<"SelfDirected">;
export type SessionScreenProps = RootStackScreenProps<"Session">;
export type SessionEndScreenProps = RootStackScreenProps<"SessionEnd">;
export type FocusCardScreenProps = RootStackScreenProps<"FocusCard">;
export type RatingScreenProps = RootStackScreenProps<"Rating">;
export type HistoryScreenProps = RootStackScreenProps<"History">;
export type AdminScreenProps = RootStackScreenProps<"Admin">;
export type ExerciseTestScreenProps = RootStackScreenProps<"ExerciseTest">;
export type TuneMasteryScreenProps = RootStackScreenProps<"TuneMastery">;
export type GenerationPreviewScreenProps =
  RootStackScreenProps<"GenerationPreview">;
export type ImportMusicScreenProps = RootStackScreenProps<"ImportMusic">;
export type ScoreViewerScreenProps = RootStackScreenProps<"ScoreViewer">;
export type ScoreCorrectionScreenProps =
  RootStackScreenProps<"ScoreCorrection">;
export type MyScoresScreenProps = RootStackScreenProps<"MyScores">;
export type ImportedScorePracticeScreenProps =
  RootStackScreenProps<"ImportedScorePractice">;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if ScoreViewerParams is direct mode
 */
export function isDirectScoreParams(
  params: ScoreViewerParams | undefined,
): params is ScoreViewerDirectParams {
  return (
    params !== undefined && "score" in params && params.score !== undefined
  );
}

/**
 * Check if ScoreViewerParams is storage mode
 */
export function isStorageScoreParams(
  params: ScoreViewerParams | undefined,
): params is ScoreViewerFromStorageParams {
  return (
    params !== undefined && "scoreId" in params && params.scoreId !== undefined
  );
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Type for navigation.navigate function.
 * Useful when passing navigation as a prop to non-screen components.
 */
export type NavigateFunction = <T extends keyof RootStackParamList>(
  ...args: RootStackParamList[T] extends undefined
    ? [screen: T]
    : [screen: T, params: RootStackParamList[T]]
) => void;

/**
 * Minimal navigation interface for components that only need navigate.
 */
export interface SimpleNavigation {
  navigate: NavigateFunction;
  goBack: () => void;
}

// ============================================================================
// Declaration Merge for React Navigation
// ============================================================================

/**
 * Augment the global namespace so that navigation is typed globally.
 * This allows useNavigation() hook to be fully typed without explicit generics.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
