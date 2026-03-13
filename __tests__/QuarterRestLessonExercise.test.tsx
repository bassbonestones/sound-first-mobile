/**
 * QuarterRestLessonExercise Tests
 *
 * Tests for the Quarter Rest lesson exercise component that teaches:
 * - A quarter rest = 1 beat of silence
 * - Has a distinctive squiggly shape (lightning bolt)
 * - Exercise: alternating quarter notes and quarter rests for 8 beats
 */
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import QuarterRestLessonExercise from "../src/screens/Session/components/exercises/QuarterRestLessonExercise";

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

jest.mock("../src/components/VolumeBar", () => ({
  CircularVolumeIndicator: ({
    volume,
    size,
  }: {
    volume: number;
    size: number;
  }) => null,
}));

// Mock AudioContext
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

// Mock react-native-audio-api
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

describe("QuarterRestLessonExercise", () => {
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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ===== FOCUS CARD PHASE TESTS =====
  describe("Focus Card Phase", () => {
    it("renders focus card with quarter rest title", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      expect(getByText("Quarter Rest")).toBeTruthy();
    });

    it("shows duration explanation (1 beat)", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      expect(getByText("A quarter rest = 1 beat of silence.")).toBeTruthy();
    });

    it("shows visual cue about shape", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      expect(getByText("It has a squiggly, zigzag shape.")).toBeTruthy();
    });

    it("shows lightning bolt description", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      expect(
        getByText('Sometimes called "lightning bolt" rest')
      ).toBeTruthy();
    });

    it("shows rest family comparison", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      expect(getByText("Rest family:")).toBeTruthy();
      expect(getByText("Whole")).toBeTruthy();
      expect(getByText("Half")).toBeTruthy();
      expect(getByText("Quarter")).toBeTruthy();
    });

    it("shows notation preview label", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      expect(
        getByText("On the staff (note-rest-note-rest pattern):")
      ).toBeTruthy();
    });

    it("shows Got It button", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      expect(getByText("Got It →")).toBeTruthy();
    });

    it("advances to Listen phase on Got It press", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      fireEvent.press(getByText("Got It →"));
      expect(getByText("Listen")).toBeTruthy();
    });

    it("has accessibility label on Got It button", () => {
      const { getByLabelText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      expect(getByLabelText("Continue to listen phase")).toBeTruthy();
    });
  });

  // ===== LISTEN PHASE TESTS =====
  describe("Listen Phase", () => {
    const goToListenPhase = (getByText: (text: string) => unknown) => {
      fireEvent.press(getByText("Got It →") as never);
    };

    it("shows Listen phase title", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      expect(getByText("Listen")).toBeTruthy();
    });

    it("displays target note", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      expect(getByText("F")).toBeTruthy();
    });

    it("shows listen instruction with alternating pattern", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      expect(getByText(/note-rest-note-rest \(repeat\)/)).toBeTruthy();
      expect(
        getByText(/Each beat alternates between sound and silence/)
      ).toBeTruthy();
    });

    it("shows Hear Pattern button initially", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      expect(getByText("🔊 Hear Pattern")).toBeTruthy();
    });

    it("shows mini focus card", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      expect(getByText("1 beat silence")).toBeTruthy();
    });

    it("shows playing state when pattern is played", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🔊 Hear Pattern"));
      expect(getByText("🔊 Playing...")).toBeTruthy();
    });

    it("shows I Heard It after pattern completes", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🔊 Hear Pattern"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      expect(getByText("I Heard It →")).toBeTruthy();
    });

    it("allows hearing pattern again", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🔊 Hear Pattern"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      expect(getByText("🔊 Hear Again")).toBeTruthy();
    });

    it("shows notation toggle button", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      expect(getByText("Show Notation 📝")).toBeTruthy();
    });

    it("renders with different notes - flat", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} userFirstNote="Bb3" />
      );
      goToListenPhase(getByText);
      expect(getByText(/B\s*b/)).toBeTruthy();
    });

    it("renders with different notes - sharp", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} userFirstNote="F#3" />
      );
      goToListenPhase(getByText);
      expect(getByText(/F\s*#/)).toBeTruthy();
    });
  });

  // ===== SING PHASE TESTS =====
  describe("Sing Phase", () => {
    const goToSingPhase = (getByText: (text: string) => unknown) => {
      fireEvent.press(getByText("Got It →") as never);
      fireEvent.press(getByText("🔊 Hear Pattern") as never);
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("I Heard It →") as never);
    };

    it("shows Sing phase title", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);
      expect(getByText("Sing")).toBeTruthy();
    });

    it("shows singing instruction with beat numbers", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);
      expect(
        getByText(/note \(1\) - rest \(2\) - note \(3\) - rest \(4\)/)
      ).toBeTruthy();
      expect(getByText(/Be silent on the even beats!/)).toBeTruthy();
    });

    it("shows Start Singing button", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);
      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("shows Sing Now when singing starts", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);
      fireEvent.press(getByText("🎤 Start Singing"));
      expect(getByText("🎤 Sing Now...")).toBeTruthy();
    });

    it("shows Try Again on failed attempt", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
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
        <QuarterRestLessonExercise {...defaultProps} />
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

      expect(getByText("I did it correctly →")).toBeTruthy();
    });

    it("shows pitch detection when sound is detected", () => {
      const { usePitchDetection } = require("../src/hooks/usePitchDetection");
      usePitchDetection.mockReturnValue({
        currentPitch: { noteName: "F3", frequency: 175 },
        volume: 0.5,
        isSounding: true,
      });

      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);
      expect(getByText(/Hearing/)).toBeTruthy();
    });
  });

  // ===== IMAGINE PHASE TESTS =====
  describe("Imagine Phase", () => {
    const goToImaginePhase = (
      getByText: (text: string) => unknown,
      getAllByText: (text: string) => unknown[]
    ) => {
      fireEvent.press(getByText("Got It →") as never);
      fireEvent.press(getByText("🔊 Hear Pattern") as never);
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("I Heard It →") as never);

      // Sing phase - 3 attempts then attestation
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
      fireEvent.press(getByText("I did it correctly →") as never);
      const confirmButtons = getAllByText("Confirm") as unknown[];
      fireEvent.press(confirmButtons[1] as never);
      fireEvent.press(getByText("Continue →") as never);
    };

    it("shows Imagine phase title", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("Imagine")).toBeTruthy();
    });

    it("shows imagination instruction", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText(/Imagine playing: note-rest-note-rest/)).toBeTruthy();
      expect(
        getByText(/Feel the alternating sound and silence/)
      ).toBeTruthy();
    });

    it("shows Play - Rest - Play - Rest hint", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("Play - Rest - Play - Rest")).toBeTruthy();
    });

    it("shows Count with Clicks button", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("🥁 Count with Clicks")).toBeTruthy();
    });

    it("shows I Imagined It button", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToImaginePhase(getByText, getAllByText);
      expect(getByText("I Imagined It →")).toBeTruthy();
    });

    it("transitions to Play phase when I Imagined It is pressed", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToImaginePhase(getByText, getAllByText);
      fireEvent.press(getByText("I Imagined It →"));
      expect(getByText("Play")).toBeTruthy();
    });

    it("plays metronome clicks when Count with Clicks is pressed", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToImaginePhase(getByText, getAllByText);
      fireEvent.press(getByText("🥁 Count with Clicks"));
      expect(getByText("🥁 Counting...")).toBeTruthy();
    });
  });

  // ===== PLAY PHASE TESTS =====
  describe("Play Phase", () => {
    const goToPlayPhase = (
      getByText: (text: string) => unknown,
      getAllByText: (text: string) => unknown[]
    ) => {
      fireEvent.press(getByText("Got It →") as never);
      fireEvent.press(getByText("🔊 Hear Pattern") as never);
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

    it("shows Play phase title", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToPlayPhase(getByText, getAllByText);
      expect(getByText("Play")).toBeTruthy();
    });

    it("shows play instruction with beat pattern", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToPlayPhase(getByText, getAllByText);
      expect(
        getByText(/note \(1\) - rest \(2\) - note \(3\) - rest \(4\)/)
      ).toBeTruthy();
      expect(getByText(/Two measures of alternating pattern/)).toBeTruthy();
    });

    it("shows target note in Play phase", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToPlayPhase(getByText, getAllByText);
      expect(getByText("F")).toBeTruthy();
    });

    it("shows Start Playing button", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToPlayPhase(getByText, getAllByText);
      expect(getByText("🎵 Start Playing")).toBeTruthy();
    });

    it("shows Try Again on failed play attempt", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToPlayPhase(getByText, getAllByText);
      fireEvent.press(getByText("🎵 Start Playing"));
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      expect(getByText("Try Again")).toBeTruthy();
    });

    it("shows attestation button after 3 failed play attempts", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToPlayPhase(getByText, getAllByText);

      // First attempt
      fireEvent.press(getByText("🎵 Start Playing"));
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

      expect(getByText("I did it correctly →")).toBeTruthy();
    });
  });

  // ===== ATTESTATION MODAL TESTS =====
  describe("Attestation Modal", () => {
    const goToSingPhase = (getByText: (text: string) => unknown) => {
      fireEvent.press(getByText("Got It →") as never);
      fireEvent.press(getByText("🔊 Hear Pattern") as never);
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      fireEvent.press(getByText("I Heard It →") as never);
    };

    it("opens modal when attestation button pressed", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);

      // 3 failed attempts
      for (let i = 0; i < 3; i++) {
        const btn = i === 0 ? "🎤 Start Singing" : "Try Again";
        fireEvent.press(getByText(btn));
        act(() => {
          jest.advanceTimersByTime(20000);
        });
      }

      fireEvent.press(getByText("I did it correctly →"));

      // Modal should be visible
      const confirmElements = getAllByText("Confirm");
      expect(confirmElements.length).toBeGreaterThanOrEqual(1);
    });

    it("shows attestation text in modal", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);

      for (let i = 0; i < 3; i++) {
        const btn = i === 0 ? "🎤 Start Singing" : "Try Again";
        fireEvent.press(getByText(btn));
        act(() => {
          jest.advanceTimersByTime(20000);
        });
      }

      fireEvent.press(getByText("I did it correctly →"));
      expect(getByText(/I attest that I sang this correctly/)).toBeTruthy();
    });

    it("closes modal on Cancel", () => {
      const { getByText, queryByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);

      for (let i = 0; i < 3; i++) {
        const btn = i === 0 ? "🎤 Start Singing" : "Try Again";
        fireEvent.press(getByText(btn));
        act(() => {
          jest.advanceTimersByTime(20000);
        });
      }

      fireEvent.press(getByText("I did it correctly →"));
      fireEvent.press(getByText("Cancel"));

      expect(queryByText(/I attest that I sang/)).toBeNull();
    });

    it("marks success on Confirm", () => {
      const { getByText, getAllByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToSingPhase(getByText);

      for (let i = 0; i < 3; i++) {
        const btn = i === 0 ? "🎤 Start Singing" : "Try Again";
        fireEvent.press(getByText(btn));
        act(() => {
          jest.advanceTimersByTime(20000);
        });
      }

      fireEvent.press(getByText("I did it correctly →"));

      const confirmElements = getAllByText("Confirm");
      fireEvent.press(confirmElements[1]);

      expect(getByText("Continue →")).toBeTruthy();
    });
  });

  // ===== BEAT INDICATOR TESTS =====
  describe("Beat Indicator", () => {
    const goToListenPhase = (getByText: (text: string) => unknown) => {
      fireEvent.press(getByText("Got It →") as never);
    };

    it("shows count-in row during playback", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🔊 Hear Pattern"));
      expect(getByText("Count in:")).toBeTruthy();
    });

    it("shows Play: label during playback", () => {
      const { getByText } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      goToListenPhase(getByText);
      fireEvent.press(getByText("🔊 Hear Pattern"));
      expect(getByText("Play:")).toBeTruthy();
    });
  });

  // ===== CONFIG TESTS =====
  describe("Configuration", () => {
    it("uses provided BPM", () => {
      const customProps = {
        ...defaultProps,
        config: { ...defaultProps.config, bpm: 120 },
      };
      const { getByText } = render(
        <QuarterRestLessonExercise {...customProps} />
      );
      expect(getByText("Quarter Rest")).toBeTruthy();
    });

    it("uses provided clef", () => {
      const customProps = {
        ...defaultProps,
        config: { ...defaultProps.config, clef: "bass" },
      };
      const { getByText } = render(
        <QuarterRestLessonExercise {...customProps} />
      );
      expect(getByText("Quarter Rest")).toBeTruthy();
    });

    it("handles different user first notes", () => {
      const customProps = {
        ...defaultProps,
        userFirstNote: "G4",
      };
      const { getByText } = render(
        <QuarterRestLessonExercise {...customProps} />
      );
      fireEvent.press(getByText("Got It →"));
      expect(getByText("G")).toBeTruthy();
    });
  });

  // ===== NOTATION TESTS =====
  describe("Notation Display", () => {
    it("shows notation when toggle pressed", () => {
      const { getByText, getByTestId } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      fireEvent.press(getByText("Got It →"));
      fireEvent.press(getByText("Show Notation 📝"));
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("hides notation when Hide Notation pressed", () => {
      const { getByText, queryByTestId } = render(
        <QuarterRestLessonExercise {...defaultProps} />
      );
      fireEvent.press(getByText("Got It →"));
      fireEvent.press(getByText("Show Notation 📝"));
      fireEvent.press(getByText("Hide Notation"));
      expect(queryByTestId("notation-display")).toBeNull();
    });
  });

  // ===== EDGE CASES =====
  describe("Edge Cases", () => {
    it("handles missing config gracefully", () => {
      const props = { ...defaultProps, config: undefined };
      const { getByText } = render(<QuarterRestLessonExercise {...props} />);
      expect(getByText("Quarter Rest")).toBeTruthy();
    });

    it("handles missing mastery gracefully", () => {
      const props = { ...defaultProps, mastery: undefined };
      const { getByText } = render(<QuarterRestLessonExercise {...props} />);
      expect(getByText("Quarter Rest")).toBeTruthy();
    });

    it("handles missing callbacks gracefully", () => {
      const props = {
        ...defaultProps,
        onComplete: undefined,
        onProgress: undefined,
      };
      const { getByText } = render(<QuarterRestLessonExercise {...props} />);
      expect(getByText("Quarter Rest")).toBeTruthy();
    });

    it("handles default userFirstNote when not provided", () => {
      const props = { ...defaultProps, userFirstNote: undefined };
      const { getByText } = render(<QuarterRestLessonExercise {...props} />);
      fireEvent.press(getByText("Got It →"));
      expect(getByText("F")).toBeTruthy();
    });
  });

  // ===== PROGRESS CALLBACK TESTS =====
  describe("Progress Callbacks", () => {
    it("calls onProgress with streak info", () => {
      render(<QuarterRestLessonExercise {...defaultProps} />);
      expect(defaultProps.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          streak: expect.any(Number),
          masteryRequired: expect.any(Number),
        })
      );
    });
  });
});
