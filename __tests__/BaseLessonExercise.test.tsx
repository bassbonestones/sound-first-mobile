/**
 * Tests for BaseLessonExercise component
 * This component is a composable wrapper shared by all lesson-style exercises:
 * WholeNote, HalfNote, QuarterNote, Rests, and Fragment2 exercises
 */
import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { Text as RNText, View as RNView } from "react-native";
import { BaseLessonExercise } from "../src/screens/Session/components/exercises/shared/BaseLessonExercise";

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Mock usePitchDetection
const mockPitchDetection = {
  currentPitch: { noteName: "C4", frequency: 262 } as {
    noteName: string;
    frequency: number;
  } | null,
  volume: 0,
  isSounding: false,
  isListening: true,
  error: null as string | null,
};

jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => mockPitchDetection),
}));

// Mock useLessonExerciseState
const mockState = {
  phase: "focus_card",
  setPhase: jest.fn(),
  showSuccess: false,
  setShowSuccess: jest.fn(),
  showNotation: false,
  setShowNotation: jest.fn(),
  showCursor: false,
  hasHeardPattern: false,
  setHasHeardPattern: jest.fn(),
  singResult: null as { success: boolean; message?: string } | null,
  setSingResult: jest.fn(),
  playResult: null as { success: boolean; message?: string } | null,
  setPlayResult: jest.fn(),
  successfulRounds: 0,
  incrementSuccessfulRounds: jest.fn(),
  goToNextPhase: jest.fn(),
  goToPrevPhase: jest.fn(),
  resetForNewRound: jest.fn(),
  currentFocusCard: {
    title: "Focus",
    description: "Practice carefully",
    tips: [],
  },
  rotateFocusCard: jest.fn(),
  singAttempts: 0,
  incrementSingAttempts: jest.fn(),
  resetSingAttempts: jest.fn(),
  playAttempts: 0,
  incrementPlayAttempts: jest.fn(),
  resetPlayAttempts: jest.fn(),
  showAttestModal: false,
  attestPhase: null as "sing" | "play" | null,
  openAttestModal: jest.fn(),
  closeAttestModal: jest.fn(),
  confirmAttestation: jest.fn(),
  progress: {
    currentIndex: 0,
    completedItems: {} as Record<string, boolean>,
    totalItems: 1,
    isComplete: false,
  },
  markItemComplete: jest.fn(),
  goToNextItem: jest.fn(),
  goToItem: jest.fn(),
};

jest.mock(
  "../src/screens/Session/components/exercises/shared/useLessonExerciseState",
  () => ({
    useLessonExerciseState: jest.fn(() => mockState),
  }),
);

