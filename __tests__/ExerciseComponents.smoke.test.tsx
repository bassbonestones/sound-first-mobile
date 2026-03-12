/**
 * Smoke tests for all exercise components
 *
 * Tests that each exercise component renders without crashing when given
 * minimal valid props. This catches import errors, missing dependencies,
 * and basic rendering issues early.
 */

import React from "react";
import { render } from "@testing-library/react-native";

// ========== Mocks ==========

// Mock WebView with ref support (used by NotationDisplay)
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  const WebView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      postMessage: jest.fn(),
      reload: jest.fn(),
      injectJavaScript: jest.fn(),
    }));
    return <View testID="webview" {...props} />;
  });

  return { WebView };
});

// Mock usePitchDetection hook
jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => ({
    isListening: false,
    error: null,
    currentPitch: null,
    volume: 0,
    isSounding: false,
    isAvailable: true,
    startListening: jest.fn(),
    stopListening: jest.fn(),
  })),
}));

// Mock react-native-audio-api
jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn().mockImplementation(() => ({
    sampleRate: 44100,
    currentTime: 0,
    destination: {},
    createOscillator: jest.fn(() => ({
      type: "sine",
      frequency: { setValueAtTime: jest.fn(), value: 440 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createGain: jest.fn(() => ({
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        value: 1,
      },
      connect: jest.fn(),
    })),
    createBuffer: jest.fn(() => ({
      getChannelData: jest.fn(() => new Float32Array(4410)),
    })),
    createBufferSource: jest.fn(() => ({
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createBiquadFilter: jest.fn(() => ({
      type: "lowpass",
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: jest.fn(),
    })),
    close: jest.fn(),
    suspend: jest.fn(),
    resume: jest.fn(),
  })),
}));

// Mock Audio for web platform
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  src: "",
}));

// Mock fetch for any API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
});

// ========== Exercise Imports ==========

import AuralCompareExercise from "../src/screens/Session/components/exercises/AuralCompareExercise";
import ContourCopyExercise from "../src/screens/Session/components/exercises/ContourCopyExercise";
import DiatonicScalePatternExercise from "../src/screens/Session/components/exercises/DiatonicScalePatternExercise";
import EnterOnBeatOneExercise from "../src/screens/Session/components/exercises/EnterOnBeatOneExercise";
import FeelThePulseExercise from "../src/screens/Session/components/exercises/FeelThePulseExercise";
import FlatAccidentalExercise from "../src/screens/Session/components/exercises/FlatAccidentalExercise";
import Fragment2LessonExercise from "../src/screens/Session/components/exercises/Fragment2LessonExercise";
import HalfNoteLessonExercise from "../src/screens/Session/components/exercises/HalfNoteLessonExercise";
import HalfRestLessonExercise from "../src/screens/Session/components/exercises/HalfRestLessonExercise";
import HalfStepsTheoryExercise from "../src/screens/Session/components/exercises/HalfStepsTheoryExercise";
import KeySignatureBasicsExercise from "../src/screens/Session/components/exercises/KeySignatureBasicsExercise";
import NaturalAccidentalExercise from "../src/screens/Session/components/exercises/NaturalAccidentalExercise";
import NoteNamePatternExercise from "../src/screens/Session/components/exercises/NoteNamePatternExercise";
import NoteNameQuizExercise from "../src/screens/Session/components/exercises/NoteNameQuizExercise";
import OctaveConceptExercise from "../src/screens/Session/components/exercises/OctaveConceptExercise";
import OctaveMatchingExercise from "../src/screens/Session/components/exercises/OctaveMatchingExercise";
import OctavePlayExercise from "../src/screens/Session/components/exercises/OctavePlayExercise";
import PitchDirectionExercise from "../src/screens/Session/components/exercises/PitchDirectionExercise";
import QuarterNoteLessonExercise from "../src/screens/Session/components/exercises/QuarterNoteLessonExercise";
import QuarterRestLessonExercise from "../src/screens/Session/components/exercises/QuarterRestLessonExercise";
import RangeExpansionExercise from "../src/screens/Session/components/exercises/RangeExpansionExercise";
import SharpAccidentalExercise from "../src/screens/Session/components/exercises/SharpAccidentalExercise";
import StartOnCueExercise from "../src/screens/Session/components/exercises/StartOnCueExercise";
import TapAlongExercise from "../src/screens/Session/components/exercises/TapAlongExercise";
import TimeSignature44Exercise from "../src/screens/Session/components/exercises/TimeSignature44Exercise";
import TimeSignatureBasicsExercise from "../src/screens/Session/components/exercises/TimeSignatureBasicsExercise";
import WholeNoteLessonExercise from "../src/screens/Session/components/exercises/WholeNoteLessonExercise";
import WholeRestLessonExercise from "../src/screens/Session/components/exercises/WholeRestLessonExercise";
import WholeStepsTheoryExercise from "../src/screens/Session/components/exercises/WholeStepsTheoryExercise";

// ========== Test Data ==========

const baseProps = {
  onComplete: jest.fn(),
  onProgress: jest.fn(),
  config: {},
  mastery: null,
  userFirstNote: "F3",
};

