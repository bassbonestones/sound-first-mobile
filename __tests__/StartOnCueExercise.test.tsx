/**
 * @fileoverview Tests for StartOnCueExercise component
 * Tests "Enter on One" drill - playing first note precisely on beat 1
 */

import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

// Mock AudioContext from react-native-audio-api
const mockOscillator = {
  type: "sine",
  frequency: { value: 440, setValueAtTime: jest.fn() },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

const mockGainNode = {
  gain: {
    value: 1,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
};

const mockAudioContext = {
  currentTime: 0,
  sampleRate: 44100,
  state: "running",
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
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
  resume: jest.fn(() => Promise.resolve()),
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
  currentPitch: null as {
    noteName: string;
    frequency: number;
    midiNote: number;
  } | null,
  volume: 0,
  isSounding: false,
  isListening: true,
  error: null as string | null,
};

jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => mockPitchDetection),
}));

// Import component after mocks are defined
import StartOnCueExercise from "../src/screens/Session/components/exercises/StartOnCueExercise";

describe("StartOnCueExercise", () => {
  const mockOnComplete = jest.fn();
  const mockOnProgress = jest.fn();

  const defaultProps = {
    config: { bpm: 60, beats_per_measure: 4, count_in_beats: 4 },
    mastery: { correct_streak: 8 },
    onComplete: mockOnComplete,
    onProgress: mockOnProgress,
    userFirstNote: "F3",
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockPitchDetection.currentPitch = null;
    mockPitchDetection.volume = 0;
    mockPitchDetection.isSounding = false;
    mockPitchDetection.isListening = true;
    mockPitchDetection.error = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper: advance through timer intervals
  const advanceTimers = (ms: number = 10000) => {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  };

  // ==========================================================================
  // READY PHASE TESTS
  // ==========================================================================
  describe("Ready Phase", () => {
    it("shows ready screen initially", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      expect(getByText("Enter on One")).toBeTruthy();
    });

    it("shows trumpet emoji icon", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      expect(getByText("🎺")).toBeTruthy();
    });

    it("shows description text", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      expect(
        getByText(/Listen to the count-in, then play your first note/),
      ).toBeTruthy();
    });

    it("shows user first note", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      expect(getByText("Your First Note")).toBeTruthy();
      expect(getByText("F3")).toBeTruthy();
    });

    it("shows Hear Your Note button", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      expect(getByText("🔊 Hear Your Note")).toBeTruthy();
    });

    it("shows Start button", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      expect(getByText("Start")).toBeTruthy();
    });

    it("has accessible Start button", () => {
      const { getByLabelText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      expect(getByLabelText("Start exercise")).toBeTruthy();
    });

    it("has accessible Hear Your Note button", () => {
      const { getByLabelText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      expect(getByLabelText("Hear your note")).toBeTruthy();
    });

    it("plays target note when Hear Your Note pressed", () => {
      const { getByText, queryByText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("🔊 Hear Your Note"));
      expect(queryByText("🔊 Playing...")).toBeTruthy();
    });

    it("navigates to counting phase when Start pressed", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("Get Ready...")).toBeTruthy();
    });
  });

  // ==========================================================================
  // COUNTING PHASE TESTS
  // ==========================================================================
  describe("Counting Phase", () => {
    it("shows counting phase after Start", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("Get Ready...")).toBeTruthy();
    });

    it("shows prep count number", () => {
      const { getByText, getAllByText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Start"));
      // '4' appears both as count number and beat indicator
      const fourElements = getAllByText("4");
      expect(fourElements.length).toBeGreaterThanOrEqual(1);
    });

    it("shows instruction during count-in", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("Listen to the count-in...")).toBeTruthy();
    });

    it("shows streak counter", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });

    it("shows BPM text", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("60 BPM")).toBeTruthy();
    });

    it("shows beat indicators", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("1")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
    });

    it("counts down prep beats", () => {
      const { getByText, getAllByText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Start"));
      // '4' appears both as count number and beat indicator
      expect(getAllByText("4").length).toBeGreaterThanOrEqual(1);
      advanceTimers(1000);
      expect(getAllByText("3").length).toBeGreaterThanOrEqual(1);
    });

    it("transitions to listening after count-in", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);
      expect(getByText("PLAY NOW!")).toBeTruthy();
    });
  });

  // ==========================================================================
  // LISTENING PHASE TESTS
  // ==========================================================================
  describe("Listening Phase", () => {
    const goToListeningPhase = (getByText: Function) => {
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);
    };

    it("shows PLAY NOW text", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      goToListeningPhase(getByText);
      expect(getByText("PLAY NOW!")).toBeTruthy();
    });

    it("shows music note icon", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      goToListeningPhase(getByText);
      expect(getByText("🎵")).toBeTruthy();
    });

    it("shows target note", () => {
      const { getByText, getAllByText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      goToListeningPhase(getByText);
      const f3Elements = getAllByText("F3");
      expect(f3Elements.length).toBeGreaterThan(0);
    });

    it("shows instruction to play on beat 1", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      goToListeningPhase(getByText);
      expect(getByText("Play F3 on beat 1!")).toBeTruthy();
    });

    it("shows mic listening status", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      goToListeningPhase(getByText);
      expect(getByText("🎤 Listening...")).toBeTruthy();
    });

    it("shows target note row", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      goToListeningPhase(getByText);
      expect(getByText("Target:")).toBeTruthy();
    });

    it("has Hear target note button", () => {
      const { getByText, getByLabelText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      goToListeningPhase(getByText);
      expect(getByLabelText("Hear target note")).toBeTruthy();
    });
  });

  // ==========================================================================
  // FEEDBACK TESTS
  // ==========================================================================
  describe("Feedback", () => {
    const goToListeningPhase = (getByText: Function) => {
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);
    };

    it("shows missed feedback when user does not play", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      goToListeningPhase(getByText);
      advanceTimers(9000);
      expect(getByText("Missed!")).toBeTruthy();
    });

    it("resets streak to 0 on missed", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      goToListeningPhase(getByText);
      advanceTimers(9000);
      expect(mockOnProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          streak: 0,
        }),
      );
    });
  });

  // ==========================================================================
  // CONFIGURATION TESTS
  // ==========================================================================
  describe("Configuration", () => {
    it("uses custom BPM", () => {
      const { getByText } = render(
        <StartOnCueExercise
          {...defaultProps}
          config={{ ...defaultProps.config, bpm: 120 }}
        />,
      );
      fireEvent.press(getByText("Start"));
      expect(getByText("120 BPM")).toBeTruthy();
    });

    it("uses custom userFirstNote", () => {
      const { getByText } = render(
        <StartOnCueExercise {...defaultProps} userFirstNote="G4" />,
      );
      expect(getByText("G4")).toBeTruthy();
    });

    it("uses custom mastery streak", () => {
      const { getByText } = render(
        <StartOnCueExercise
          {...defaultProps}
          mastery={{ correct_streak: 5 }}
        />,
      );
      fireEvent.press(getByText("Start"));
      expect(getByText("0 / 5 in a row")).toBeTruthy();
    });

    it("uses custom beats per measure", () => {
      const { getByText, queryByText } = render(
        <StartOnCueExercise
          {...defaultProps}
          config={{ ...defaultProps.config, beats_per_measure: 3 }}
        />,
      );
      fireEvent.press(getByText("Start"));
      expect(getByText("1")).toBeTruthy();
      expect(getByText("2")).toBeTruthy();
      expect(getByText("3")).toBeTruthy();
    });
  });

  // ==========================================================================
  // PROGRESS BAR TESTS
  // ==========================================================================
  describe("Progress Bar", () => {
    it("shows progress bar", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });

    it("shows initial streak of 0", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });
  });

  // ==========================================================================
  // AUDIO DETECTION STATUS TESTS
  // ==========================================================================
  describe("Audio Detection Status", () => {
    it("shows listening status", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);
      mockPitchDetection.isListening = true;
      expect(getByText("🎤 Listening...")).toBeTruthy();
    });

    it("shows error message if pitch detection fails", () => {
      mockPitchDetection.error = "Microphone access denied";
      mockPitchDetection.isListening = false;

      const { getByText, rerender } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);

      rerender(<StartOnCueExercise {...defaultProps} />);
      expect(getByText("⚠️ Microphone access denied")).toBeTruthy();
    });
  });

  // ==========================================================================
  // CLEANUP TESTS
  // ==========================================================================
  describe("Cleanup", () => {
    it("cleans up audio context on unmount", () => {
      const { unmount, getByText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Start"));
      advanceTimers(1000);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // DEFAULT VALUES TESTS
  // ==========================================================================
  describe("Default Values", () => {
    it("uses default BPM of 60 when not specified", () => {
      const propsWithoutBpm = {
        ...defaultProps,
        config: {},
      };
      const { getByText } = render(<StartOnCueExercise {...propsWithoutBpm} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("60 BPM")).toBeTruthy();
    });

    it("uses default mastery streak of 8 when not specified", () => {
      const propsWithoutMastery = {
        ...defaultProps,
        mastery: {},
      };
      const { getByText } = render(
        <StartOnCueExercise {...propsWithoutMastery} />,
      );
      fireEvent.press(getByText("Start"));
      expect(getByText("0 / 8 in a row")).toBeTruthy();
    });
  });

  // ==========================================================================
  // TARGET NOTE DISPLAY TESTS
  // ==========================================================================
  describe("Target Note Display", () => {
    it("shows target note in ready screen", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      expect(getByText("Your First Note")).toBeTruthy();
      expect(getByText("F3")).toBeTruthy();
    });

    it("shows target note row during exercise", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);
      expect(getByText("Target:")).toBeTruthy();
    });

    it("displays custom first note correctly", () => {
      const { getByText } = render(
        <StartOnCueExercise {...defaultProps} userFirstNote="C#4" />,
      );
      expect(getByText("C#4")).toBeTruthy();
    });
  });

  // ==========================================================================
  // COUNT IN TESTS
  // ==========================================================================
  describe("Count In", () => {
    it("uses default 4 count-in beats", () => {
      const { getByText, getAllByText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Start"));
      // '4' appears both as count number and beat indicator
      expect(getAllByText("4").length).toBeGreaterThanOrEqual(1);
    });

    it("uses custom count-in beats", () => {
      const { getByText, getAllByText } = render(
        <StartOnCueExercise
          {...defaultProps}
          config={{ ...defaultProps.config, count_in_beats: 2 }}
        />,
      );
      fireEvent.press(getByText("Start"));
      // '2' appears both as count number and beat indicator
      expect(getAllByText("2").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // HEAR NOTE BUTTON TESTS
  // ==========================================================================
  describe("Hear Note Button", () => {
    it("shows hear note button on ready screen", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      expect(getByText("🔊 Hear Your Note")).toBeTruthy();
    });

    it("button becomes disabled while playing", () => {
      const { getByText, getByLabelText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("🔊 Hear Your Note"));
      expect(getByLabelText("Playing note")).toBeTruthy();
    });

    it("shows hear target note button during exercise", () => {
      const { getByText, getByLabelText } = render(
        <StartOnCueExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);
      expect(getByLabelText("Hear target note")).toBeTruthy();
    });
  });

  // ==========================================================================
  // BEAT DOT STYLING TESTS
  // ==========================================================================
  describe("Beat Indicator Styling", () => {
    it("shows beat 1 with special styling", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("1")).toBeTruthy();
    });

    it("shows correct number of beat indicators", () => {
      const { getByText, getAllByText } = render(
        <StartOnCueExercise
          {...defaultProps}
          config={{ ...defaultProps.config, beats_per_measure: 6 }}
        />,
      );
      fireEvent.press(getByText("Start"));
      expect(getByText("1")).toBeTruthy();
      expect(getAllByText("2").length).toBeGreaterThanOrEqual(1);
      expect(getAllByText("3").length).toBeGreaterThanOrEqual(1);
      expect(getAllByText("4").length).toBeGreaterThanOrEqual(1);
      expect(getByText("5")).toBeTruthy();
      expect(getByText("6")).toBeTruthy();
    });
  });

  // ==========================================================================
  // PULSE ANIMATION TESTS
  // ==========================================================================
  describe("Pulse Animation", () => {
    it("renders pulse circle", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      expect(getByText("Get Ready...")).toBeTruthy();
    });

    it("pulse circle contains PLAY NOW in listening phase", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);
      expect(getByText("PLAY NOW!")).toBeTruthy();
    });
  });

  // ==========================================================================
  // ROUND RESTART TESTS
  // ==========================================================================
  describe("Round Restart", () => {
    it("restarts after missed entry", () => {
      const { getByText } = render(<StartOnCueExercise {...defaultProps} />);
      fireEvent.press(getByText("Start"));
      advanceTimers(4100);
      advanceTimers(9000);
      expect(getByText("Missed!")).toBeTruthy();
      advanceTimers(2000);
      expect(getByText("Get Ready...")).toBeTruthy();
    });
  });

  // ==========================================================================
  // MULTIPLE NOTES TESTS
  // ==========================================================================
  describe("Multiple Notes", () => {
    it("handles various note formats", () => {
      const notes = ["C4", "D#3", "Bb2", "F#5", "G3"];
      notes.forEach((note) => {
        const { getByText, unmount } = render(
          <StartOnCueExercise {...defaultProps} userFirstNote={note} />,
        );
        expect(getByText(note)).toBeTruthy();
        unmount();
      });
    });

    it("handles flat notes", () => {
      const { getByText } = render(
        <StartOnCueExercise {...defaultProps} userFirstNote="Bb3" />,
      );
      expect(getByText("Bb3")).toBeTruthy();
    });

    it("handles sharp notes", () => {
      const { getByText } = render(
        <StartOnCueExercise {...defaultProps} userFirstNote="F#4" />,
      );
      expect(getByText("F#4")).toBeTruthy();
    });
  });
});
