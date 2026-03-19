/**
 * Navigation Type Tests
 *
 * Type-level tests to ensure navigation params are correctly typed.
 * These tests use TypeScript's type system to catch errors at compile time.
 */

import type {
  RootStackParamList,
  RootStackScreenProps,
  SessionParams,
  ScoreViewerParams,
  ImportedScorePracticeParams,
} from "../src/navigation/types";
import type { ImportedScore } from "../src/types/import";

// Mock score for testing
const mockScore: ImportedScore = {
  id: "test-123",
  importedAt: new Date().toISOString(),
  source: { type: "file" },
  measureCount: 16,
  parts: [],
  metadata: {},
};

// ============================================================================
// Type-Level Tests (compile-time validation)
// ============================================================================

// These will cause compile errors if the types are wrong
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test: Home has no params
type HomeParamsTest = AssertEqual<RootStackParamList["Home"], undefined>;
const _homeParamsCorrect: HomeParamsTest = true;

// Test: Session params are correctly typed
type SessionParamsTest = AssertEqual<RootStackParamList["Session"], SessionParams>;
const _sessionParamsCorrect: SessionParamsTest = true;

// Test: Session params include expected fields
type SessionHasDuration = SessionParams extends { duration?: number } ? true : false;
const _sessionHasDuration: SessionHasDuration = true;

// Test: ScoreViewer params are union type
type ScoreViewerIsUnion = ScoreViewerParams extends { score?: ImportedScore } | { scoreId?: string } ? true : false;
const _scoreViewerIsUnion: ScoreViewerIsUnion = true;

// Test: ImportedScorePractice requires score and rawMusicXml
type PracticeRequiresScore = "score" extends keyof ImportedScorePracticeParams ? true : false;
type PracticeRequiresMusicXml = "rawMusicXml" extends keyof ImportedScorePracticeParams ? true : false;
const _practiceRequiresScore: PracticeRequiresScore = true;
const _practiceRequiresMusicXml: PracticeRequiresMusicXml = true;

// ============================================================================
// Runtime Tests
// ============================================================================

describe("Navigation Types", () => {
  describe("RootStackParamList", () => {
    it("has correct screens defined", () => {
      // These type assertions ensure the screens exist in the param list
      const screenNames: (keyof RootStackParamList)[] = [
        "Home",
        "Onboarding",
        "FirstNote",
        "StartPractice",
        "SelfDirected",
        "Session",
        "SessionEnd",
        "FocusCard",
        "Rating",
        "History",
        "Admin",
        "ExerciseTest",
        "TuneMastery",
        "ImportMusic",
        "ScoreViewer",
        "ScoreCorrection",
        "MyScores",
        "ImportedScorePractice",
      ];

      // All screens should be valid keys
      expect(screenNames.length).toBe(18);
    });
  });

  describe("SessionParams", () => {
    it("allows valid session params", () => {
      const validParams: SessionParams = {
        duration: 20,
        fatigue: 3,
        instrumentId: 1,
      };

      expect(validParams.duration).toBe(20);
      expect(validParams.fatigue).toBe(3);
    });

    it("allows empty params", () => {
      const emptyParams: SessionParams = {};
      expect(emptyParams.duration).toBeUndefined();
    });

    it("allows extend session params", () => {
      const extendParams: SessionParams = {
        sessionKey: Date.now(),
        extendSession: true,
        sessionContentPlan: { items: [] },
      };

      expect(extendParams.extendSession).toBe(true);
    });
  });

  describe("ScoreViewerParams", () => {
    it("allows direct import params", () => {
      const directParams: ScoreViewerParams = {
        score: mockScore,
        rawMusicXml: "<score></score>",
      };

      expect(directParams.score).toBeDefined();
      expect(directParams.rawMusicXml).toBeDefined();
    });

    it("allows storage load params", () => {
      const storageParams: ScoreViewerParams = {
        scoreId: "abc-123",
      };

      expect(storageParams.scoreId).toBe("abc-123");
    });
  });

  describe("ImportedScorePracticeParams", () => {
    it("requires score and rawMusicXml", () => {
      const params: ImportedScorePracticeParams = {
        score: mockScore,
        rawMusicXml: "<score></score>",
      };

      expect(params.score).toBeDefined();
      expect(params.rawMusicXml).toBeDefined();
    });

    it("allows optional tempo and measure range", () => {
      const params: ImportedScorePracticeParams = {
        score: mockScore,
        rawMusicXml: "<score></score>",
        initialTempo: 120,
        measureRange: { start: 1, end: 8 },
      };

      expect(params.initialTempo).toBe(120);
      expect(params.measureRange?.start).toBe(1);
      expect(params.measureRange?.end).toBe(8);
    });
  });

  describe("Screen Props", () => {
    it("provides typed navigation and route", () => {
      // This test validates that the props type includes navigation and route
      type HomeProps = RootStackScreenProps<"Home">;

      // Type checking - these would fail compilation if wrong
      const validateProps = (props: HomeProps) => {
        type NavType = typeof props.navigation;
        type RouteType = typeof props.route;

        // Navigation should have navigate method
        expect(typeof props.navigation.navigate).toBe("function");

        // Route should have name
        expect(typeof props.route.name).toBe("string");
      };

      // Mock props for testing
      const mockProps: unknown = {
        navigation: {
          navigate: jest.fn(),
          goBack: jest.fn(),
          reset: jest.fn(),
          setOptions: jest.fn(),
          setParams: jest.fn(),
          dispatch: jest.fn(),
          isFocused: jest.fn(),
          canGoBack: jest.fn(),
          getId: jest.fn(),
          getParent: jest.fn(),
          getState: jest.fn(),
        },
        route: {
          key: "Home-123",
          name: "Home",
          params: undefined,
        },
      };

      validateProps(mockProps as HomeProps);
    });
  });
});
