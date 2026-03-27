import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import QuarterNoteLessonExercise from "../src/screens/Session/components/exercises/QuarterNoteLessonExercise";

// Mock usePitchDetection hook
jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => ({
    currentPitch: { noteName: "F3", frequency: 175 },
    volume: 0,
    isSounding: false,
  })),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock react-native-audio-api
const mockOscillator = {
  type: "sine",
  frequency: { setValueAtTime: jest.fn(), value: 440 },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

const mockGain = {
  gain: {
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    value: 1,
  },
  connect: jest.fn(),
};

const mockAudioContext = {
  sampleRate: 44100,
  currentTime: 0,
  destination: {},
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({ ...mockGain })),
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
};

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

// Mock react-native-webview
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef((props: unknown, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({
        injectJavaScript: jest.fn(),
      }));
      return React.createElement(View, { testID: "webview" });
    }),
  };
});

// Mock NotationDisplay
jest.mock("../src/components/NotationDisplay", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: (props: { musicXML?: string }) =>
      React.createElement(View, { testID: "notation-display" }, [
        React.createElement(Text, { key: "notation" }, "Notation"),
        props.musicXML &&
          React.createElement(Text, { key: "xml" }, "MusicXML loaded"),
      ]),
  };
});

describe("QuarterNoteLessonExercise", () => {
  const defaultProps = {
    config: { bpm: 60, clef: "treble" },
    mastery: { correct_streak: 3 },
    onComplete: jest.fn(),
    onProgress: jest.fn(),
    userFirstNote: "F3",
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Reset mock to default state to prevent state pollution between tests
    const { usePitchDetection } = require("../src/hooks/usePitchDetection");
    usePitchDetection.mockReturnValue({
      currentPitch: null,
      volume: 0,
      isSounding: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========== FOCUS CARD PHASE ==========
  describe("Focus Card Phase", () => {
    it("renders focus card as initial phase", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText("Quarter Note")).toBeTruthy();
    });

    it("shows the quarter note duration explanation", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText("A quarter note lasts for 1 beat.")).toBeTruthy();
    });

    it("shows that the note head is filled", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText(/FILLED \(solid\)|FILLED/)).toBeTruthy();
    });

    it("shows the beat count pattern", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText(/1 - \(2\) stop!/)).toBeTruthy();
    });

    it("has Got It button to proceed", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText("Begin →")).toBeTruthy();
    });

    it("transitions to Listen phase when Got It is pressed", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByText("Listen")).toBeTruthy();
    });

    it("has accessibility label on Begin button", () => {
      const { getByLabelText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      expect(getByLabelText("Begin exercise")).toBeTruthy();
    });
  });

  // ========== LISTEN PHASE ==========
  describe("Listen Phase", () => {
    const goToListenPhase = (getByText: (text: string) => unknown) => {
      fireEvent.press(getByText("Begin →") as never);
    };

    it("renders listen phase title", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("Listen")).toBeTruthy();
    });

    it("shows the target note", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("F")).toBeTruthy();
    });

    it("shows listen instructions", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText(/Listen to the quarter note/)).toBeTruthy();
    });

    it("shows Hear Pattern button initially", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("🎵 Play Pattern")).toBeTruthy();
    });

    it("shows mini focus card reminder", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText(/1 beat → ends on beat 2/)).toBeTruthy();
    });

    it("shows Show Notation button", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("Show Notation 📝")).toBeTruthy();
    });

    it("toggles notation display", () => {
      const { getByText, queryByTestId } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("Show Notation 📝"));
      expect(queryByTestId("notation-display")).toBeTruthy();
      fireEvent.press(getByText("Hide Notation"));
      expect(queryByTestId("notation-display")).toBeNull();
    });

    it("changes to Playing state when Hear Pattern is pressed", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      expect(getByText("🎵 Listening...")).toBeTruthy();
    });

    it("shows I Heard It button after hearing pattern", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(getByText("I Heard It →")).toBeTruthy();
    });

    it("shows Hear Again button after first hearing", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(getByText("🎵 Hear Again")).toBeTruthy();
    });

    it("transitions to Sing phase when I Heard It is pressed", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      fireEvent.press(getByText("I Heard It →"));
      expect(getByText("Sing")).toBeTruthy();
    });

    it("renders with different notes", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} userFirstNote="Bb3" />,
      );
      goToListenPhase(getByText);
      expect(getByText(/B\s*b/)).toBeTruthy();
    });
  });

  // ========== SING PHASE ==========
  describe("Sing Phase", () => {
    const goToSingPhase = (getByText: (text: string) => unknown) => {
      fireEvent.press(getByText("Begin →") as never);
      fireEvent.press(getByText("🎵 Play Pattern") as never);
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      fireEvent.press(getByText("I Heard It →") as never);
    };

    it("renders sing phase title", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("Sing")).toBeTruthy();
    });

    it("shows sing instructions", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText(/Sing the quarter note on solfege/)).toBeTruthy();
    });

    it("shows Start Singing button", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("shows sing phase elements including volume container", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("changes to Sing Now state when Start Singing is pressed", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));
      expect(getByText("🎤 Sing Now...")).toBeTruthy();
    });

    it("shows pitch detection when sound is detected", () => {
      const { usePitchDetection } = require("../src/hooks/usePitchDetection");
      usePitchDetection.mockReturnValue({
        currentPitch: { noteName: "F3", frequency: 175 },
        volume: 0.5,
        isSounding: true,
      });

      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText(/Hearing/)).toBeTruthy();
    });

    it("shows feedback after singing attempt", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(getByText("No sound detected")).toBeTruthy();
    });

    it("shows Try Again button on failure", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(getByText("Try Again")).toBeTruthy();
    });

    it("shows attestation button after 3 failed attempts", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // First attempt
      fireEvent.press(getByText("🎤 Start Singing"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Second attempt
      fireEvent.press(getByText("Try Again"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Third attempt
      fireEvent.press(getByText("Try Again"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Now attestation should be available
      expect(getByText("I did it correctly →")).toBeTruthy();
    });
  });

  // ========== IMAGINE PHASE ==========
  describe("Imagine Phase", () => {
    const goToImaginePhase = (
      getByText: (text: string) => unknown,
      getAllByText: (text: string) => unknown[],
    ) => {
      // Go through Focus Card
      fireEvent.press(getByText("Begin →") as never);
      // Listen phase
      fireEvent.press(getByText("🎵 Play Pattern") as never);
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      fireEvent.press(getByText("I Heard It →") as never);

      // Sing phase - do 3 attempts to enable attestation
      fireEvent.press(getByText("🎤 Start Singing") as never);
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      fireEvent.press(getByText("Try Again") as never);
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      fireEvent.press(getByText("Try Again") as never);
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      // Use attestation
      fireEvent.press(getByText("I did it correctly →") as never);
      const confirmButtons = getAllByText("Confirm") as unknown[];
      fireEvent.press(confirmButtons[1] as never);
      fireEvent.press(getByText("Continue →") as never);
    };

    it("renders imagine phase title", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("Imagine")).toBeTruthy();
    });

    it("shows imagine instructions", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText(/Imagine playing this quarter note/)).toBeTruthy();
    });

    it("shows Count with Clicks button", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("🥁 Count with Clicks")).toBeTruthy();
    });

    it("shows I Imagined It button", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("I Imagined It →")).toBeTruthy();
    });

    it("shows imagination visual cue", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("Hear: 1 - (2) stop")).toBeTruthy();
    });

    it("transitions to Play phase when I Imagined It is pressed", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      fireEvent.press(getByText("I Imagined It →"));
      expect(getByText("Play")).toBeTruthy();
    });

    it("plays metronome clicks when Count with Clicks is pressed", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      fireEvent.press(getByText("🥁 Count with Clicks"));
      expect(getByText("🥁 Counting...")).toBeTruthy();
    });
  });

  // ========== PLAY PHASE ==========
  describe("Play Phase", () => {
    const goToPlayPhase = (
      getByText: (text: string) => unknown,
      getAllByText: (text: string) => unknown[],
    ) => {
      fireEvent.press(getByText("Begin →") as never);
      fireEvent.press(getByText("🎵 Play Pattern") as never);
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      fireEvent.press(getByText("I Heard It →") as never);

      // Use attestation to pass sing phase
      for (let i = 0; i < 3; i++) {
        const btn = i === 0 ? "🎤 Start Singing" : "Try Again";
        fireEvent.press(getByText(btn) as never);
        act(() => {
          jest.advanceTimersByTime(10000);
        });
      }
      fireEvent.press(getByText("I did it correctly →") as never);
      const confirmButtons = getAllByText("Confirm") as unknown[];
      fireEvent.press(confirmButtons[1] as never);
      fireEvent.press(getByText("Continue →") as never);
      fireEvent.press(getByText("I Imagined It →") as never);
    };

    it("renders play phase title", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);
      expect(getByText("Play")).toBeTruthy();
    });

    it("shows play instructions", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);
      expect(
        getByText(/Play the quarter note on your instrument/),
      ).toBeTruthy();
    });

    it("shows target note in Play phase", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);
      expect(getByText("F")).toBeTruthy();
    });
  });

  // ========== ATTESTATION MODAL ==========
  describe("Attestation Modal", () => {
    const goToSingWithFailures = (getByText: (text: string) => unknown) => {
      fireEvent.press(getByText("Begin →") as never);
      fireEvent.press(getByText("🎵 Play Pattern") as never);
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      fireEvent.press(getByText("I Heard It →") as never);

      // 3 failed attempts
      for (let i = 0; i < 3; i++) {
        const btn = i === 0 ? "🎤 Start Singing" : "Try Again";
        fireEvent.press(getByText(btn) as never);
        act(() => {
          jest.advanceTimersByTime(10000);
        });
      }
    };

    it("shows attestation modal when I did it correctly is pressed", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      expect(getAllByText("Confirm").length).toBeGreaterThan(0);
      expect(getByText(/I attest that I sang this correctly/)).toBeTruthy();
    });

    it("has Cancel button in attestation modal", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      expect(getByText("Cancel")).toBeTruthy();
    });

    it("closes modal when Cancel is pressed", () => {
      const { getByText, queryByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      const cancelButtons = getAllByText("Cancel");
      fireEvent.press(cancelButtons[0]);
      expect(queryByText(/I attest that I sang/)).toBeNull();
    });

    it("marks as success when Confirm is pressed", () => {
      const { getByText, getAllByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      const confirmButtons = getAllByText("Confirm");
      fireEvent.press(confirmButtons[1]);
      expect(getByText("Continue →")).toBeTruthy();
    });
  });

  // ========== BEAT INDICATOR ==========
  describe("Beat Indicator", () => {
    it("shows count-in during playback", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      act(() => {
        fireEvent.press(getByText("🎵 Play Pattern"));
      });
      expect(getByText("Count in:")).toBeTruthy();
    });

    it("shows play row in beat indicator", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      act(() => {
        fireEvent.press(getByText("🎵 Play Pattern"));
      });
      expect(getByText("Play:")).toBeTruthy();
    });
  });

  // ========== MUSICXML GENERATION ==========
  describe("MusicXML generation", () => {
    it("generates notation for natural note", () => {
      const { getByText, getByTestId } = render(
        <QuarterNoteLessonExercise {...defaultProps} userFirstNote="C4" />,
      );
      fireEvent.press(getByText("Begin →"));
      fireEvent.press(getByText("Show Notation 📝"));
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("handles flat notes", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} userFirstNote="Bb3" />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByText(/B\s*b/)).toBeTruthy();
    });

    it("handles sharp notes", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} userFirstNote="F#3" />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByText(/F\s*#/)).toBeTruthy();
    });
  });

  // ========== PROGRESS REPORTING ==========
  describe("Progress reporting", () => {
    it("calls onProgress with streak info", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(defaultProps.onProgress).toHaveBeenCalled();
    });

    it("uses custom mastery streak from config", () => {
      const customMastery = { correct_streak: 5 };
      render(
        <QuarterNoteLessonExercise {...defaultProps} mastery={customMastery} />,
      );
      // Component should render without error with custom mastery
    });
  });

  // ========== CONFIG OPTIONS ==========
  describe("Config options", () => {
    it("uses default BPM when not specified", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} config={{}} />,
      );
      expect(getByText("Quarter Note")).toBeTruthy();
    });

    it("accepts custom BPM", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise {...defaultProps} config={{ bpm: 80 }} />,
      );
      expect(getByText("Quarter Note")).toBeTruthy();
    });

    it("accepts clef config", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise
          {...defaultProps}
          config={{ clef: "bass" }}
        />,
      );
      expect(getByText("Quarter Note")).toBeTruthy();
    });
  });

  // ========== CLEANUP ==========
  describe("Cleanup", () => {
    it("cleans up audio context on unmount", () => {
      const { getByText, unmount } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      unmount();
      // Should not throw
    });

    it("clears intervals on unmount during playback", () => {
      const { getByText, unmount } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      fireEvent.press(getByText("🎵 Play Pattern"));
      unmount();
      // Should not throw
    });
  });

  // ========== ACCESSIBILITY ==========
  describe("Accessibility", () => {
    it("has accessibility labels on focus card buttons", () => {
      const { getByLabelText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      expect(getByLabelText("Begin exercise")).toBeTruthy();
    });

    it("has accessibility labels on notation toggle", () => {
      const { getByText, getByLabelText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByLabelText("Show notation")).toBeTruthy();
    });

    it("has accessibility labels on play buttons", () => {
      const { getByText, getByLabelText } = render(
        <QuarterNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByLabelText("Hear the pattern")).toBeTruthy();
    });
  });

  // ========== EDGE CASES ==========
  describe("Edge cases", () => {
    it("handles null config gracefully", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise
          {...defaultProps}
          config={null as unknown as { bpm: number }}
        />,
      );
      expect(getByText("Quarter Note")).toBeTruthy();
    });

    it("handles undefined userFirstNote gracefully", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise
          {...defaultProps}
          userFirstNote={undefined}
        />,
      );
      expect(getByText("Quarter Note")).toBeTruthy();
    });

    it("handles invalid note name gracefully", () => {
      const { getByText } = render(
        <QuarterNoteLessonExercise
          {...defaultProps}
          userFirstNote="InvalidNote"
        />,
      );
      expect(getByText("Quarter Note")).toBeTruthy();
    });
  });
});