// Component-specific minimum config overrides for components that require them
const componentConfigs = {
  AuralCompareExercise: {
    config: { note: "C4", noteSequence: ["C4", "D4"] },
  },
  ContourCopyExercise: {
    config: { noteSequence: ["C4", "D4", "E4"] },
  },
  DiatonicScalePatternExercise: {
    config: { noteSequence: ["C4", "D4", "E4", "F4", "G4"] },
  },
  EnterOnBeatOneExercise: {
    config: { tempo: 80, beats: 4 },
  },
  FeelThePulseExercise: {
    config: { tempo: 80, beats: 4 },
  },
  Fragment2LessonExercise: {
    config: { noteSequence: ["C4", "D4"] },
  },
  NoteNamePatternExercise: {
    config: { noteSequence: ["C4", "D4", "E4"] },
  },
  NoteNameQuizExercise: {
    config: { note: "C4" },
  },
  OctaveMatchingExercise: {
    config: { targetNote: "C4" },
  },
  OctavePlayExercise: {
    config: { targetNote: "C4" },
  },
  PitchDirectionExercise: {
    config: { noteSequence: ["C4", "E4"] },
  },
  RangeExpansionExercise: {
    config: { targetNote: "C4" },
  },
  StartOnCueExercise: {
    config: { tempo: 80 },
  },
  TapAlongExercise: {
    config: { tempo: 80, beats: 4 },
  },
  TimeSignature44Exercise: {
    config: { tempo: 80 },
  },
};

// All exercise components with their names
const exercises = [
  { name: "AuralCompareExercise", Component: AuralCompareExercise },
  { name: "ContourCopyExercise", Component: ContourCopyExercise },
  {
    name: "DiatonicScalePatternExercise",
    Component: DiatonicScalePatternExercise,
  },
  { name: "EnterOnBeatOneExercise", Component: EnterOnBeatOneExercise },
  { name: "FeelThePulseExercise", Component: FeelThePulseExercise },
  { name: "FlatAccidentalExercise", Component: FlatAccidentalExercise },
  { name: "Fragment2LessonExercise", Component: Fragment2LessonExercise },
  { name: "HalfNoteLessonExercise", Component: HalfNoteLessonExercise },
  { name: "HalfRestLessonExercise", Component: HalfRestLessonExercise },
  { name: "HalfStepsTheoryExercise", Component: HalfStepsTheoryExercise },
  { name: "KeySignatureBasicsExercise", Component: KeySignatureBasicsExercise },
  { name: "NaturalAccidentalExercise", Component: NaturalAccidentalExercise },
  { name: "NoteNamePatternExercise", Component: NoteNamePatternExercise },
  { name: "NoteNameQuizExercise", Component: NoteNameQuizExercise },
  { name: "OctaveConceptExercise", Component: OctaveConceptExercise },
  { name: "OctaveMatchingExercise", Component: OctaveMatchingExercise },
  { name: "OctavePlayExercise", Component: OctavePlayExercise },
  { name: "PitchDirectionExercise", Component: PitchDirectionExercise },
  { name: "QuarterNoteLessonExercise", Component: QuarterNoteLessonExercise },
  { name: "QuarterRestLessonExercise", Component: QuarterRestLessonExercise },
  { name: "RangeExpansionExercise", Component: RangeExpansionExercise },
  { name: "SharpAccidentalExercise", Component: SharpAccidentalExercise },
  { name: "StartOnCueExercise", Component: StartOnCueExercise },
  { name: "TapAlongExercise", Component: TapAlongExercise },
  { name: "TimeSignature44Exercise", Component: TimeSignature44Exercise },
  {
    name: "TimeSignatureBasicsExercise",
    Component: TimeSignatureBasicsExercise,
  },
  { name: "WholeNoteLessonExercise", Component: WholeNoteLessonExercise },
  { name: "WholeRestLessonExercise", Component: WholeRestLessonExercise },
  { name: "WholeStepsTheoryExercise", Component: WholeStepsTheoryExercise },
];

// ========== Tests ==========

describe("Exercise Components Smoke Tests", () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console warnings during smoke tests
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe.each(exercises)("$name", ({ name, Component }) => {
    it("renders without crashing", () => {
      const props = {
        ...baseProps,
        ...(componentConfigs[name] || {}),
      };

      // This should not throw
      expect(() => {
        render(<Component {...props} />);
      }).not.toThrow();
    });

    it("renders and unmounts cleanly", () => {
      const props = {
        ...baseProps,
        ...(componentConfigs[name] || {}),
      };

      const { unmount } = render(<Component {...props} />);

      // Unmounting should not throw
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});

describe("Exercise Import Validation", () => {
  it("all exercise components are importable", () => {
    // This test passes if the imports at the top of the file succeed
    expect(exercises).toHaveLength(29);
  });

  it("all exercise components are React components", () => {
    exercises.forEach(({ name, Component }) => {
      // Check it's a valid React component (function or class)
      const isFunction = typeof Component === "function";
      const isClass =
        Component.prototype && Component.prototype.isReactComponent;
      const isForwardRef =
        Component.$$typeof === Symbol.for("react.forward_ref");
      const isMemo = Component.$$typeof === Symbol.for("react.memo");

      expect(isFunction || isClass || isForwardRef || isMemo).toBeTruthy();
    });
  });
});
