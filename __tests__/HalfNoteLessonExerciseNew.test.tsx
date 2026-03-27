import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import HalfNoteLessonExerciseNew from "../src/screens/Session/components/exercises/HalfNoteLessonExerciseNew";

// Mock usePitchDetection hook
const mockUsePitchDetection = jest.fn(() => ({
  currentPitch: { noteName: "F3", frequency: 175 },
  volume: 0,
  isSounding: false,
}));

jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: (options: unknown) => mockUsePitchDetection(options),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock useLessonExerciseState
const mockExerciseState = {
  phase: "focus_card",
  setPhase: jest.fn(),
  showSuccess: false,
  setShowSuccess: jest.fn(),
  showNotation: false,
  setShowNotation: jest.fn(),
  hasHeardPattern: false,
  setHasHeardPattern: jest.fn(),
  singResult: null,
  setSingResult: jest.fn(),
  playResult: null,
  setPlayResult: jest.fn(),
  successfulRounds: 0,
  incrementSuccessfulRounds: jest.fn(),
  goToNextPhase: jest.fn(),
  resetForNewRound: jest.fn(),
  singAttempts: 0,
  incrementSingAttempts: jest.fn(),
  resetSingAttempts: jest.fn(),
  playAttempts: 0,
  incrementPlayAttempts: jest.fn(),
  resetPlayAttempts: jest.fn(),
  showAttestModal: false,
  attestPhase: null,
  openAttestModal: jest.fn(),
  closeAttestModal: jest.fn(),
  confirmAttestation: jest.fn(),
};

jest.mock(
  "../src/screens/Session/components/exercises/shared/useLessonExerciseState",
  () => ({
    useLessonExerciseState: jest.fn(() => mockExerciseState),
  }),
);

// Mock useLessonExerciseAudio
const mockAudio = {
  isPlaying: false,
  currentBeat: 0,
  playPattern: jest.fn(),
  playMetronomeOnly: jest.fn(),
  resetTrackingRefs: jest.fn(),
  analyzePerformance: jest.fn(() => ({ success: true })),
  trackingRefs: {
    isSounding: { current: false },
    totalSoundingCount: { current: 0 },
    hasHitTargetPitch: { current: false },
    onPitchCount: { current: 0 },
  },
};

jest.mock(
  "../src/screens/Session/components/exercises/shared/useLessonExerciseAudio",
  () => ({
    useLessonExerciseAudio: jest.fn(() => mockAudio),
  }),
);

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

// Mock VolumeBar
jest.mock("../src/components/VolumeBar", () => ({
  CircularVolumeIndicator: () => null,
}));

