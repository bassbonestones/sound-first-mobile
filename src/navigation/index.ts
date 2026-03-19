/**
 * Navigation Barrel Export
 *
 * Main entry point for navigation types and components.
 */

// Types
export type {
  RootStackParamList,
  RootStackScreenProps,
  // Core screen params
  OnboardingParams,
  FirstNoteParams,
  StartPracticeParams,
  SelfDirectedParams,
  SessionParams,
  SessionEndParams,
  FocusCardParams,
  RatingParams,
  ExerciseTestParams,
  TuneMasteryParams,
  // Import screen params
  ImportMusicParams,
  ScoreViewerParams,
  ScoreViewerDirectParams,
  ScoreViewerFromStorageParams,
  ScoreCorrectionParams,
  MyScoresParams,
  ImportedScorePracticeParams,
  // Screen props
  HomeScreenProps,
  OnboardingScreenProps,
  FirstNoteScreenProps,
  StartPracticeScreenProps,
  SelfDirectedScreenProps,
  SessionScreenProps,
  SessionEndScreenProps,
  FocusCardScreenProps,
  RatingScreenProps,
  HistoryScreenProps,
  AdminScreenProps,
  ExerciseTestScreenProps,
  TuneMasteryScreenProps,
  ImportMusicScreenProps,
  ScoreViewerScreenProps,
  ScoreCorrectionScreenProps,
  MyScoresScreenProps,
  ImportedScorePracticeScreenProps,
  // Helpers
  NavigateFunction,
  SimpleNavigation,
} from "./types";

// Type guards
export { isDirectScoreParams, isStorageScoreParams } from "./types";

// Components
export { AppNavigator, default } from "./AppNavigator";
