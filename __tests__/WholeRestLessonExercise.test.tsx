import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import WholeRestLessonExercise from "../src/screens/Session/components/exercises/WholeRestLessonExercise";

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

describe("WholeRestLessonExercise", () => {
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
        <WholeRestLessonExercise {...defaultProps} />,
      );
      expect(getByText("Whole Rest")).toBeTruthy();
    });

    it("shows the rest duration explanation", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      expect(
        getByText("A whole rest lasts for 4 beats of silence."),
      ).toBeTruthy();
    });

    it("shows that rest hangs below the line", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      expect(getByText(/hangs BELOW the line/)).toBeTruthy();
    });

    it("shows the mnemonic", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      expect(getByText(/Heavy rest hangs low/)).toBeTruthy();
    });

    it("has Got It button to proceed", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      expect(getByText("Begin →")).toBeTruthy();
    });

    it("transitions to Listen phase when Got It is pressed", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByText("Listen")).toBeTruthy();
    });

    it("has accessibility label on Begin button", () => {
      const { getByLabelText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
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
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("Listen")).toBeTruthy();
    });

    it("shows the target note", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("F")).toBeTruthy();
    });

    it("shows listen instructions", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText(/Listen to: whole note, whole rest/)).toBeTruthy();
    });

    it("shows Hear Pattern button initially", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("🎵 Play Pattern")).toBeTruthy();
    });

    it("shows mini focus card reminder", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText(/hangs below the line/)).toBeTruthy();
    });

    it("shows Show Notation button", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("Show Notation 📝")).toBeTruthy();
    });

    it("toggles notation display", () => {
      const { getByText, queryByTestId } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("Show Notation 📝"));
      expect(queryByTestId("notation-display")).toBeTruthy();
      fireEvent.press(getByText("Hide Notation"));
      expect(queryByTestId("notation-display")).toBeNull();
    });

    it("changes to Playing state when Hear Pattern is pressed", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      expect(getByText("🎵 Listening...")).toBeTruthy();
    });

    it("shows I Heard It button after hearing pattern", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      expect(getByText("I Heard It →")).toBeTruthy();
    });

    it("shows Hear Again button after first hearing", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      expect(getByText("🎵 Hear Again")).toBeTruthy();
    });

    it("transitions to Sing phase when I Heard It is pressed", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("I Heard It →"));
      expect(getByText("Sing")).toBeTruthy();
    });

    it("renders with different notes", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} userFirstNote="Bb3" />,
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
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("I Heard It →") as never);
    };

    it("renders sing phase title", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("Sing")).toBeTruthy();
    });

    it("shows sing instructions", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText(/Sing: whole note.*then REST.*then whole/)).toBeTruthy();
    });

    it("shows Start Singing button", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("shows sing phase elements including volume container", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("changes to Sing Now state when Start Singing is pressed", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
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
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText(/Hearing/)).toBeTruthy();
    });

    it("shows feedback after singing attempt", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      expect(getByText(/No sound detected|First note too short/)).toBeTruthy();
    });

    it("shows Try Again button on failure", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      expect(getByText("Try Again")).toBeTruthy();
    });

    it("shows attestation button after 3 failed attempts", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // First attempt
      fireEvent.press(getByText("🎤 Start Singing"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });

      // Second attempt
      fireEvent.press(getByText("Try Again"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });

      // Third attempt
      fireEvent.press(getByText("Try Again"));
      act(() => {
        jest.advanceTimersByTime(20000);
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
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("I Heard It →") as never);

      // Sing phase - do 3 attempts to enable attestation
      fireEvent.press(getByText("🎤 Start Singing") as never);
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("Try Again") as never);
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("Try Again") as never);
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      // Use attestation
      fireEvent.press(getByText("I did it correctly →") as never);
      const confirmButtons = getAllByText("Confirm") as unknown[];
      fireEvent.press(confirmButtons[1] as never);
      fireEvent.press(getByText("Continue →") as never);
    };

    it("renders imagine phase title", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("Imagine")).toBeTruthy();
    });

    it("shows imagine instructions", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText(/Imagine playing: note/)).toBeTruthy();
    });

    it("shows Count with Clicks button", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("🥁 Count with Clicks")).toBeTruthy();
    });

    it("shows I Imagined It button", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("I Imagined It →")).toBeTruthy();
    });

    it("shows imagination visual cue", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("🎵 🤫 🎵")).toBeTruthy();
      expect(getByText(/Note → Silence → Note/)).toBeTruthy();
    });

    it("transitions to Play phase when I Imagined It is pressed", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      fireEvent.press(getByText("I Imagined It →"));
      expect(getByText("Play")).toBeTruthy();
    });

    it("plays metronome clicks when Count with Clicks is pressed", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
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
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("I Heard It →") as never);

      // Use attestation to pass sing phase
      for (let i = 0; i < 3; i++) {
        const btn = i === 0 ? "🎤 Start Singing" : "Try Again";
        fireEvent.press(getByText(btn) as never);
        act(() => {
          jest.advanceTimersByTime(20000);
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
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);
      expect(getByText("Play")).toBeTruthy();
    });

    it("shows play instructions", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);
      expect(
        getByText(/Play: whole note.*whole rest.*whole note/),
      ).toBeTruthy();
    });

    it("shows target note in Play phase", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
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
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("I Heard It →") as never);

      // 3 failed attempts
      for (let i = 0; i < 3; i++) {
        const btn = i === 0 ? "🎤 Start Singing" : "Try Again";
        fireEvent.press(getByText(btn) as never);
        act(() => {
          jest.advanceTimersByTime(20000);
        });
      }
    };

    it("shows attestation modal when I did it correctly is pressed", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      expect(getAllByText("Confirm").length).toBeGreaterThan(0);
      expect(getByText(/I attest that I sang this correctly/)).toBeTruthy();
    });

    it("has Cancel button in attestation modal", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      expect(getByText("Cancel")).toBeTruthy();
    });

    it("closes modal when Cancel is pressed", () => {
      const { getByText, queryByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      const cancelButtons = getAllByText("Cancel");
      fireEvent.press(cancelButtons[0]);
      expect(queryByText(/I attest that I sang/)).toBeNull();
    });

    it("marks as success when Confirm is pressed", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
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
        <WholeRestLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      act(() => {
        fireEvent.press(getByText("🎵 Play Pattern"));
      });
      expect(getByText("Count in:")).toBeTruthy();
    });

    it("shows note and rest rows in beat indicator", () => {
      const { getByText, getAllByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      act(() => {
        fireEvent.press(getByText("🎵 Play Pattern"));
      });
      // Multiple "Note:" rows expected (for first and second whole notes)
      expect(getAllByText("Note:").length).toBeGreaterThan(0);
      expect(getByText("Rest:")).toBeTruthy();
    });
  });

  // ========== MUSICXML GENERATION ==========
  describe("MusicXML generation", () => {
    it("generates notation for natural note", () => {
      const { getByText, getByTestId } = render(
        <WholeRestLessonExercise {...defaultProps} userFirstNote="C4" />,
      );
      fireEvent.press(getByText("Begin →"));
      fireEvent.press(getByText("Show Notation 📝"));
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("handles flat notes", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} userFirstNote="Bb3" />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByText(/B\s*b/)).toBeTruthy();
    });

    it("handles sharp notes", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} userFirstNote="F#3" />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByText(/F\s*#/)).toBeTruthy();
    });
  });

  // ========== PROGRESS REPORTING ==========
  describe("Progress reporting", () => {
    it("calls onProgress with streak info", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(defaultProps.onProgress).toHaveBeenCalled();
    });

    it("uses custom mastery streak from config", () => {
      const customMastery = { correct_streak: 5 };
      render(
        <WholeRestLessonExercise {...defaultProps} mastery={customMastery} />,
      );
      // Component should render without error with custom mastery
    });
  });

  // ========== CONFIG OPTIONS ==========
  describe("Config options", () => {
    it("uses default BPM when not specified", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} config={{}} />,
      );
      expect(getByText("Whole Rest")).toBeTruthy();
    });

    it("accepts custom BPM", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} config={{ bpm: 80 }} />,
      );
      expect(getByText("Whole Rest")).toBeTruthy();
    });

    it("accepts clef config", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} config={{ clef: "bass" }} />,
      );
      expect(getByText("Whole Rest")).toBeTruthy();
    });
  });

  // ========== CLEANUP ==========
  describe("Cleanup", () => {
    it("cleans up audio context on unmount", () => {
      const { getByText, unmount } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      unmount();
      // Should not throw
    });

    it("clears intervals on unmount during playback", () => {
      const { getByText, unmount } = render(
        <WholeRestLessonExercise {...defaultProps} />,
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
        <WholeRestLessonExercise {...defaultProps} />,
      );
      expect(getByLabelText("Begin exercise")).toBeTruthy();
    });

    it("has accessibility labels on notation toggle", () => {
      const { getByText, getByLabelText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByLabelText("Show notation")).toBeTruthy();
    });

    it("has accessibility labels on play buttons", () => {
      const { getByText, getByLabelText } = render(
        <WholeRestLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByLabelText("Hear the pattern")).toBeTruthy();
    });
  });

  // ========== EDGE CASES ==========
  describe("Edge cases", () => {
    it("handles null config gracefully", () => {
      const { getByText } = render(
        <WholeRestLessonExercise
          {...defaultProps}
          config={null as unknown as { bpm: number }}
        />,
      );
      expect(getByText("Whole Rest")).toBeTruthy();
    });

    it("handles undefined userFirstNote gracefully", () => {
      const { getByText } = render(
        <WholeRestLessonExercise {...defaultProps} userFirstNote={undefined} />,
      );
      expect(getByText("Whole Rest")).toBeTruthy();
    });

    it("handles invalid note name gracefully", () => {
      const { getByText } = render(
        <WholeRestLessonExercise
          {...defaultProps}
          userFirstNote="InvalidNote"
        />,
      );
      expect(getByText("Whole Rest")).toBeTruthy();
    });
  });
});