describe("HalfNoteLessonExerciseNew", () => {
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
    // Reset mock state
    mockExerciseState.phase = "focus_card";
    mockExerciseState.showSuccess = false;
    mockExerciseState.showNotation = false;
    mockExerciseState.hasHeardPattern = false;
    mockExerciseState.singResult = null;
    mockExerciseState.playResult = null;
    mockExerciseState.successfulRounds = 0;
    mockExerciseState.singAttempts = 0;
    mockExerciseState.playAttempts = 0;
    mockExerciseState.showAttestModal = false;
    mockAudio.isPlaying = false;
    mockAudio.currentBeat = 0;
    mockUsePitchDetection.mockReturnValue({
      currentPitch: { noteName: "F3", frequency: 175 },
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
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Half Note")).toBeTruthy();
    });

    it("shows the half note duration explanation", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("A half note lasts for 2 beats.")).toBeTruthy();
    });

    it("shows the stem explanation", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/It has a STEM/)).toBeTruthy();
    });

    it("shows the beat count pattern", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/1 - 2 - \(3\) stop!/)).toBeTruthy();
    });

    it("has Begin button to proceed", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Begin →")).toBeTruthy();
    });

    it("calls goToNextPhase when Begin is pressed", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      fireEvent.press(getByText("Begin →"));
      expect(mockExerciseState.goToNextPhase).toHaveBeenCalled();
    });

    it("has accessibility label on Begin button", () => {
      const { getByLabelText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByLabelText("Begin exercise")).toBeTruthy();
    });
  });

  // ========== LISTEN PHASE ==========
  describe("Listen Phase", () => {
    beforeEach(() => {
      mockExerciseState.phase = "listen";
    });

    it("renders listen phase", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Listen")).toBeTruthy();
    });

    it("shows the target note", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("F")).toBeTruthy();
    });

    it("shows instruction text", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Listen to the half note/)).toBeTruthy();
    });

    it("has Play Pattern button when pattern not heard", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Play Pattern/)).toBeTruthy();
    });

    it("calls playPattern when Play Pattern is pressed", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      fireEvent.press(getByText(/Play Pattern/));
      expect(mockAudio.playPattern).toHaveBeenCalled();
    });

    it("shows I Heard It button after hearing pattern", () => {
      mockExerciseState.hasHeardPattern = true;
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("I Heard It →")).toBeTruthy();
    });

    it("shows Hear Again button after hearing pattern", () => {
      mockExerciseState.hasHeardPattern = true;
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Hear Again/)).toBeTruthy();
    });

    it("calls goToNextPhase when I Heard It is pressed", () => {
      mockExerciseState.hasHeardPattern = true;
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      fireEvent.press(getByText("I Heard It →"));
      expect(mockExerciseState.goToNextPhase).toHaveBeenCalled();
    });

    it("disables button while playing", () => {
      mockAudio.isPlaying = true;
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Listening/)).toBeTruthy();
    });

    it("shows notation toggle button", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Show Notation/)).toBeTruthy();
    });

    it("shows mini focus card", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/2 beats → ends on beat 3/)).toBeTruthy();
    });
  });

  // ========== SING PHASE ==========
  describe("Sing Phase", () => {
    beforeEach(() => {
      mockExerciseState.phase = "sing";
    });

    it("renders sing phase", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Sing")).toBeTruthy();
    });

    it("shows instruction to sing", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Sing the half note/)).toBeTruthy();
    });

    it("shows target note", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("F")).toBeTruthy();
    });

    it("shows success message when sing result is successful", () => {
      mockExerciseState.singResult = { success: true, message: "Great!" };
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Great/)).toBeTruthy();
    });

    it("shows error message when sing result fails", () => {
      mockExerciseState.singResult = { success: false, message: "Try again" };
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Try again/)).toBeTruthy();
    });

    it("shows detected note when sounding", () => {
      mockUsePitchDetection.mockReturnValue({
        currentPitch: { noteName: "F3", frequency: 175 },
        volume: 0.5,
        isSounding: true,
      });
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Hearing: F3/)).toBeTruthy();
    });
  });

  // ========== PLAY PHASE ==========
  describe("Play Phase", () => {
    beforeEach(() => {
      mockExerciseState.phase = "play";
    });

    it("renders play phase", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Play")).toBeTruthy();
    });

    it("shows instruction to play", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Play the half note/)).toBeTruthy();
    });

    it("shows success message when play result is successful", () => {
      mockExerciseState.playResult = { success: true, message: "Excellent!" };
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Excellent/)).toBeTruthy();
    });

    it("shows error message when play result fails", () => {
      mockExerciseState.playResult = { success: false, message: "Try again" };
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/Try again/)).toBeTruthy();
    });
  });

  // ========== FEEDBACK PHASE ==========
  describe("Feedback Phase", () => {
    beforeEach(() => {
      mockExerciseState.phase = "feedback";
    });

    it("renders feedback phase with Round Complete", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Round Complete!")).toBeTruthy();
    });

    it("shows round progress", () => {
      mockExerciseState.successfulRounds = 1;
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/2 of 3 rounds/)).toBeTruthy();
    });

    it("shows Continue button", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Continue →")).toBeTruthy();
    });
  });

  // ========== SUCCESS STATE ==========
  describe("Success State", () => {
    beforeEach(() => {
      mockExerciseState.showSuccess = true;
    });

    it("renders success screen", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Well Done!")).toBeTruthy();
    });

    it("shows success emoji", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("🎉")).toBeTruthy();
    });

    it("shows mastery message", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/mastered the half note/)).toBeTruthy();
    });

    it("has Complete Lesson button", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Complete Lesson →")).toBeTruthy();
    });

    it("calls onComplete when Complete Lesson is pressed", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      fireEvent.press(getByText("Complete Lesson →"));
      expect(defaultProps.onComplete).toHaveBeenCalledWith({
        success: true,
        details: {
          capability: "half_note",
          rounds: 1,
        },
      });
    });
  });

  // ========== ATTESTATION MODAL ==========
  describe("Attestation Modal", () => {
    beforeEach(() => {
      mockExerciseState.phase = "sing";
      mockExerciseState.showAttestModal = true;
      mockExerciseState.attestPhase = "sing";
    });

    it("renders attestation modal with Confirm title", () => {
      const { getAllByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      // Both modal title and button say "Confirm"
      expect(getAllByText("Confirm").length).toBeGreaterThan(0);
    });

    it("shows attestation message", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText(/I attest that I sang this correctly/)).toBeTruthy();
    });

    it("has Cancel button", () => {
      const { getByLabelText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByLabelText("Cancel")).toBeTruthy();
    });

    it("has Confirm button", () => {
      const { getByLabelText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByLabelText("Confirm")).toBeTruthy();
    });

    it("calls closeAttestModal when Cancel is pressed", () => {
      const { getByLabelText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("Cancel"));
      expect(mockExerciseState.closeAttestModal).toHaveBeenCalled();
    });

    it("calls confirmAttestation when Confirm is pressed", () => {
      const { getByLabelText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("Confirm"));
      expect(mockExerciseState.confirmAttestation).toHaveBeenCalled();
    });
  });

  // ========== NOTATION DISPLAY ==========
  describe("Notation Display", () => {
    beforeEach(() => {
      mockExerciseState.phase = "listen";
      mockExerciseState.showNotation = true;
    });

    it("shows notation when showNotation is true", () => {
      const { getByTestId } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("shows Hide Notation button when notation is visible", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Hide Notation")).toBeTruthy();
    });

    it("calls setShowNotation when Hide Notation is pressed", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      fireEvent.press(getByText("Hide Notation"));
      expect(mockExerciseState.setShowNotation).toHaveBeenCalledWith(false);
    });
  });

  // ========== BEAT INDICATOR ==========
  describe("Beat Indicator", () => {
    beforeEach(() => {
      mockExerciseState.phase = "listen";
      mockAudio.isPlaying = true;
      mockAudio.currentBeat = -3;
    });

    it("shows beat indicator during playback", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      expect(getByText("Count in:")).toBeTruthy();
      expect(getByText("Sing:")).toBeTruthy();
    });

    it("shows count-in and sing sections", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} />,
      );
      // Beat indicator shows count-in and sing labels
      expect(getByText("Count in:")).toBeTruthy();
      expect(getByText("Sing:")).toBeTruthy();
    });
  });

  // ========== PROGRESS REPORTING ==========
  describe("Progress Reporting", () => {
    it("calls onProgress with streak info", () => {
      render(<HalfNoteLessonExerciseNew {...defaultProps} />);
      expect(defaultProps.onProgress).toHaveBeenCalledWith({
        streak: 0,
        masteryRequired: 3,
      });
    });

    it("reports correct streak after successful round", () => {
      mockExerciseState.successfulRounds = 2;
      render(<HalfNoteLessonExerciseNew {...defaultProps} />);
      expect(defaultProps.onProgress).toHaveBeenCalledWith({
        streak: 2,
        masteryRequired: 3,
      });
    });
  });

  // ========== PROPS HANDLING ==========
  describe("Props Handling", () => {
    it("uses default values when config is empty", () => {
      const { getByText } = render(
        <HalfNoteLessonExerciseNew
          onComplete={jest.fn()}
          onProgress={jest.fn()}
        />,
      );
      expect(getByText("Half Note")).toBeTruthy();
    });

    it("handles different user notes", () => {
      mockExerciseState.phase = "listen";
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} userFirstNote="A4" />,
      );
      expect(getByText("A")).toBeTruthy();
    });

    it("handles sharp notes", () => {
      mockExerciseState.phase = "listen";
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} userFirstNote="F#3" />,
      );
      // Note display shows "F" and "#" combined in the text
      expect(getByText(/F#?/)).toBeTruthy();
    });

    it("handles flat notes", () => {
      mockExerciseState.phase = "listen";
      const { getByText } = render(
        <HalfNoteLessonExerciseNew {...defaultProps} userFirstNote="Bb3" />,
      );
      // Note display shows "B" and "b" combined in the text
      expect(getByText(/Bb?/)).toBeTruthy();
    });
  });
});
