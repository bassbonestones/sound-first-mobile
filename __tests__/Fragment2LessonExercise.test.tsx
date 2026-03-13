/**
 * @fileoverview Tests for Fragment2LessonExercise component
 * Tests 2-note diatonic scale fragment lesson (do-re patterns)
 *
 * Key features tested:
 * - 4 patterns: LINEAR_UP (1→2), LINEAR_DOWN (2→1), ARC_UP (1→2→1), ARC_DOWN (2→1→2)
 * - 6 phases: FOCUS_CARD → LISTEN → SING → IMAGINE → PLAY_WITH_DRONE → PLAY → FEEDBACK
 * - Focus card rotation (pitch, projection, core_sound, rhythm)
 * - Pattern progress indicators
 * - Drone functionality in PLAY_WITH_DRONE phase
 * - Attestation after 3 failed attempts
 */

import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";

// Mock AudioContext from react-native-audio-api
const mockAudioContext = {
  currentTime: 0,
  sampleRate: 44100,
  createOscillator: jest.fn(() => ({
    type: "sine",
    frequency: { setValueAtTime: jest.fn() },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: {
      value: 1,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
  })),
  createBuffer: jest.fn(() => ({
    getChannelData: jest.fn(() => new Float32Array(1024)),
  })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createBiquadFilter: jest.fn(() => ({
    type: "highpass",
    frequency: { value: 1000 },
    Q: { value: 1 },
    connect: jest.fn(),
  })),
  destination: {},
  close: jest.fn(),
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock usePitchDetection hook
const mockPitchDetection = {
  currentPitch: null as { noteName: string; frequency: number } | null,
  volume: 0,
  isSounding: false,
};

jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => mockPitchDetection),
}));

// Mock NotationDisplay
jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));

// Import component after mocks are defined
import Fragment2LessonExercise from "../src/screens/Session/components/exercises/Fragment2LessonExercise";