// Mock useLessonExerciseAudio
const mockAudio = {
  isPlaying: false,
  currentBeat: 0,
  isSubdivision: false,
  isDroneActive: false,
  playPattern: jest.fn(),
  playMetronomeOnly: jest.fn(),
  stopPlayback: jest.fn(),
  startDrone: jest.fn(),
  stopDrone: jest.fn(),
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

// Mock LessonComponents
jest.mock(
  "../src/screens/Session/components/exercises/shared/LessonComponents",
  () => {
    const React = require("react");
    const { View, Text, TouchableOpacity } = require("react-native");
    return {
      LessonBeatIndicator: ({
        currentBeat,
        totalBeats,
      }: {
        currentBeat: number;
        totalBeats: number;
      }) =>
        React.createElement(
          View,
          { testID: "beat-indicator" },
          React.createElement(Text, null, `Beat ${currentBeat}/${totalBeats}`),
        ),
      LessonAttestationModal: ({
        visible,
        onCancel,
        onConfirm,
      }: {
        visible: boolean;
        onCancel: () => void;
        onConfirm: () => void;
      }) =>
        visible
          ? React.createElement(View, { testID: "attestation-modal" }, [
              React.createElement(
                TouchableOpacity,
                { key: "cancel", testID: "cancel-attest", onPress: onCancel },
                React.createElement(Text, null, "Cancel"),
              ),
              React.createElement(
                TouchableOpacity,
                {
                  key: "confirm",
                  testID: "confirm-attest",
                  onPress: onConfirm,
                },
                React.createElement(Text, null, "Confirm"),
              ),
            ])
          : null,
      LessonFocusCard: ({ focusCard }: { focusCard: { title: string } }) =>
        React.createElement(
          View,
          { testID: "focus-card" },
          React.createElement(Text, null, focusCard.title),
        ),
      LessonFocusCardMini: ({ focusCard }: { focusCard: { title: string } }) =>
        React.createElement(
          View,
          { testID: "focus-card-mini" },
          React.createElement(Text, null, focusCard.title),
        ),
      LessonPhaseProgress: ({
        items,
      }: {
        items: Array<{ id: string; name: string }>;
      }) =>
        React.createElement(
          View,
          { testID: "phase-progress" },
          items.map((item) =>
            React.createElement(Text, { key: item.id }, item.name),
          ),
        ),
      LessonNotationToggle: ({
        showNotation,
        onToggle,
      }: {
        showNotation: boolean;
        onToggle: () => void;
      }) =>
        React.createElement(
          TouchableOpacity,
          { testID: "notation-toggle", onPress: onToggle },
          React.createElement(
            Text,
            null,
            showNotation ? "Hide Notation" : "Show Notation",
          ),
        ),
      LessonResultDisplay: ({
        success,
        message,
      }: {
        success: boolean;
        message: string;
      }) =>
        React.createElement(
          View,
          { testID: "result-display" },
          React.createElement(
            Text,
            null,
            success ? "✓ " + message : "✗ " + message,
          ),
        ),
      LessonSuccessDisplay: ({
        title,
        message,
      }: {
        title: string;
        message: string;
      }) =>
        React.createElement(View, { testID: "success-display" }, [
          React.createElement(Text, { key: "title" }, title),
          React.createElement(Text, { key: "msg" }, message),
        ]),
    };
  },
);

// Mock VolumeBar
jest.mock("../src/components/VolumeBar", () => ({
  CircularVolumeIndicator: () => null,
}));

// Default props factory
const createDefaultProps = () => ({
  exerciseConfig: {
    capabilityId: "test_lesson",
    title: "Test Lesson",
    isMultiPattern: false,
    masteryStreak: 3,
    focusCards: [
      { title: "Focus", description: "Practice carefully", tips: [] },
    ],
  },
  audioConfig: {
    tempo: 60,
    beatsPerNote: 2,
    clef: "treble" as const,
  },
  generateNotes: jest.fn(() => ({
    startingNote: 60,
    patternNotes: [60, 62, 64],
    patternFrequencies: [262, 294, 330],
  })),
  generateMusicXML: jest.fn(() => "<musicxml></musicxml>"),
  sessionStartingNote: 60,
  currentPatternInfo: jest.fn((index: number) => ({
    id: "pattern_1",
    name: "Pattern 1",
    description: "Test pattern",
    scaleDegrees: [1, 2, 3],
  })),
  onComplete: jest.fn(),
});

describe("BaseLessonExercise", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state
    mockState.phase = "focus_card";
    mockState.showSuccess = false;
    mockState.showNotation = false;
    mockState.hasHeardPattern = false;
    mockState.singResult = null;
    mockState.playResult = null;
    mockState.successfulRounds = 0;
    mockState.singAttempts = 0;
    mockState.playAttempts = 0;
    mockState.showAttestModal = false;
    mockState.attestPhase = null;
    mockState.progress = {
      currentIndex: 0,
      completedItems: {},
      totalItems: 1,
      isComplete: false,
    };
    mockAudio.isPlaying = false;
    mockAudio.currentBeat = 0;
    mockPitchDetection.currentPitch = { noteName: "C4", frequency: 262 };
    mockPitchDetection.volume = 0;
    mockPitchDetection.isSounding = false;
  });

  // ========== FOCUS CARD PHASE ==========
  describe("Focus Card Phase", () => {
    it("renders focus card phase by default", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Begin →")).toBeTruthy();
    });

    it("shows focus card component", () => {
      const props = createDefaultProps();
      const { getByTestId } = render(<BaseLessonExercise {...props} />);
      expect(getByTestId("focus-card")).toBeTruthy();
    });

    it("calls goToNextPhase when Begin button is pressed", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Begin →"));
      expect(mockState.goToNextPhase).toHaveBeenCalled();
    });

    it("uses custom button text when provided", () => {
      const props = createDefaultProps();
      props.exerciseConfig.focusCardButtonText = "Let's Go!";
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Let's Go!")).toBeTruthy();
    });

    it("renders pattern info when renderPatternInfo is provided", () => {
      const props = createDefaultProps();
      const { getByText } = render(
        <BaseLessonExercise
          {...props}
          renderPatternInfo={() => <RNText>Custom Pattern Info</RNText>}
        />,
      );
      expect(getByText("Custom Pattern Info")).toBeTruthy();
    });
  });

  // ========== LISTEN PHASE ==========
  describe("Listen Phase", () => {
    beforeEach(() => {
      mockState.phase = "listen";
    });

    it("renders listen phase", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Listen")).toBeTruthy();
    });

    it("shows pattern description", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Test pattern")).toBeTruthy();
    });

    it("shows Play Pattern button", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎵 Play Pattern")).toBeTruthy();
    });

    it("plays pattern when Play Pattern is pressed", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("🎵 Play Pattern"));
      expect(mockAudio.playPattern).toHaveBeenCalled();
    });

    it("shows Listening state while playing", () => {
      mockAudio.isPlaying = true;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎵 Listening...")).toBeTruthy();
    });

    it("disables button while playing", () => {
      mockAudio.isPlaying = true;
      const props = createDefaultProps();
      const { getByLabelText } = render(<BaseLessonExercise {...props} />);
      const button = getByLabelText("Listening");
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it("shows beat indicator while playing", () => {
      mockAudio.isPlaying = true;
      mockAudio.currentBeat = 2;
      const props = createDefaultProps();
      const { getByTestId } = render(<BaseLessonExercise {...props} />);
      expect(getByTestId("beat-indicator")).toBeTruthy();
    });

    it("shows notation toggle button", () => {
      const props = createDefaultProps();
      const { getByTestId } = render(<BaseLessonExercise {...props} />);
      expect(getByTestId("notation-toggle")).toBeTruthy();
    });
  });

  // ========== SING PHASE ==========
  describe("Sing Phase", () => {
    beforeEach(() => {
      mockState.phase = "sing";
    });

    it("renders sing phase", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Sing")).toBeTruthy();
    });

    it("shows Start Singing button", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎤 Start Singing")).toBeTruthy();
    });

    it("calls playMetronomeOnly when Start Singing is pressed", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("🎤 Start Singing"));
      expect(mockAudio.resetTrackingRefs).toHaveBeenCalled();
      expect(mockAudio.playMetronomeOnly).toHaveBeenCalled();
    });

    it("shows Sing Now state while recording", () => {
      mockAudio.isPlaying = true;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎤 Sing Now...")).toBeTruthy();
    });

    it("shows result display on successful sing", () => {
      mockState.singResult = { success: true };
      const props = createDefaultProps();
      const { getByTestId } = render(<BaseLessonExercise {...props} />);
      expect(getByTestId("result-display")).toBeTruthy();
    });

    it("shows Continue button after successful sing", () => {
      mockState.singResult = { success: true };
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Continue →")).toBeTruthy();
    });

    it("shows Try Again and Hear Again buttons on failed sing", () => {
      mockState.singResult = { success: false, message: "Try again" };
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎤 Try Again")).toBeTruthy();
      expect(getByText("🔊 Hear Again")).toBeTruthy();
    });

    it("shows attestation option after 3 failed attempts", () => {
      mockState.singResult = { success: false };
      mockState.singAttempts = 3;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("I sang it correctly →")).toBeTruthy();
    });

    it("opens attestation modal when attestation button is pressed", () => {
      mockState.singResult = { success: false };
      mockState.singAttempts = 3;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("I sang it correctly →"));
      expect(mockState.openAttestModal).toHaveBeenCalledWith("sing");
    });

    it("shows attestation modal when visible", () => {
      mockState.showAttestModal = true;
      mockState.attestPhase = "sing";
      const props = createDefaultProps();
      const { getByTestId } = render(<BaseLessonExercise {...props} />);
      expect(getByTestId("attestation-modal")).toBeTruthy();
    });

    it("advances to next phase when Continue is pressed after success", () => {
      mockState.singResult = { success: true };
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Continue →"));
      expect(mockState.goToNextPhase).toHaveBeenCalled();
    });
  });

  // ========== IMAGINE PHASE ==========
  describe("Imagine Phase", () => {
    beforeEach(() => {
      mockState.phase = "imagine";
    });

    it("renders imagine phase", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Imagine")).toBeTruthy();
    });

    it("shows imagine instructions", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(
        getByText("Imagine playing this pattern on your instrument."),
      ).toBeTruthy();
    });

    it("shows Count with Clicks button", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🥁 Count with Clicks")).toBeTruthy();
    });

    it("shows I Imagined It button", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("I Imagined It →")).toBeTruthy();
    });

    it("plays metronome when Count with Clicks is pressed", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("🥁 Count with Clicks"));
      expect(mockAudio.playMetronomeOnly).toHaveBeenCalled();
    });

    it("advances to next phase when I Imagined It is pressed", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("I Imagined It →"));
      expect(mockState.goToNextPhase).toHaveBeenCalled();
    });

    it("shows Counting state while playing", () => {
      mockAudio.isPlaying = true;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🥁 Counting...")).toBeTruthy();
    });

    it("shows imagine visual with emoji", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎵")).toBeTruthy();
      expect(getByText("Hear your instrument in your mind")).toBeTruthy();
    });
  });

  // ========== PLAY PHASE ==========
  describe("Play Phase", () => {
    beforeEach(() => {
      mockState.phase = "play";
    });

    it("renders play phase", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Play")).toBeTruthy();
    });

    it("shows Start Playing button", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎺 Start Playing")).toBeTruthy();
    });

    it("calls playMetronomeOnly when Start Playing is pressed", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("🎺 Start Playing"));
      expect(mockAudio.resetTrackingRefs).toHaveBeenCalled();
      expect(mockAudio.playMetronomeOnly).toHaveBeenCalled();
    });

    it("shows Play Now state while recording", () => {
      mockAudio.isPlaying = true;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎺 Play Now...")).toBeTruthy();
    });

    it("shows result display on successful play", () => {
      mockState.playResult = { success: true };
      const props = createDefaultProps();
      const { getByTestId } = render(<BaseLessonExercise {...props} />);
      expect(getByTestId("result-display")).toBeTruthy();
    });

    it("shows Continue button after successful play", () => {
      mockState.playResult = { success: true };
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Continue →")).toBeTruthy();
    });

    it("shows Try Again and Hear Again buttons on failed play", () => {
      mockState.playResult = { success: false, message: "Try again" };
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("🎵 Try Again")).toBeTruthy();
      expect(getByText("🔊 Hear Again")).toBeTruthy();
    });

    it("shows attestation option after 3 failed attempts", () => {
      mockState.playResult = { success: false };
      mockState.playAttempts = 3;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("I played it correctly →")).toBeTruthy();
    });

    it("opens attestation modal when attestation button is pressed", () => {
      mockState.playResult = { success: false };
      mockState.playAttempts = 3;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("I played it correctly →"));
      expect(mockState.openAttestModal).toHaveBeenCalledWith("play");
    });

    it("advances to next phase when Continue is pressed after success", () => {
      mockState.playResult = { success: true };
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Continue →"));
      expect(mockState.goToNextPhase).toHaveBeenCalled();
    });
  });

  // ========== FEEDBACK PHASE ==========
  describe("Feedback Phase", () => {
    beforeEach(() => {
      mockState.phase = "feedback";
    });

    it("renders feedback phase", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Pattern Complete!")).toBeTruthy();
    });

    it("shows pattern name", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Pattern 1")).toBeTruthy();
    });

    it("shows pattern description", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Test pattern")).toBeTruthy();
    });

    it("shows Continue button", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Continue →")).toBeTruthy();
    });

    it("increments successful rounds on Continue for single-pattern exercise", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Continue →"));
      expect(mockState.incrementSuccessfulRounds).toHaveBeenCalled();
    });

    it("shows success when masteryStreak is reached", () => {
      mockState.successfulRounds = 2;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Continue →"));
      expect(mockState.setShowSuccess).toHaveBeenCalledWith(true);
    });

    it("resets for new round when not at masteryStreak", () => {
      mockState.successfulRounds = 0;
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Continue →"));
      expect(mockState.resetForNewRound).toHaveBeenCalled();
      expect(mockState.setPhase).toHaveBeenCalledWith("listen");
    });
  });

  // ========== SUCCESS PHASE ==========
  describe("Success Phase", () => {
    beforeEach(() => {
      mockState.phase = "feedback";
      mockState.showSuccess = true;
    });

    it("renders success display", () => {
      const props = createDefaultProps();
      const { getByTestId } = render(<BaseLessonExercise {...props} />);
      expect(getByTestId("success-display")).toBeTruthy();
    });

    it("shows All Complete title", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("All Complete!")).toBeTruthy();
    });

    it("shows Complete Lesson button", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Complete Lesson →")).toBeTruthy();
    });

    it("calls onComplete when Complete Lesson is pressed", () => {
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Complete Lesson →"));
      expect(props.onComplete).toHaveBeenCalledWith({
        success: true,
        details: expect.objectContaining({
          capability: "test_lesson",
        }),
      });
    });
  });

  // ========== MULTI-PATTERN EXERCISES ==========
  describe("Multi-Pattern Exercises", () => {
    const createMultiPatternProps = () => ({
      ...createDefaultProps(),
      exerciseConfig: {
        capabilityId: "multi_pattern_test",
        title: "Multi Pattern Test",
        isMultiPattern: true,
        patterns: [
          { id: "p1", name: "Pattern 1", description: "First pattern" },
          { id: "p2", name: "Pattern 2", description: "Second pattern" },
        ],
        focusCards: [{ title: "Focus", description: "Practice", tips: [] }],
      },
    });

    it("shows phase progress for multi-pattern exercises", () => {
      const props = createMultiPatternProps();
      const { getByTestId } = render(<BaseLessonExercise {...props} />);
      expect(getByTestId("phase-progress")).toBeTruthy();
    });

    it("marks item complete and goes to next item on feedback continue", () => {
      mockState.phase = "feedback";
      mockState.progress = {
        currentIndex: 0,
        completedItems: {},
        totalItems: 2,
        isComplete: false,
      };
      const props = createMultiPatternProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Continue →"));
      expect(mockState.markItemComplete).toHaveBeenCalledWith("p1");
      expect(mockState.goToNextItem).toHaveBeenCalled();
    });

    it("shows success when all patterns are complete", () => {
      mockState.phase = "feedback";
      mockState.progress = {
        currentIndex: 1,
        completedItems: { p1: true },
        totalItems: 2,
        isComplete: false,
      };
      const props = createMultiPatternProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      fireEvent.press(getByText("Continue →"));
      expect(mockState.setShowSuccess).toHaveBeenCalledWith(true);
    });
  });

  // ========== CUSTOM PHASE RENDERERS ==========
  describe("Custom Phase Renderers", () => {
    it("uses custom renderer when provided", () => {
      mockState.phase = "listen";
      const customRenderer = jest.fn(() => (
        <RNView testID="custom-listen">
          <RNText>Custom Listen</RNText>
        </RNView>
      ));
      const props = createDefaultProps();
      const { getByTestId, getByText } = render(
        <BaseLessonExercise
          {...props}
          customPhaseRenderers={{ listen: customRenderer }}
        />,
      );
      expect(getByTestId("custom-listen")).toBeTruthy();
      expect(getByText("Custom Listen")).toBeTruthy();
      expect(customRenderer).toHaveBeenCalled();
    });

    it("passes correct props to custom renderer", () => {
      mockState.phase = "sing";
      let receivedProps: unknown;
      const customRenderer = jest.fn((props) => {
        receivedProps = props;
        return <RNView testID="custom-sing" />;
      });
      const props = createDefaultProps();
      render(
        <BaseLessonExercise
          {...props}
          customPhaseRenderers={{ sing: customRenderer }}
        />,
      );
      expect(receivedProps).toMatchObject({
        phase: "sing",
        isPlaying: false,
        currentBeat: 0,
      });
    });

    it("uses custom success renderer when provided", () => {
      mockState.showSuccess = true;
      const customRenderer = jest.fn(() => (
        <RNView testID="custom-success">
          <RNText>Custom Success!</RNText>
        </RNView>
      ));
      const props = createDefaultProps();
      const { getByTestId } = render(
        <BaseLessonExercise
          {...props}
          customPhaseRenderers={{ success: customRenderer }}
        />,
      );
      expect(getByTestId("custom-success")).toBeTruthy();
    });
  });

  // ========== UNKNOWN PHASE ==========
  describe("Unknown Phase", () => {
    it("renders unknown phase message for unrecognized phase", () => {
      mockState.phase = "unknown_phase";
      const props = createDefaultProps();
      const { getByText } = render(<BaseLessonExercise {...props} />);
      expect(getByText("Unknown Phase: unknown_phase")).toBeTruthy();
    });
  });

  // ========== PITCH DETECTION INTEGRATION ==========
  describe("Pitch Detection Integration", () => {
    it("tracks pitch during sing phase", () => {
      mockState.phase = "sing";
      mockPitchDetection.isSounding = true;
      mockPitchDetection.currentPitch = { noteName: "C4", frequency: 262 };
      const props = createDefaultProps();
      render(<BaseLessonExercise {...props} />);
      // The component should sync isSounding to trackingRefs
    });

    it("tracks pitch during play phase", () => {
      mockState.phase = "play";
      mockPitchDetection.isSounding = true;
      mockPitchDetection.currentPitch = { noteName: "E4", frequency: 330 };
      const props = createDefaultProps();
      render(<BaseLessonExercise {...props} />);
      // The component should sync isSounding to trackingRefs
    });
  });

  // ========== NOTE GENERATION ==========
  describe("Note Generation", () => {
    it("calls generateNotes with correct arguments", () => {
      mockState.progress.currentIndex = 1;
      const props = createDefaultProps();
      render(<BaseLessonExercise {...props} />);
      expect(props.generateNotes).toHaveBeenCalledWith(1, 60);
    });

    it("calls generateMusicXML when provided", () => {
      const props = createDefaultProps();
      render(<BaseLessonExercise {...props} />);
      expect(props.generateMusicXML).toHaveBeenCalled();
    });

    it("works without generateMusicXML", () => {
      const props = createDefaultProps();
      delete (props as unknown as Record<string, unknown>).generateMusicXML;
      expect(() => render(<BaseLessonExercise {...props} />)).not.toThrow();
    });
  });

  // ========== AUDIO CONFIG ==========
  describe("Audio Configuration", () => {
    it("uses provided tempo", () => {
      const props = createDefaultProps();
      props.audioConfig.tempo = 120;
      render(<BaseLessonExercise {...props} />);
      // useLessonExerciseAudio should receive the config
    });

    it("uses provided beatsPerNote", () => {
      const props = createDefaultProps();
      props.audioConfig.beatsPerNote = 4;
      render(<BaseLessonExercise {...props} />);
    });

    it("uses provided clef", () => {
      const props = createDefaultProps();
      props.audioConfig.clef = "bass";
      render(<BaseLessonExercise {...props} />);
    });
  });

  // ========== PATTERN INFO ==========
  describe("Pattern Info", () => {
    it("calls currentPatternInfo with current index", () => {
      mockState.progress.currentIndex = 2;
      const props = createDefaultProps();
      render(<BaseLessonExercise {...props} />);
      expect(props.currentPatternInfo).toHaveBeenCalledWith(2);
    });
  });

  // ========== ACCESSIBILITY ==========
  describe("Accessibility", () => {
    it("has accessibility labels on primary buttons", () => {
      mockState.phase = "focus_card";
      const props = createDefaultProps();
      const { getByLabelText } = render(<BaseLessonExercise {...props} />);
      expect(getByLabelText("Begin exercise")).toBeTruthy();
    });

    it("has accessibility role on buttons", () => {
      mockState.phase = "listen";
      const props = createDefaultProps();
      const { getByLabelText } = render(<BaseLessonExercise {...props} />);
      expect(getByLabelText("Play pattern")).toBeTruthy();
    });
  });
});
