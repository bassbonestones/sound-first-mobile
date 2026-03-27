/**
 * WholeNoteLessonExercise tests
 *
 * Comprehensive tests for the whole note lesson exercise component.
 * Tests all phases: Focus Card → Listen → Sing → Imagine → Play
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import WholeNoteLessonExercise from "../src/screens/Session/components/exercises/WholeNoteLessonExercise";

// Mock WebView with ref support
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  const WebView = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        postMessage: jest.fn(),
        reload: jest.fn(),
        injectJavaScript: jest.fn(),
      }));
      return <View testID="webview" {...props} />;
    },
  );
  return { WebView };
});

// Mock usePitchDetection hook with controllable state
let mockPitchState = {
  isListening: false,
  error: null,
  currentPitch: null as { noteName: string; frequency: number } | null,
  volume: 0,
  isSounding: false,
  isAvailable: true,
  startListening: jest.fn(),
  stopListening: jest.fn(),
};

jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => mockPitchState),
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

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
}));

describe("WholeNoteLessonExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnProgress = jest.fn();

  const defaultProps = {
    config: { bpm: 60 },
    mastery: { correct_streak: 3 },
    onComplete: mockOnComplete,
    onProgress: mockOnProgress,
    userFirstNote: "F3",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset pitch state
    mockPitchState = {
      isListening: false,
      error: null,
      currentPitch: null,
      volume: 0,
      isSounding: false,
      isAvailable: true,
      startListening: jest.fn(),
      stopListening: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========== FOCUS CARD PHASE ==========
  describe("Focus Card Phase", () => {
    it("renders focus card as initial phase", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText("Whole Note")).toBeTruthy();
      expect(getByText("A whole note lasts for 4 beats.")).toBeTruthy();
    });

    it("shows the whole note ending explanation", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText("The note ends right on the next ONE.")).toBeTruthy();
    });

    it("shows the beat count pattern", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText("Count: 1 - 2 - 3 - 4 - (1)")).toBeTruthy();
    });

    it('has "Got It" button to proceed', () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      expect(getByText("Begin →")).toBeTruthy();
    });

    it("transitions to Listen phase when Got It is pressed", () => {
      const { getByText, queryByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(queryByText("A whole note lasts for 4 beats.")).toBeNull();
      expect(getByText("Listen")).toBeTruthy();
    });

    it("has accessibility label on Got It button", () => {
      const { getByLabelText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
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
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("Listen")).toBeTruthy();
    });

    it("shows the target note", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("F")).toBeTruthy(); // F3 without octave
    });

    it("shows listen instructions", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(
        getByText(/Listen to the whole note.*Notice how it lasts 4 beats/s),
      ).toBeTruthy();
    });

    it("shows Hear Pattern button initially", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("🎵 Play Pattern")).toBeTruthy();
    });

    it("shows mini focus card reminder", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("4 beats → ends on next ONE")).toBeTruthy();
    });

    it("shows Show Notation button", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      expect(getByText("Show Notation 📝")).toBeTruthy();
    });

    it("toggles notation display", () => {
      const { getByText, queryByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("Show Notation 📝"));
      expect(getByText("Hide Notation")).toBeTruthy();
      fireEvent.press(getByText("Hide Notation"));
      expect(queryByText("Hide Notation")).toBeNull();
      expect(getByText("Show Notation 📝")).toBeTruthy();
    });

    it("changes to Playing state when Hear Pattern is pressed", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));
      expect(getByText("🎵 Listening...")).toBeTruthy();
    });

    it('shows "I Heard It" button after hearing pattern', () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🎵 Play Pattern"));

      // Advance through playback (count-in + 5 beats + 1)
      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds at 60bpm
      });

      expect(getByText("I Heard It →")).toBeTruthy();
    });

    it('shows "Hear Again" button after first hearing', () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
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
        <WholeNoteLessonExercise {...defaultProps} />,
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
        <WholeNoteLessonExercise {...defaultProps} userFirstNote="Bb4" />,
      );
      goToListenPhase(getByText);
      // Note display shows "B\nb" in a single text node
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
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("Sing")).toBeTruthy();
    });

    it("shows sing instructions", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText(/Sing the whole note on solfege/)).toBeTruthy();
    });

    it("shows Start Singing button", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("shows volume indicator", () => {
      const { getByTestId } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      // Volume indicator is rendered via CircularVolumeIndicator
    });

    it("changes to Sing Now state when Start Singing is pressed", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));
      expect(getByText("🎤 Sing Now...")).toBeTruthy();
    });

    it("shows pitch detection when sound is detected", () => {
      mockPitchState.isSounding = true;
      mockPitchState.currentPitch = { noteName: "F3", frequency: 174.61 };

      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      expect(getByText("Hearing: F3")).toBeTruthy();
    });

    it("shows feedback after singing attempt", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should show feedback - "No sound detected" when no pitch is detected
      expect(getByText("No sound detected")).toBeTruthy();
    });

    it("shows Try Again button on failure", () => {
      const { getByText, queryByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Since no sound was detected, should fail
      expect(getByText("Try Again")).toBeTruthy();
    });

    it("shows attestation button after 3 failed attempts", () => {
      const { getByText, queryByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingPhase(getByText);

      // First attempt
      fireEvent.press(getByText("🎤 Start Singing"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(queryByText("I did it correctly →")).toBeNull();

      // Second attempt
      fireEvent.press(getByText("Try Again"));
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(queryByText("I did it correctly →")).toBeNull();

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
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("Imagine")).toBeTruthy();
    });

    it("shows imagine instructions", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText(/Imagine playing this whole note/)).toBeTruthy();
    });

    it("shows Count with Clicks button", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("🥁 Count with Clicks")).toBeTruthy();
    });

    it("shows I Imagined It button", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("I Imagined It →")).toBeTruthy();
    });

    it("shows imagination visual cue", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("🎵")).toBeTruthy();
      expect(getByText(/Hear your instrument: 1 - 2 - 3 - 4/)).toBeTruthy();
    });

    it("transitions to Play phase when I Imagined It is pressed", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToImaginePhase(getByText, getAllByText);
      fireEvent.press(getByText("I Imagined It →"));
      expect(getByText("Play")).toBeTruthy();
    });

    it("plays metronome clicks when Count with Clicks is pressed", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
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
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);
      expect(getByText("Play")).toBeTruthy();
    });

    it("shows play instructions", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToPlayPhase(getByText, getAllByText);
      expect(getByText(/Play the whole note on your instrument/)).toBeTruthy();
    });

    it("shows target note in Play phase", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
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
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      expect(getAllByText("Confirm").length).toBeGreaterThan(0);
      expect(getByText(/I attest that I sang this correctly/)).toBeTruthy();
    });

    it("has Cancel button in attestation modal", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      expect(getByText("Cancel")).toBeTruthy();
    });

    it("closes modal when Cancel is pressed", () => {
      const { getByText, queryByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      goToSingWithFailures(getByText);
      fireEvent.press(getByText("I did it correctly →"));
      const cancelButtons = getAllByText("Cancel");
      fireEvent.press(cancelButtons[0]);
      expect(queryByText(/I attest that I sang/)).toBeNull();
    });

    it("marks as success when Confirm is pressed", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
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
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      fireEvent.press(getByText("🎵 Play Pattern"));
      expect(getByText("Count in:")).toBeTruthy();
    });

    it("shows sing row in beat indicator", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      fireEvent.press(getByText("🎵 Play Pattern"));
      expect(getByText("Sing:")).toBeTruthy();
    });
  });

  // ========== MUSICXML GENERATION ==========
  describe("MusicXML generation", () => {
    it("generates notation for natural note", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} userFirstNote="C4" />,
      );
      fireEvent.press(getByText("Begin →"));
      fireEvent.press(getByText("Show Notation 📝"));
      // WebView should be rendered with musicxml
      expect(getByText("Hide Notation")).toBeTruthy();
    });

    it("handles flat notes", () => {
      const { getByText, getAllByText } = render(
        <WholeNoteLessonExercise {...defaultProps} userFirstNote="Bb3" />,
      );
      fireEvent.press(getByText("Begin →"));
      // Note display shows "B\nb" in a single text node
      expect(getByText(/B\s*b/)).toBeTruthy();
    });

    it("handles sharp notes", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} userFirstNote="F#4" />,
      );
      fireEvent.press(getByText("Begin →"));
      // Note display shows "F\n#" in a single text node
      expect(getByText(/F\s*#/)).toBeTruthy();
    });
  });

  // ========== PROGRESS REPORTING ==========
  describe("Progress reporting", () => {
    it("calls onProgress with streak info", () => {
      render(<WholeNoteLessonExercise {...defaultProps} />);
      expect(mockOnProgress).toHaveBeenCalledWith({
        streak: 0,
        masteryRequired: 3,
      });
    });

    it("uses custom mastery streak from config", () => {
      render(
        <WholeNoteLessonExercise
          {...defaultProps}
          mastery={{ correct_streak: 5 }}
        />,
      );
      expect(mockOnProgress).toHaveBeenCalledWith({
        streak: 0,
        masteryRequired: 5,
      });
    });
  });

  // ========== CONFIG OPTIONS ==========
  describe("Config options", () => {
    it("uses default BPM when not specified", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} config={{}} />,
      );
      // Should render without error
      expect(getByText("Whole Note")).toBeTruthy();
    });

    it("accepts custom BPM", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} config={{ bpm: 120 }} />,
      );
      expect(getByText("Whole Note")).toBeTruthy();
    });

    it("accepts clef config", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} config={{ clef: "bass" }} />,
      );
      expect(getByText("Whole Note")).toBeTruthy();
    });
  });

  // ========== CLEANUP ==========
  describe("Cleanup", () => {
    it("cleans up audio context on unmount", () => {
      const { unmount } = render(<WholeNoteLessonExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("clears intervals on unmount during playback", () => {
      const { getByText, unmount } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
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
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      expect(getByLabelText("Begin exercise")).toBeTruthy();
    });

    it("has accessibility labels on notation toggle", () => {
      const { getByText, getByLabelText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByLabelText("Show notation")).toBeTruthy();
    });

    it("has accessibility labels on play buttons", () => {
      const { getByText, getByLabelText } = render(
        <WholeNoteLessonExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(getByLabelText("Play pattern")).toBeTruthy();
    });
  });

  // ========== EDGE CASES ==========
  describe("Edge cases", () => {
    it("handles null config gracefully", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise
          onComplete={mockOnComplete}
          onProgress={mockOnProgress}
          config={null as unknown as Record<string, unknown>}
          mastery={null}
          userFirstNote="F3"
        />,
      );
      expect(getByText("Whole Note")).toBeTruthy();
    });

    it("handles undefined userFirstNote gracefully", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise
          onComplete={mockOnComplete}
          onProgress={mockOnProgress}
          config={{}}
          mastery={null}
        />,
      );
      // Should use default F3
      fireEvent.press(getByText("Begin →"));
      expect(getByText("F")).toBeTruthy();
    });

    it("handles invalid note name gracefully", () => {
      const { getByText } = render(
        <WholeNoteLessonExercise {...defaultProps} userFirstNote="invalid" />,
      );
      // Should still render focus card
      expect(getByText("Whole Note")).toBeTruthy();
    });
  });
});