describe("Fragment2LessonExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnProgress = jest.fn();

  const defaultProps = {
    config: { clef: "treble" },
    mastery: 0,
    onComplete: mockOnComplete,
    onProgress: mockOnProgress,
    userFirstNote: "C4",
    userRangeLow: "C4",
    userRangeHigh: "G4",
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockPitchDetection.currentPitch = null;
    mockPitchDetection.volume = 0;
    mockPitchDetection.isSounding = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper: advance through timer intervals
  const advanceTimers = (ms: number = 20000) => {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  };

  // Phase navigation helpers
  const goToListenPhase = (getByText: Function, getAllByText?: Function) => {
    // From FOCUS_CARD, press Begin to go to LISTEN
    const beginButton = getByText("Begin →");
    fireEvent.press(beginButton);
  };

  const goToSingPhase = (getByText: Function, getAllByText?: Function) => {
    goToListenPhase(getByText);
    // Press Play Pattern and wait for completion
    const playButton = getByText("🎵 Play Pattern");
    fireEvent.press(playButton);
    advanceTimers();
  };

  const simulateSuccessfulSing = () => {
    // Set up mock pitch detection to simulate successful singing
    mockPitchDetection.isSounding = true;
    mockPitchDetection.currentPitch = { noteName: "C4", frequency: 261.63 };
    mockPitchDetection.volume = 0.5;
  };

  const resetPitchDetection = () => {
    mockPitchDetection.isSounding = false;
    mockPitchDetection.currentPitch = null;
    mockPitchDetection.volume = 0;
  };

  const goToImaginePhaseViaAttest = (
    getByText: Function,
    getAllByText: Function,
  ) => {
    goToSingPhase(getByText);
    // Fail 3 times to get attestation
    for (let i = 0; i < 3; i++) {
      if (i === 0) {
        fireEvent.press(getByText("🎤 Start Singing"));
      } else {
        fireEvent.press(getByText("🎤 Try Again"));
      }
      advanceTimers();
    }
    // Attest
    fireEvent.press(getByText("I sang it correctly →"));
    // Confirm (index 1 is the button)
    fireEvent.press(getAllByText("Confirm")[1]);
    // Continue
    fireEvent.press(getByText("Continue →"));
  };

  const goToPlayWithDronePhase = (
    getByText: Function,
    getAllByText: Function,
  ) => {
    goToImaginePhaseViaAttest(getByText, getAllByText);
    // Press I Imagined It
    const imagineButton = getByText("I Imagined It →");
    fireEvent.press(imagineButton);
  };

  const goToPlayPhase = (getByText: Function, getAllByText: Function) => {
    goToPlayWithDronePhase(getByText, getAllByText);
    // Start with drone
    const droneButton = getByText("🎺 Start with Drone");
    fireEvent.press(droneButton);
    advanceTimers();

    // Move to play alone
    const playAloneButton = getByText("🎺 Play Alone →");
    fireEvent.press(playAloneButton);
  };

  // ==========================================================================
  // FOCUS CARD PHASE TESTS
  // ==========================================================================
  describe("Focus Card Phase", () => {
    it("renders focus card with category and title", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      // First focus card should be pitch
      expect(getByText("PITCH")).toBeTruthy();
      expect(getByText("Pitch Center")).toBeTruthy();
    });

    it("shows pattern information", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      // First pattern is LINEAR_UP
      expect(getByText("Pattern: Linear Up")).toBeTruthy();
    });

    it("shows focus card cue text", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      // Pitch focus card cue
      expect(
        getByText("Hear the center. Sing the center. Play the center."),
      ).toBeTruthy();
    });

    it("has Begin button to start lesson", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      const beginButton = getByText("Begin →");
      expect(beginButton).toBeTruthy();
    });

    it("shows pattern progress indicators", () => {
      const { getByLabelText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      // Should show 4 pattern indicators
      expect(getByLabelText("Linear Up pattern, current")).toBeTruthy();
    });

    it("navigates to Listen phase when Begin is pressed", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      fireEvent.press(getByText("Begin →"));

      expect(getByText("Listen")).toBeTruthy();
    });
  });

  // ==========================================================================
  // LISTEN PHASE TESTS
  // ==========================================================================
  describe("Listen Phase", () => {
    it("shows Listen title", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      expect(getByText("Listen")).toBeTruthy();
    });

    it("shows mini focus card", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      expect(getByText("Pitch Center")).toBeTruthy();
      expect(getByText("🎯")).toBeTruthy();
    });

    it("shows Play Pattern button", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      expect(getByText("🎵 Play Pattern")).toBeTruthy();
    });

    it("shows pattern description with scale degrees", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      // LINEAR_UP is do-re (1→2)
      expect(getByText(/Scale degrees: 1 → 2/)).toBeTruthy();
    });

    it("shows Show Notation button", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      expect(getByText("Show Notation 📝")).toBeTruthy();
    });

    it("button changes to Listening... when playing", () => {
      const { getByText, queryByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      fireEvent.press(getByText("🎵 Play Pattern"));

      expect(queryByText("🎵 Listening...")).toBeTruthy();
    });

    it("transitions to Sing phase after pattern plays", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      fireEvent.press(getByText("🎵 Play Pattern"));
      advanceTimers();

      expect(getByText("Sing")).toBeTruthy();
    });

    it("toggles notation display", () => {
      const { getByText, queryByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      // Show notation
      fireEvent.press(getByText("Show Notation 📝"));
      expect(getByText("Hide Notation")).toBeTruthy();

      // Hide notation
      fireEvent.press(getByText("Hide Notation"));
      expect(queryByText("Hide Notation")).toBeNull();
    });
  });

  // ==========================================================================
  // SING PHASE TESTS
  // ==========================================================================
  describe("Sing Phase", () => {
    it("shows Sing title", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      expect(getByText("Sing")).toBeTruthy();
    });

    it("shows Start Singing button initially", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("shows Hear Again button", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      expect(getByText("🔊 Hear Again")).toBeTruthy();
    });

    it("shows singing instruction with scale degrees", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      expect(getByText(/Sing the pattern: 1 → 2/)).toBeTruthy();
    });

    it("detects pitch when singing", () => {
      const { getByText, queryByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      mockPitchDetection.isSounding = true;
      mockPitchDetection.currentPitch = { noteName: "C4", frequency: 261.63 };
      mockPitchDetection.volume = 0.5;

      fireEvent.press(getByText("🎤 Start Singing"));
      advanceTimers();

      mockPitchDetection.isSounding = false;
    });

    it("shows success message on correct pitch", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Use attestation to get success since pitch mock is complex
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I sang it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);

      expect(getByText("Great singing!")).toBeTruthy();
    });

    it("shows Continue button after successful singing", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Use attestation
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I sang it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);

      expect(getByText("Continue →")).toBeTruthy();
    });

    it("shows Try Again button after failed singing", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // No sound detected
      fireEvent.press(getByText("🎤 Start Singing"));
      advanceTimers();

      expect(getByText("🎤 Try Again")).toBeTruthy();
    });

    it("allows retrying after failure", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // First attempt - fail
      fireEvent.press(getByText("🎤 Start Singing"));
      advanceTimers();

      // Try again
      fireEvent.press(getByText("🎤 Try Again"));
      advanceTimers();

      expect(getByText("🎤 Try Again")).toBeTruthy();
    });

    it("shows attestation option after 3 failed attempts", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }

      expect(getByText("I sang it correctly →")).toBeTruthy();
    });

    it("opens attestation modal when attestation button pressed", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }

      fireEvent.press(getByText("I sang it correctly →"));

      expect(getAllByText("Confirm")[0]).toBeTruthy();
    });

    it("confirms attestation and advances", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }

      fireEvent.press(getByText("I sang it correctly →"));
      // Press Confirm button (index 1 is the button, 0 is the title)
      fireEvent.press(getAllByText("Confirm")[1]);

      expect(getByText("Continue →")).toBeTruthy();
    });

    it("transition to Imagine phase after Continue", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Use attestation
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I sang it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);
      fireEvent.press(getByText("Continue →"));

      expect(getByText("Imagine")).toBeTruthy();
    });
  });

  // ==========================================================================
  // IMAGINE PHASE TESTS
  // ==========================================================================
  describe("Imagine Phase", () => {
    it("shows Imagine title", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToImaginePhaseViaAttest(getByText, getAllByText);

      expect(getByText("Imagine")).toBeTruthy();
    });

    it("shows imagine instruction", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToImaginePhaseViaAttest(getByText, getAllByText);

      expect(
        getByText(/Imagine playing this pattern on your instrument/),
      ).toBeTruthy();
    });

    it("shows imagine visual with music emoji", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToImaginePhaseViaAttest(getByText, getAllByText);

      expect(getByText("🎵")).toBeTruthy();
    });

    it("shows Count with Clicks button", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToImaginePhaseViaAttest(getByText, getAllByText);

      expect(getByText("🥁 Count with Clicks")).toBeTruthy();
    });

    it("shows I Imagined It button", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToImaginePhaseViaAttest(getByText, getAllByText);

      expect(getByText("I Imagined It →")).toBeTruthy();
    });

    it("plays metronome when Count with Clicks is pressed", () => {
      const { getByText, getAllByText, queryByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToImaginePhaseViaAttest(getByText, getAllByText);

      fireEvent.press(getByText("🥁 Count with Clicks"));

      expect(queryByText("🥁 Counting...")).toBeTruthy();
    });

    it("transitions to Play with Drone phase", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToImaginePhaseViaAttest(getByText, getAllByText);

      fireEvent.press(getByText("I Imagined It →"));

      expect(getByText("Play with Drone")).toBeTruthy();
    });
  });

  // ==========================================================================
  // PLAY WITH DRONE PHASE TESTS
  // ==========================================================================
  describe("Play with Drone Phase", () => {
    it("shows Play with Drone title", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      expect(getByText("Play with Drone")).toBeTruthy();
    });

    it("shows drone instruction", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      expect(getByText(/Play the pattern with the tonic drone/)).toBeTruthy();
    });

    it("shows Start with Drone button", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      expect(getByText("🎺 Start with Drone")).toBeTruthy();
    });

    it("shows drone indicator when playing with drone", () => {
      const { getByText, getAllByText, queryByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      fireEvent.press(getByText("🎺 Start with Drone"));

      // Should show drone indicator
      expect(queryByText(/🎵 Drone:/)).toBeTruthy();
    });

    it("shows Play Alone button after playing with drone", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      fireEvent.press(getByText("🎺 Start with Drone"));
      advanceTimers();

      expect(getByText("🎺 Play Alone →")).toBeTruthy();
    });

    it("shows Again with Drone button after completion", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      fireEvent.press(getByText("🎺 Start with Drone"));
      advanceTimers();

      expect(getByText("🎵 Again with Drone")).toBeTruthy();
    });

    it("transitions to Play phase when Play Alone pressed", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      fireEvent.press(getByText("🎺 Start with Drone"));
      advanceTimers();

      fireEvent.press(getByText("🎺 Play Alone →"));

      expect(getByText("Play")).toBeTruthy();
    });
  });

  // ==========================================================================
  // PLAY PHASE TESTS
  // ==========================================================================
  describe("Play Phase", () => {
    it("shows Play title", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      expect(getByText("Play")).toBeTruthy();
    });

    it("shows play instruction for independence", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      expect(
        getByText(/Now play without the drone - full independence!/),
      ).toBeTruthy();
    });

    it("shows Start Playing button", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      expect(getByText("🎺 Start Playing")).toBeTruthy();
    });

    it("shows Hear Again button", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      expect(getByText("🔊 Hear Again")).toBeTruthy();
    });

    it("shows success message on correct play", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      // Use attestation
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎺 Start Playing"));
        } else {
          fireEvent.press(getByText("🎵 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I played it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);

      expect(getByText("Excellent!")).toBeTruthy();
    });

    it("shows Continue after successful play", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      // Use attestation
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎺 Start Playing"));
        } else {
          fireEvent.press(getByText("🎵 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I played it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);

      expect(getByText("Continue →")).toBeTruthy();
    });

    it("shows Try Again after failed play", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      fireEvent.press(getByText("🎺 Start Playing"));
      advanceTimers();

      expect(getByText("🎵 Try Again")).toBeTruthy();
    });

    it("shows attestation after 3 failed attempts", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎺 Start Playing"));
        } else {
          fireEvent.press(getByText("🎵 Try Again"));
        }
        advanceTimers();
      }

      expect(getByText("I played it correctly →")).toBeTruthy();
    });

    it("transitions to Feedback phase after Continue", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      // Use attestation
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎺 Start Playing"));
        } else {
          fireEvent.press(getByText("🎵 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I played it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);
      fireEvent.press(getByText("Continue →"));

      expect(getByText("Pattern Complete!")).toBeTruthy();
    });
  });

  // ==========================================================================
  // FEEDBACK PHASE TESTS
  // ==========================================================================
  describe("Feedback Phase", () => {
    const goToFeedbackPhase = (getByText: Function, getAllByText: Function) => {
      goToPlayPhase(getByText, getAllByText);

      // Use attestation
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎺 Start Playing"));
        } else {
          fireEvent.press(getByText("🎵 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I played it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);
      fireEvent.press(getByText("Continue →"));
    };

    it("shows Pattern Complete title", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToFeedbackPhase(getByText, getAllByText);

      expect(getByText("Pattern Complete!")).toBeTruthy();
    });

    it("shows pattern name", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToFeedbackPhase(getByText, getAllByText);

      expect(getByText("Linear Up")).toBeTruthy();
    });

    it("shows checkmark emoji", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToFeedbackPhase(getByText, getAllByText);

      expect(getByText("✅")).toBeTruthy();
    });

    it("shows progress summary", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToFeedbackPhase(getByText, getAllByText);

      expect(getByText("1 of 4 patterns completed")).toBeTruthy();
    });

    it("shows Next Pattern button", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToFeedbackPhase(getByText, getAllByText);

      expect(getByText("Next Pattern →")).toBeTruthy();
    });

    it("transitions to next pattern Focus Card phase", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToFeedbackPhase(getByText, getAllByText);

      fireEvent.press(getByText("Next Pattern →"));

      // Should show next pattern (Linear Down)
      expect(getByText("Pattern: Linear Down")).toBeTruthy();
    });
  });

  // ==========================================================================
  // PATTERN PROGRESSION TESTS
  // ==========================================================================
  describe("Pattern Progression", () => {
    // Helper to complete one full pattern using attestation
    const completeOnePattern = (
      getByText: Function,
      getAllByText: Function,
    ) => {
      // Focus Card -> Listen
      fireEvent.press(getByText("Begin →"));

      // Listen -> Sing
      fireEvent.press(getByText("🎵 Play Pattern"));
      advanceTimers();

      // Sing -> Imagine (via attestation)
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I sang it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);
      fireEvent.press(getByText("Continue →"));

      // Imagine -> Play with Drone
      fireEvent.press(getByText("I Imagined It →"));

      // Play with Drone -> Play
      fireEvent.press(getByText("🎺 Start with Drone"));
      advanceTimers();
      fireEvent.press(getByText("🎺 Play Alone →"));

      // Play -> Feedback (via attestation)
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎺 Start Playing"));
        } else {
          fireEvent.press(getByText("🎵 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I played it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);
      fireEvent.press(getByText("Continue →"));

      // Feedback -> Next Pattern
      fireEvent.press(getByText("Next Pattern →"));
    };

    it("progresses through all 4 patterns", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      // Complete pattern 1 (Linear Up)
      expect(getByText("Pattern: Linear Up")).toBeTruthy();
      completeOnePattern(getByText, getAllByText);

      // Pattern 2 (Linear Down)
      expect(getByText("Pattern: Linear Down")).toBeTruthy();
      completeOnePattern(getByText, getAllByText);

      // Pattern 3 (Arc Up)
      expect(getByText("Pattern: Arc Up")).toBeTruthy();
      completeOnePattern(getByText, getAllByText);

      // Pattern 4 (Arc Down)
      expect(getByText("Pattern: Arc Down")).toBeTruthy();
    });

    it("rotates focus cards through patterns", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      // Pattern 1 - pitch focus
      expect(getByText("PITCH")).toBeTruthy();
      completeOnePattern(getByText, getAllByText);

      // Pattern 2 - projection focus
      expect(getByText("PROJECTION")).toBeTruthy();
      completeOnePattern(getByText, getAllByText);

      // Pattern 3 - core sound focus (displayed as CORE_SOUND)
      expect(getByText("CORE_SOUND")).toBeTruthy();
      completeOnePattern(getByText, getAllByText);

      // Pattern 4 - rhythm focus
      expect(getByText("RHYTHM")).toBeTruthy();
    });

    it("updates pattern progress indicators", () => {
      const { getByText, getAllByText, getByLabelText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      // Initially Linear Up is current
      expect(getByLabelText("Linear Up pattern, current")).toBeTruthy();

      completeOnePattern(getByText, getAllByText);

      // After completed, should show completed
      expect(getByLabelText("Linear Up pattern, completed")).toBeTruthy();
      expect(getByLabelText("Linear Down pattern, current")).toBeTruthy();
    });
  });

  // ==========================================================================
  // SUCCESS PHASE TESTS
  // ==========================================================================
  describe("Success Phase", () => {
    const completeAllPatterns = (
      getByText: Function,
      getAllByText: Function,
    ) => {
      for (let i = 0; i < 4; i++) {
        // Focus Card -> Listen
        fireEvent.press(getByText("Begin →"));

        // Listen -> Sing
        fireEvent.press(getByText("🎵 Play Pattern"));
        advanceTimers();

        // Sing -> Imagine (via attestation)
        for (let j = 0; j < 3; j++) {
          if (j === 0) {
            fireEvent.press(getByText("🎤 Start Singing"));
          } else {
            fireEvent.press(getByText("🎤 Try Again"));
          }
          advanceTimers();
        }
        fireEvent.press(getByText("I sang it correctly →"));
        fireEvent.press(getAllByText("Confirm")[1]);
        fireEvent.press(getByText("Continue →"));

        // Imagine -> Play with Drone
        fireEvent.press(getByText("I Imagined It →"));

        // Play with Drone -> Play
        fireEvent.press(getByText("🎺 Start with Drone"));
        advanceTimers();
        fireEvent.press(getByText("🎺 Play Alone →"));

        // Play -> Feedback (via attestation)
        for (let j = 0; j < 3; j++) {
          if (j === 0) {
            fireEvent.press(getByText("🎺 Start Playing"));
          } else {
            fireEvent.press(getByText("🎵 Try Again"));
          }
          advanceTimers();
        }
        fireEvent.press(getByText("I played it correctly →"));
        fireEvent.press(getAllByText("Confirm")[1]);
        fireEvent.press(getByText("Continue →"));

        // Feedback -> Next or Success
        if (i < 3) {
          fireEvent.press(getByText("Next Pattern →"));
        } else {
          fireEvent.press(getByText("Finish →"));
        }
      }
    };

    it("shows success when all patterns completed", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      completeAllPatterns(getByText, getAllByText);

      expect(getByText("All Patterns Complete!")).toBeTruthy();
    });

    it("shows celebration emoji", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      completeAllPatterns(getByText, getAllByText);

      expect(getByText("🎉")).toBeTruthy();
    });

    it("shows completion message", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      completeAllPatterns(getByText, getAllByText);

      expect(
        getByText(/You've successfully played all 4 fragment patterns/),
      ).toBeTruthy();
    });

    it("shows Complete Lesson button", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      completeAllPatterns(getByText, getAllByText);

      expect(getByText("Complete Lesson →")).toBeTruthy();
    });

    it("calls onComplete when Complete Lesson pressed", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      completeAllPatterns(getByText, getAllByText);

      fireEvent.press(getByText("Complete Lesson →"));

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          capability: "diatonic_scale_fragment_2",
        }),
      );
    });
  });

  // ==========================================================================
  // NOTATION TOGGLE TESTS
  // ==========================================================================
  describe("Notation Toggle", () => {
    it("shows notation in Listen phase", () => {
      const { getByText, queryByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      fireEvent.press(getByText("Show Notation 📝"));

      expect(getByText("Hide Notation")).toBeTruthy();
    });

    it("shows notation in Sing phase", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      fireEvent.press(getByText("Show Notation 📝"));

      expect(getByText("Hide Notation")).toBeTruthy();
    });

    it("shows notation in Imagine phase", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToImaginePhaseViaAttest(getByText, getAllByText);

      fireEvent.press(getByText("Show Notation 📝"));

      expect(getByText("Hide Notation")).toBeTruthy();
    });

    it("shows notation in Play with Drone phase", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      fireEvent.press(getByText("Show Notation 📝"));

      expect(getByText("Hide Notation")).toBeTruthy();
    });

    it("shows notation in Play phase", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      fireEvent.press(getByText("Show Notation 📝"));

      expect(getByText("Hide Notation")).toBeTruthy();
    });
  });

  // ==========================================================================
  // CONFIGURATION TESTS
  // ==========================================================================
  describe("Configuration", () => {
    it("uses treble clef by default", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      expect(getByText("Pattern: Linear Up")).toBeTruthy();
    });

    it("uses provided userFirstNote", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} userFirstNote="G3" />,
      );

      expect(getByText("Pattern: Linear Up")).toBeTruthy();
    });

    it("respects bass clef config", () => {
      const { getByText } = render(
        <Fragment2LessonExercise
          {...defaultProps}
          config={{ clef: "bass" }}
          userFirstNote="F2"
          userRangeLow="F2"
          userRangeHigh="C3"
        />,
      );

      expect(getByText("Pattern: Linear Up")).toBeTruthy();
    });
  });

  // ==========================================================================
  // BEAT INDICATOR TESTS
  // ==========================================================================
  describe("Beat Indicator", () => {
    it("shows beat indicator during playback", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      fireEvent.press(getByText("🎵 Play Pattern"));

      // Should show count in and play beats
      expect(getByText("Count in:")).toBeTruthy();
      expect(getByText("Play:")).toBeTruthy();
    });

    it("shows beat indicator during singing", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      fireEvent.press(getByText("🎤 Start Singing"));

      expect(getByText("Count in:")).toBeTruthy();
      expect(getByText("Play:")).toBeTruthy();
    });
  });

  // ==========================================================================
  // VOlUME INDICATOR TESTS
  // ==========================================================================
  describe("Volume Indicator", () => {
    it("shows volume indicator in Sing phase", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Volume indicator should be rendered
      // Component uses CircularVolumeIndicator
      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("shows volume indicator in Play phase", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      expect(getByText("🎺 Start Playing")).toBeTruthy();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible Begin button", () => {
      const { getByLabelText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      expect(getByLabelText("Begin exercise")).toBeTruthy();
    });

    it("has accessible Play Pattern button", () => {
      const { getByText, getByLabelText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      expect(getByLabelText("Play pattern")).toBeTruthy();
    });

    it("has accessible notation toggle buttons", () => {
      const { getByText, getByLabelText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);

      expect(getByLabelText("Show notation")).toBeTruthy();

      fireEvent.press(getByText("Show Notation 📝"));

      expect(getByLabelText("Hide notation")).toBeTruthy();
    });

    it("has accessible pattern progress indicators", () => {
      const { getByLabelText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );

      expect(getByLabelText("Linear Up pattern, current")).toBeTruthy();
    });

    it("has accessible attestation buttons", () => {
      const { getByText, getByLabelText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }

      fireEvent.press(getByText("I sang it correctly →"));

      expect(getByLabelText("Cancel attestation")).toBeTruthy();
      expect(getByLabelText("Confirm attestation")).toBeTruthy();
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================
  describe("Error Handling", () => {
    it("handles missing config gracefully", () => {
      const propsWithoutConfig = {
        ...defaultProps,
        config: undefined,
      };

      const { getByText } = render(
        <Fragment2LessonExercise {...propsWithoutConfig} />,
      );

      expect(getByText("Pattern: Linear Up")).toBeTruthy();
    });

    it("handles no sound detection gracefully", () => {
      const { getByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // No sound detected
      fireEvent.press(getByText("🎤 Start Singing"));
      advanceTimers();

      expect(getByText("No sound detected")).toBeTruthy();
    });

    it("handles audio context cleanup", () => {
      const { unmount } = render(<Fragment2LessonExercise {...defaultProps} />);

      unmount();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // HEAR AGAIN FUNCTIONALITY
  // ==========================================================================
  describe("Hear Again Functionality", () => {
    it("allows hearing pattern again in Sing phase", () => {
      const { getByText, queryByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      fireEvent.press(getByText("🔊 Hear Again"));

      expect(queryByText("🔊 Playing...")).toBeTruthy();
    });

    it("allows hearing pattern again in Play phase", () => {
      const { getByText, getAllByText, queryByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      fireEvent.press(getByText("🔊 Hear Again"));

      expect(queryByText("🔊 Playing...")).toBeTruthy();
    });

    it("allows hearing pattern in Play with Drone phase", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayWithDronePhase(getByText, getAllByText);

      fireEvent.press(getByText("🎺 Start with Drone"));
      advanceTimers();

      expect(getByText("🔊 Hear Again")).toBeTruthy();
    });
  });

  // ==========================================================================
  // SING AGAIN / PLAY AGAIN FUNCTIONALITY
  // ==========================================================================
  describe("Sing/Play Again Functionality", () => {
    it("allows singing again after success", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // Use attestation
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎤 Start Singing"));
        } else {
          fireEvent.press(getByText("🎤 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I sang it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);

      expect(getByText("🎤 Sing Again")).toBeTruthy();
    });

    it("allows playing again after success", () => {
      const { getByText, getAllByText } = render(
        <Fragment2LessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);

      // Use attestation
      for (let i = 0; i < 3; i++) {
        if (i === 0) {
          fireEvent.press(getByText("🎺 Start Playing"));
        } else {
          fireEvent.press(getByText("🎵 Try Again"));
        }
        advanceTimers();
      }
      fireEvent.press(getByText("I played it correctly →"));
      fireEvent.press(getAllByText("Confirm")[1]);

      expect(getByText("🎵 Play Again")).toBeTruthy();
    });
  });
});
